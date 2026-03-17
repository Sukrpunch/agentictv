import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
  try {
    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token with Supabase
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      description,
      category,
      tags,
      cloudflare_video_id,
      thumbnail_url,
      duration_seconds,
      genre,
      status = 'published',
      is_collab = false,
      is_remix = false,
      original_video_id,
    } = body;

    if (!title || !cloudflare_video_id) {
      return NextResponse.json(
        { error: 'Missing required fields: title, cloudflare_video_id' },
        { status: 400 }
      );
    }

    // Get user's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Insert video
    const { data: video, error: insertError } = await supabase
      .from('videos')
      .insert([
        {
          creator_id: profile.id,
          title,
          description: description || null,
          category: category || 'other',
          genre: genre || null,
          tags: tags || [],
          cloudflare_video_id,
          thumbnail_url: thumbnail_url || null,
          duration_seconds: duration_seconds || null,
          upload_status: status,
          is_collab,
          is_remix,
          original_video_id: original_video_id || null,
          status: 'ready', // Mark as ready since it's uploaded
        },
      ])
      .select();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to create video' }, { status: 500 });
    }

    // Create activity feed entry for video upload
    const newVideo = video?.[0];
    if (newVideo) {
      await supabase
        .from('activity_feed')
        .insert({
          type: 'video_upload',
          actor_id: profile.id,
          video_id: newVideo.id,
          metadata: {
            title: title,
            genre: genre || category || 'other',
          },
          is_public: true,
        })
        .catch(err => console.error('Failed to create activity feed entry:', err));
    }

    return NextResponse.json({ video: newVideo }, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    let user = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await supabase.auth.getUser(token);
      user = authUser;
    }

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's videos
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*')
      .eq('creator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    return NextResponse.json({ videos });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
