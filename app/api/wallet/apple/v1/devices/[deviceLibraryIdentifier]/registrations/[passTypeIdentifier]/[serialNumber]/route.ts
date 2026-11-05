import { NextRequest, NextResponse } from 'next/server';

export async function POST(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier, serialNumber } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const pushToken = body.pushToken;

    console.log(
      `[Apple Wallet Web Service] Registered device ${deviceLibraryIdentifier} for pass ${serialNumber} (PassType: ${passTypeIdentifier}, PushToken: ${pushToken ? 'provided' : 'none'})`
    );

    // Return 201 Created or 200 OK
    return new NextResponse(null, { status: 201 });
  } catch (err: unknown) {
    console.error('Apple registration error:', err);
    return new NextResponse(null, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
      serialNumber: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, serialNumber } = await params;
    const authHeader = request.headers.get('authorization');

    if (!authHeader?.startsWith('ApplePass ')) {
      return new NextResponse(null, { status: 401 });
    }

    console.log(
      `[Apple Wallet Web Service] Unregistered device ${deviceLibraryIdentifier} for pass ${serialNumber}`
    );

    return new NextResponse(null, { status: 200 });
  } catch (err: unknown) {
    console.error('Apple unregistration error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
