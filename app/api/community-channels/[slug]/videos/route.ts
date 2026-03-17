import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slug = params.slug;
    const body = await req.json();
    const { video_id } = body;

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing required field: video_id' },
        { status: 400 }
      );
    }

    // Get channel
    const { data: channel, error: getError } = await supabase
      .from('channels_community')
      .select('*')
      .eq('slug', slug)
      .single();

    if (getError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check ownership
    if (channel.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Verify video exists
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // Add video to channel
    const newVideoIds = [
      ...new Set([...(channel.video_ids || []), video_id]),
    ];

    const { data: updated, error: updateError } = await supabase
      .from('channels_community')
      .update({
        video_ids: newVideoIds,
        video_count: newVideoIds.length,
      })
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to add video' }, { status: 500 });
    }

    return NextResponse.json({ channel: updated });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const slug = params.slug;
    const searchParams = req.nextUrl.searchParams;
    const video_id = searchParams.get('video_id');

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing required parameter: video_id' },
        { status: 400 }
      );
    }

    // Get channel
    const { data: channel, error: getError } = await supabase
      .from('channels_community')
      .select('*')
      .eq('slug', slug)
      .single();

    if (getError || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Check ownership
    if (channel.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Remove video from channel
    const newVideoIds = (channel.video_ids || []).filter(id => id !== video_id);

    const { data: updated, error: updateError } = await supabase
      .from('channels_community')
      .update({
        video_ids: newVideoIds,
        video_count: newVideoIds.length,
      })
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to remove video' }, { status: 500 });
    }

    return NextResponse.json({ channel: updated });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
