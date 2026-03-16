import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { filename, size } = await request.json();

    if (!process.env.CLOUDFLARE_ACCOUNT_ID || !process.env.CLOUDFLARE_STREAM_TOKEN) {
      throw new Error('Cloudflare credentials missing');
    }

    // Request upload URL from Cloudflare Stream API
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CLOUDFLARE_ACCOUNT_ID}/stream/direct_upload`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.CLOUDFLARE_STREAM_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          maxDurationSeconds: 3600,
          filename,
          size,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${error.errors?.[0]?.message || 'Unknown error'}`);
    }

    const data: any = await response.json();

    return NextResponse.json({
      uploadUrl: data.result.uploadURL,
      streamId: data.result.uid,
    });
  } catch (error: any) {
    console.error('Upload error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
