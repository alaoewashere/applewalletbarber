import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { getCurrentUserProfile } from '@/lib/services/business';
import { createCustomer } from '@/lib/services/customer';

export async function POST(request: Request) {
  try {
    const { business } = await getCurrentUserProfile();

    if (!business) {
      return NextResponse.json({ success: false, error: 'Unauthorized or business not found.' }, { status: 401 });
    }

    const body = await request.json();
    const { fullName, phone, email } = body;

    if (!fullName || !fullName.trim()) {
      return NextResponse.json({ success: false, error: 'Customer full name is required.' }, { status: 400 });
    }

    const result = await createCustomer({
      businessId: business.id,
      fullName,
      phone,
      email,
    });

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 });
    }

    return NextResponse.json({ success: true, customer: result.customer });
  } catch (err: unknown) {
    return NextResponse.json(
      { success: false, error: err instanceof Error ? err.message : 'Internal Server Error' },
      { status: 500 }
    );
  }
}
