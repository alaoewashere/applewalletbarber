import { NextResponse } from 'next/server';
import { addStampToCustomer } from '@/lib/services/loyalty';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { customerId, idempotencyKey, notes } = body;

    if (!customerId) {
      return NextResponse.json(
        { success: false, error: 'Customer ID is required.' },
        { status: 400 }
      );
    }

    const result = await addStampToCustomer({
      customerId,
      idempotencyKey,
      notes,
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
