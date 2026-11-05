import { NextRequest, NextResponse } from 'next/server';
import { getBusinessBySlug } from '@/lib/services/business';
import { createAdminClient } from '@/lib/supabase/admin';
import { generateSecureQrToken } from '@/lib/services/customer';
import { walletService } from '@/lib/wallet/wallet-service';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ businessSlug: string }> }
) {
  try {
    const { businessSlug } = await params;
    const body = await request.json().catch(() => ({}));
    const { fullName, phone } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json(
        { success: false, error: 'Full name is required to create your loyalty pass.' },
        { status: 400 }
      );
    }

    const { business, program } = await getBusinessBySlug(businessSlug);

    if (!business || !program) {
      return NextResponse.json(
        { success: false, error: 'Barbershop not found.' },
        { status: 404 }
      );
    }

    const admin = createAdminClient();
    const qrToken = generateSecureQrToken();

    // 1. Create customer
    const { data: customer, error: custError } = await admin
      .from('customers')
      .insert({
        business_id: business.id,
        full_name: fullName.trim(),
        phone: phone?.trim() || null,
        qr_token: qrToken,
      })
      .select()
      .single();

    if (custError || !customer) {
      return NextResponse.json(
        { success: false, error: custError?.message || 'Failed to create loyalty pass.' },
        { status: 500 }
      );
    }

    // 2. Create initial loyalty card (0 stamps)
    const { data: card, error: cardError } = await admin
      .from('loyalty_cards')
      .insert({
        customer_id: customer.id,
        business_id: business.id,
        program_id: program.id,
        current_stamps: 0,
        total_stamps_earned: 0,
        status: 'active',
      })
      .select()
      .single();

    if (cardError || !card) {
      return NextResponse.json(
        { success: false, error: cardError?.message || 'Failed to initialize card.' },
        { status: 500 }
      );
    }

    // 3. Pre-initialize wallet sync asynchronously
    try {
      const syncResult = await walletService.syncCardToWallets({
        customerId: customer.id,
        customerName: customer.full_name,
        businessName: business.name,
        primaryColor: business.primary_color || '#18181b',
        currentStamps: 0,
        stampsRequired: program.stamps_required,
        rewardTitle: program.reward_title,
        isRewardUnlocked: false,
        qrToken: customer.qr_token,
        barcodeValue: customer.qr_token,
      });

      await admin.from('wallet_cards').insert([
        {
          customer_id: customer.id,
          loyalty_card_id: card.id,
          business_id: business.id,
          provider: 'apple',
          external_card_id: syncResult.apple.externalCardId || null,
          wallet_url: syncResult.apple.cardUrl || null,
          status: syncResult.apple.success ? 'active' : 'failed',
        },
        {
          customer_id: customer.id,
          loyalty_card_id: card.id,
          business_id: business.id,
          provider: 'google',
          external_card_id: syncResult.google.externalCardId || null,
          wallet_url: syncResult.google.cardUrl || null,
          status: syncResult.google.success ? 'active' : 'failed',
        },
      ]);
    } catch (wErr) {
      console.warn('Wallet initialization notice:', wErr);
    }

    return NextResponse.json({
      success: true,
      customer,
      loyaltyCard: card,
      business,
      program,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
