import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AppleWalletService } from '@/lib/wallet/apple-wallet';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ passTypeIdentifier: string; serialNumber: string }> }
) {
  try {
    const { serialNumber } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: customer, error: custError } = await supabase
      .from('customers')
      .select('*, businesses(*)')
      .eq('qr_token', serialNumber)
      .single();

    if (custError || !customer) {
      return new NextResponse(null, { status: 404 });
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
        'Last-Modified': new Date(card?.updated_at || customer.updated_at).toUTCString(),
      },
    });
  } catch (err: unknown) {
    console.error('Apple Web Service pass retrieval error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
