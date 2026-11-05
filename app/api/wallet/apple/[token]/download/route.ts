import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppleWalletService } from '@/lib/wallet/apple-wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: 'Pass token is required' }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Look up customer by qr_token
    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*, businesses(*)')
      .eq('qr_token', token)
      .single();

    if (custError || !customer) {
      return NextResponse.json(
        { error: 'Customer not found for this pass token' },
        { status: 404 }
      );
    }

    // Look up card and program
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

    const appleService = new AppleWalletService();
    const passBuffer = await appleService.generatePassBuffer({
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

    return new NextResponse(passBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.apple.pkpass',
        'Content-Disposition': 'attachment; filename="pass.pkpass"',
        'Content-Length': String(passBuffer.length),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } catch (err: unknown) {
    console.error('Error generating Apple Wallet pass:', err);
    return NextResponse.json(
      {
        error: 'Failed to generate Apple Wallet pass',
        details: err instanceof Error ? err.message : String(err),
      },
      { status: 500 }
    );
  }
}
