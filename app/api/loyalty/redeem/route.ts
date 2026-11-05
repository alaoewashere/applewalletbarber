import { NextResponse } from 'next/server';
import { redeemCustomerReward } from '@/lib/services/loyalty';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    let { rewardId, customerId, idempotencyKey } = body;

    const supabase = await createServerSupabaseClient();

    // If rewardId is not directly passed, locate the active available reward for this customer
    if (!rewardId && customerId) {
      const { data: reward } = await supabase
        .from('rewards')
        .select('id')
        .eq('customer_id', customerId)
        .eq('status', 'available')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (reward) {
        rewardId = reward.id;
      }
    }

    if (!rewardId) {
      return NextResponse.json(
        { success: false, error: 'No available reward found for this customer.' },
        { status: 400 }
      );
    }

    const result = await redeemCustomerReward({
      rewardId,
      idempotencyKey,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
