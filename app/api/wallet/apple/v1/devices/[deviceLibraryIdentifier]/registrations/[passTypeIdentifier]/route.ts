import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  {
    params,
  }: {
    params: Promise<{
      deviceLibraryIdentifier: string;
      passTypeIdentifier: string;
    }>;
  }
) {
  try {
    const { deviceLibraryIdentifier, passTypeIdentifier } = await params;
    const url = new URL(request.url);
    const passesUpdatedSince = url.searchParams.get('passesUpdatedSince');

    console.log(
      `[Apple Wallet Web Service] Device ${deviceLibraryIdentifier} polled passes for ${passTypeIdentifier} since ${passesUpdatedSince || 'beginning'}`
    );

    // If no passes are pending update, return 204 No Content
    return new NextResponse(null, { status: 204 });
  } catch (err: unknown) {
    console.error('Apple Web Service check updates error:', err);
    return new NextResponse(null, { status: 500 });
  }
}
