import { NextResponse } from 'next/server';
import { getCurrentUserProfile, updateBusinessSettings } from '@/lib/services/business';

export async function GET() {
  try {
    const { business, program } = await getCurrentUserProfile();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    return NextResponse.json({
      success: true,
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

export async function POST(request: Request) {
  try {
    const { business } = await getCurrentUserProfile();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { businessName, primaryColor, stampsRequired, rewardTitle } = body;

    const result = await updateBusinessSettings({
      businessId: business.id,
      name: businessName,
      primaryColor,
      stampsRequired: Number(stampsRequired) || 5,
      rewardTitle: rewardTitle || 'Free Haircut',
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Server error' },
      { status: 500 }
    );
  }
}
