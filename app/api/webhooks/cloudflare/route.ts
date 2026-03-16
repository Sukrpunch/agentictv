import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Cloudflare Stream webhook payload
    const { uid, status, duration, preview } = body;

    if (!uid) {
      return NextResponse.json({ error: 'Invalid webhook payload' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Find video by Cloudflare stream ID
    const { data: videoData, error: findError } = await supabase
      .from('videos')
      .select('id')
      .eq('cloudflare_stream_id', uid)
      .single();

    if (findError || !videoData) {
      console.error('Video not found:', findError);
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Update video status based on Cloudflare status
    const videoStatus = status === 'ready' ? 'ready' : status === 'error' ? 'error' : 'processing';
    const thumbnail_url = preview ? `https://customer-${uid}.cloudflarestream.com/thumbnail.jpg` : null;

    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: videoStatus,
        duration_seconds: duration ? Math.round(duration) : null,
        thumbnail_url,
      })
      .eq('id', videoData.id);

    if (updateError) {
      console.error('Error updating video:', updateError);
      return NextResponse.json({ error: 'Update failed' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
