import { createServerSupabaseClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { Customer, CustomerWithCard, DashboardMetrics, LoyaltyCard, Reward } from '@/types/database';
import { walletService } from '@/lib/wallet/wallet-service';
import crypto from 'crypto';

export function generateSecureQrToken(): string {
  // 16 bytes URL-safe random token
  return crypto.randomBytes(16).toString('hex');
}

export async function createCustomer({
  businessId,
  fullName,
  phone,
  email,
}: {
  businessId: string;
  fullName: string;
  phone?: string | null;
  email?: string | null;
}): Promise<{ success: boolean; customer?: Customer; error?: string }> {
  const supabase = await createServerSupabaseClient();

  // 1. Fetch active loyalty program for this business
  const { data: program, error: progError } = await supabase
    .from('loyalty_programs')
    .select('*')
    .eq('business_id', businessId)
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (progError || !program) {
    return { success: false, error: 'No active loyalty program found for this business.' };
  }

  // 2. Insert customer with unique qr_token
  const qrToken = generateSecureQrToken();
  const { data: customer, error: custError } = await supabase
    .from('customers')
    .insert({
      business_id: businessId,
      full_name: fullName.trim(),
      phone: phone?.trim() || null,
      email: email?.trim() || null,
      qr_token: qrToken,
    })
    .select()
    .single();

  if (custError || !customer) {
    return { success: false, error: custError?.message || 'Failed to create customer.' };
  }

  // 3. Create initial loyalty card for the customer
  const { data: card, error: cardError } = await supabase
    .from('loyalty_cards')
    .insert({
      customer_id: customer.id,
      business_id: businessId,
      program_id: program.id,
      current_stamps: 0,
      total_stamps_earned: 0,
      status: 'active',
    })
    .select()
    .single();

  if (cardError || !card) {
    return { success: false, error: cardError?.message || 'Failed to create loyalty card.' };
  }

  // 4. Initialize wallet entries via WalletService
  const { data: business } = await supabase
    .from('businesses')
    .select('name, primary_color')
    .eq('id', businessId)
    .single();

  const syncResult = await walletService.syncCardToWallets({
    customerId: customer.id,
    customerName: customer.full_name,
    businessName: business?.name || 'Barbershop',
    primaryColor: business?.primary_color || '#18181b',
    currentStamps: 0,
    stampsRequired: program.stamps_required,
    rewardTitle: program.reward_title,
    isRewardUnlocked: false,
    qrToken: customer.qr_token,
    barcodeValue: customer.qr_token,
  });

  // Record wallet card rows
  const walletInserts = [
    {
      customer_id: customer.id,
      loyalty_card_id: card.id,
      business_id: businessId,
      provider: 'apple',
      external_card_id: syncResult.apple.externalCardId || null,
      wallet_url: syncResult.apple.cardUrl || null,
      status: syncResult.apple.success ? 'active' : 'failed',
    },
    {
      customer_id: customer.id,
      loyalty_card_id: card.id,
      business_id: businessId,
      provider: 'google',
      external_card_id: syncResult.google.externalCardId || null,
      wallet_url: syncResult.google.cardUrl || null,
      status: syncResult.google.success ? 'active' : 'failed',
    },
  ];

  await supabase.from('wallet_cards').insert(walletInserts);

  return { success: true, customer };
}

export async function getCustomerById(
  customerId: string,
  providedClient?: any
): Promise<CustomerWithCard | null> {
  const supabase = providedClient || (await createServerSupabaseClient());

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('id', customerId)
    .single();

  if (custError || !customer) return null;

  // Fetch card
  const { data: card } = await supabase
    .from('loyalty_cards')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch program
  let program = null;
  if (card) {
    const { data: prog } = await supabase
      .from('loyalty_programs')
      .select('*')
      .eq('id', card.program_id)
      .single();
    program = prog;
  }

  // Fetch available reward if any
  const { data: availableReward } = await supabase
    .from('rewards')
    .select('*')
    .eq('customer_id', customer.id)
    .eq('status', 'available')
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch recent transactions
  const { data: transactions } = await supabase
    .from('loyalty_transactions')
    .select('*')
    .eq('customer_id', customer.id)
    .order('created_at', { ascending: false })
    .limit(20);

  return {
    ...customer,
    card: card || null,
    program: program || null,
    available_reward: availableReward || null,
    recent_transactions: transactions || [],
  };
}

export async function getCustomerByQrToken(qrToken: string): Promise<CustomerWithCard | null> {
  // Use admin client so unauthenticated public customer pass requests succeed
  const supabase = createAdminClient();

  const { data: customer, error: custError } = await supabase
    .from('customers')
    .select('*')
    .eq('qr_token', qrToken)
    .single();

  if (custError || !customer) return null;

  return getCustomerById(customer.id, supabase);
}

export async function searchCustomers({
  businessId,
  query = '',
  limit = 20,
}: {
  businessId: string;
  query?: string;
  limit?: number;
}): Promise<CustomerWithCard[]> {
  const supabase = await createServerSupabaseClient();

  let queryBuilder = supabase
    .from('customers')
    .select(`
      *,
      loyalty_cards (*),
      rewards (*)
    `)
    .eq('business_id', businessId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (query.trim()) {
    const q = query.trim();
    queryBuilder = queryBuilder.or(`full_name.ilike.%${q}%,phone.ilike.%${q}%`);
  }

  const { data, error } = await queryBuilder;
  if (error || !data) return [];

  return data.map((item: any) => {
    const card = Array.isArray(item.loyalty_cards) ? item.loyalty_cards[0] : null;
    const availableReward = Array.isArray(item.rewards)
      ? item.rewards.find((r: Reward) => r.status === 'available')
      : null;

    return {
      id: item.id,
      business_id: item.business_id,
      full_name: item.full_name,
      phone: item.phone,
      email: item.email,
      qr_token: item.qr_token,
      created_at: item.created_at,
      updated_at: item.updated_at,
      card: card || null,
      available_reward: availableReward || null,
    };
  });
}

export async function getDashboardMetrics(businessId: string): Promise<DashboardMetrics> {
  const supabase = await createServerSupabaseClient();

  // 1. Total customers
  const { count: totalCustomers } = await supabase
    .from('customers')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId);

  // 2. Active loyalty cards
  const { count: activeCards } = await supabase
    .from('loyalty_cards')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'active');

  // 3. Stamps added today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const { count: stampsToday } = await supabase
    .from('loyalty_transactions')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('action', 'stamp_added')
    .gte('created_at', today.toISOString());

  // 4. Available rewards
  const { count: availableRewards } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'available');

  // 5. Total redeemed
  const { count: totalRedeemed } = await supabase
    .from('rewards')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', businessId)
    .eq('status', 'redeemed');

  return {
    totalCustomers: totalCustomers || 0,
    activeCards: activeCards || 0,
    stampsToday: stampsToday || 0,
    availableRewards: availableRewards || 0,
    totalRedeemed: totalRedeemed || 0,
  };
}
