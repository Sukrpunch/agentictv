import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import crypto from 'crypto';

// Cloudflare webhook secret (should be in env)
const WEBHOOK_SECRET = process.env.CLOUDFLARE_WEBHOOK_SECRET || '';

export async function POST(request: NextRequest) {
  const supabase = getSupabaseAdmin();

  try {
    // Verify webhook signature
    const signature = request.headers.get('x-signature');
    if (signature && WEBHOOK_SECRET) {
      const body = await request.text();
      const expectedSignature = crypto
        .createHmac('sha256', WEBHOOK_SECRET)
        .update(body)
        .digest('hex');

      if (signature !== expectedSignature) {
        console.warn('Invalid webhook signature');
        return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
      }

      // Parse the body after verification
      const payload = JSON.parse(body);
      await handleWebhook(payload, supabase);
    } else {
      // If no secret configured, still process but log warning
      const payload = await request.json();
      await handleWebhook(payload, supabase);
    }

    // Always return 200 to prevent Cloudflare retries
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: any) {
    console.error('Webhook error:', error);
    // Still return 200 to prevent retries
    return NextResponse.json({ success: true }, { status: 200 });
  }
}

async function handleWebhook(payload: any, supabase: any) {
  try {
    const { uid, status, duration, preview, eventTimestamp } = payload;
    const eventType = status || 'unknown';

    // Log event to webhook_events table
    await supabase.from('webhook_events').insert({
      event_type: eventType,
      payload,
    });

    if (!uid) {
      console.warn('Invalid webhook payload: missing uid');
      return;
    }

    // Handle different event types
    switch (eventType) {
      case 'stream.live.connected':
        console.log(`Stream live: ${uid}`);
        break;

      case 'stream.video.finished':
      case 'ready':
        await handleVideoReady(uid, duration, preview, supabase);
        break;

      case 'stream.video.failed':
      case 'error':
        await handleVideoError(uid, supabase);
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
  } catch (err) {
    console.error('Error handling webhook:', err);
    // Don't throw - we've already logged the event
  }
}

async function handleVideoReady(
  streamId: string,
  duration: number | null,
  preview: boolean | null,
  supabase: any
) {
  try {
    // Find video by Cloudflare stream ID
    const { data: videoData, error: findError } = await supabase
      .from('videos')
      .select('id, channel_id')
      .eq('cloudflare_stream_id', streamId)
      .single();

    if (findError || !videoData) {
      console.error('Video not found:', findError);
      return;
    }

    // Update video status
    const thumbnail_url = preview ? `https://customer-${streamId}.cloudflarestream.com/thumbnail.jpg` : null;

    const { error: updateError } = await supabase
      .from('videos')
      .update({
        status: 'ready',
        duration_seconds: duration ? Math.round(duration) : null,
        thumbnail_url,
      })
      .eq('id', videoData.id);

    if (updateError) {
      console.error('Error updating video:', updateError);
      return;
    }

    console.log(`Video ${videoData.id} is ready`);

    // Update channel total_views and video_count
    const { data: channelData } = await supabase
      .from('channels')
      .select('video_count')
      .eq('id', videoData.channel_id)
      .single();

    if (channelData) {
      await supabase
        .from('channels')
        .update({ video_count: (channelData.video_count || 0) + 1 })
        .eq('id', videoData.channel_id);
    }

    // TODO: Send email notification when Resend is configured
  } catch (err) {
    console.error('Error handling video ready:', err);
  }
}

async function handleVideoError(streamId: string, supabase: any) {
  try {
    // Find video by Cloudflare stream ID
    const { data: videoData, error: findError } = await supabase
      .from('videos')
      .select('id')
      .eq('cloudflare_stream_id', streamId)
      .single();

    if (findError || !videoData) {
      console.error('Video not found:', findError);
      return;
    }

    // Update video status to error
    const { error: updateError } = await supabase
      .from('videos')
      .update({ status: 'error' })
      .eq('id', videoData.id);

    if (updateError) {
      console.error('Error updating video:', updateError);
      return;
    }

    console.log(`Video ${videoData.id} processing failed`);

    // TODO: Send error notification to creator when Resend is configured
  } catch (err) {
    console.error('Error handling video error:', err);
  }
}
