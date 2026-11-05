import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    console.warn('[Apple Wallet Log from Device]:', JSON.stringify(body));
    return new NextResponse(null, { status: 200 });
  } catch (err: unknown) {
    return new NextResponse(null, { status: 200 });
  }
}
