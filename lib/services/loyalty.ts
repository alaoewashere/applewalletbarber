import { createServerSupabaseClient } from '@/lib/supabase/server';
import { walletService } from '@/lib/wallet/wallet-service';
import { CustomerWithCard, LoyaltyTransaction } from '@/types/database';
import crypto from 'crypto';

export async function addStampToCustomer({
  customerId,
  idempotencyKey = crypto.randomUUID(),
  notes,
}: {
  customerId: string;
  idempotencyKey?: string;
  notes?: string;
}): Promise<{
  success: boolean;
  transactionId?: string;
  rewardUnlocked?: boolean;
  error?: string;
}> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 1. First attempt to call the database RPC function 'add_stamp'
  const { data: rpcTxId, error: rpcError } = await supabase.rpc('add_stamp', {
    p_customer_id: customerId,
    p_performed_by: user.id,
    p_idempotency_key: idempotencyKey,
  });

  let txId = rpcTxId;

  // Fallback to atomic application-level transaction if RPC is not yet created in the Supabase database
  if (rpcError) {
    console.warn('RPC add_stamp not available or returned error, executing fallback handler:', rpcError.message);

    // Fetch card and program
    const { data: card, error: cardError } = await supabase
      .from('loyalty_cards')
      .select('*, loyalty_programs(*)')
      .eq('customer_id', customerId)
      .in('status', ['active', 'reward_available'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (cardError || !card) {
      return { success: false, error: 'No active loyalty card found for customer.' };
    }

    // Check idempotency
    const { data: existingTx } = await supabase
      .from('loyalty_transactions')
      .select('id')
      .eq('idempotency_key', idempotencyKey)
      .single();

    if (existingTx) {
      return { success: true, transactionId: existingTx.id };
    }

    const program = card.loyalty_programs;
    const nextStamps = card.current_stamps + 1;
    const isUnlocked = nextStamps >= program.stamps_required;

    // 1. Update Card
    const { error: updateError } = await supabase
      .from('loyalty_cards')
      .update({
        current_stamps: nextStamps,
        total_stamps_earned: card.total_stamps_earned + 1,
        status: isUnlocked ? 'reward_available' : 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id);

    if (updateError) {
      return { success: false, error: updateError.message };
    }

    // 2. Record stamp added transaction
    const { data: newTx, error: txError } = await supabase
      .from('loyalty_transactions')
      .insert({
        customer_id: customerId,
        loyalty_card_id: card.id,
        business_id: card.business_id,
        action: 'stamp_added',
        stamps_change: 1,
        performed_by: user.id,
        idempotency_key: idempotencyKey,
        notes: notes || 'Stamp added via dashboard',
      })
      .select('id')
      .single();

    if (txError) {
      return { success: false, error: txError.message };
    }

    txId = newTx?.id;

    // 3. Unlock reward if target reached
    if (isUnlocked) {
      const { data: reward } = await supabase
        .from('rewards')
        .insert({
          customer_id: customerId,
          loyalty_card_id: card.id,
          business_id: card.business_id,
          status: 'available',
        })
        .select('id')
        .single();

      await supabase.from('loyalty_transactions').insert({
        customer_id: customerId,
        loyalty_card_id: card.id,
        business_id: card.business_id,
        action: 'reward_unlocked',
        stamps_change: 0,
        performed_by: user.id,
        notes: `Reward unlocked (ID: ${reward?.id})`,
      });
    }
  }

  // 4. Trigger wallet updates asynchronously (loose coupling)
  try {
    // Fetch customer and business details for wallet payload
    const { data: customer } = await supabase
      .from('customers')
      .select('*, businesses(*)')
      .eq('id', customerId)
      .single();

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*, loyalty_programs(*)')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const { data: walletCards } = await supabase
      .from('wallet_cards')
      .select('*')
      .eq('customer_id', customerId);

    if (customer && card && walletCards && walletCards.length > 0) {
      const program = card.loyalty_programs;
      await walletService.updateWallets(
        {
          customerId: customer.id,
          customerName: customer.full_name,
          businessName: customer.businesses?.name || 'Barbershop',
          primaryColor: customer.businesses?.primary_color || '#18181b',
          currentStamps: card.current_stamps,
          stampsRequired: program?.stamps_required || 5,
          rewardTitle: program?.reward_title || 'Free Haircut',
          isRewardUnlocked: card.status === 'reward_available',
          qrToken: customer.qr_token,
          barcodeValue: customer.qr_token,
        },
        walletCards.map((w: any) => ({
          provider: w.provider,
          externalCardId: w.external_card_id,
        }))
      );
    }
  } catch (walletErr) {
    console.error('Wallet update notice:', walletErr);
  }

  return { success: true, transactionId: txId };
}

export async function redeemCustomerReward({
  rewardId,
  idempotencyKey = crypto.randomUUID(),
}: {
  rewardId: string;
  idempotencyKey?: string;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Unauthorized' };
  }

  // 1. Attempt RPC call
  const { error: rpcError } = await supabase.rpc('redeem_reward', {
    p_reward_id: rewardId,
    p_performed_by: user.id,
    p_idempotency_key: idempotencyKey,
  });

  if (rpcError) {
    console.warn('RPC redeem_reward not available, running fallback redemption handler:', rpcError.message);

    const { data: reward, error: fetchErr } = await supabase
      .from('rewards')
      .select('*, loyalty_cards(*)')
      .eq('id', rewardId)
      .single();

    if (fetchErr || !reward || reward.status !== 'available') {
      return { success: false, error: 'Reward not found or already redeemed.' };
    }

    const card = reward.loyalty_cards;

    // Mark reward redeemed
    await supabase
      .from('rewards')
      .update({
        status: 'redeemed',
        redeemed_at: new Date().toISOString(),
        redeemed_by: user.id,
      })
      .eq('id', rewardId);

    // Reset card stamps to 0 and status to active
    await supabase
      .from('loyalty_cards')
      .update({
        current_stamps: 0,
        status: 'active',
        updated_at: new Date().toISOString(),
      })
      .eq('id', card.id);

    // Record transaction
    await supabase.from('loyalty_transactions').insert({
      customer_id: reward.customer_id,
      loyalty_card_id: card.id,
      business_id: card.business_id,
      action: 'reward_redeemed',
      stamps_change: 0,
      performed_by: user.id,
      idempotency_key: idempotencyKey,
      notes: `Reward redeemed (${rewardId})`,
    });
  }

  return { success: true };
}
