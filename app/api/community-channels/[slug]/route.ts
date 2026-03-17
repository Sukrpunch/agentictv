import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const slug = params.slug;

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get channel with videos
    const { data: channel, error } = await supabase
      .from('channels_community')
      .select(`
        *,
        owner:owner_id(id, display_name, avatar_url)
      `)
      .eq('slug', slug)
      .single();

    if (error || !channel) {
      return NextResponse.json({ error: 'Channel not found' }, { status: 404 });
    }

    // Get videos in channel
    let videos = [];
    if (channel.video_ids && channel.video_ids.length > 0) {
      const { data: videoData } = await supabase
        .from('videos')
        .select('*')
        .in('id', channel.video_ids);
      videos = videoData || [];
    }

    return NextResponse.json({ channel: { ...channel, videos } });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(
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

    // Update channel
    const { data: updated, error: updateError } = await supabase
      .from('channels_community')
      .update(body)
      .eq('slug', slug)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update channel' }, { status: 500 });
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

    // Delete channel
    const { error: deleteError } = await supabase
      .from('channels_community')
      .delete()
      .eq('slug', slug);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete channel' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
