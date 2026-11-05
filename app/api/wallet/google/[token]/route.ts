import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleWalletService } from '@/lib/wallet/google-wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Token is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*, businesses(*)')
      .eq('qr_token', token)
      .single();

    if (custError || !customer) {
      return NextResponse.json({ error: 'Customer not found' }, { status: 404 });
    }

    const { data: card } = await supabase
      .from('loyalty_cards')
      .select('*, loyalty_programs(*)')
      .eq('customer_id', customer.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const business = customer.businesses;
    const program = card?.loyalty_programs;

    const currentStamps = card?.current_stamps || 0;
    const stampsRequired = program?.stamps_required || 5;
    const rewardTitle = program?.reward_title || 'Free Haircut';

    const googleService = new GoogleWalletService();
    const result = await googleService.createPass({
      customerId: customer.id,
      customerName: customer.full_name,
      businessName: business?.name || 'Yoused Barber',
      primaryColor: business?.primary_color || '#18181b',
      currentStamps,
      stampsRequired,
      rewardTitle,
      isRewardUnlocked: currentStamps >= stampsRequired,
      qrToken: customer.qr_token,
      barcodeValue: customer.qr_token,
    });

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Google Wallet is not configured yet.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      saveUrl: result.cardUrl,
    });
  } catch (err: unknown) {
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
