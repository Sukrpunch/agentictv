import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get last 50 watched videos with details
    const { data, error } = await supabase
      .from('watch_history')
      .select(
        `
        *,
        videos(id, title, cloudflare_stream_id, thumbnail_url, duration_seconds, view_count, creator_id, created_at)
      `
      )
      .eq('user_id', user.id)
      .order('watched_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching watch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { video_id, watch_seconds } = await request.json();

    if (!video_id) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    // Upsert: update if exists, insert if not
    const { data, error } = await supabase
      .from('watch_history')
      .upsert(
        {
          user_id: user.id,
          video_id,
          watch_seconds: watch_seconds || 0,
          watched_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,video_id',
        }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error recording watch:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Clear all watch history for user
    const { error } = await supabase
      .from('watch_history')
      .delete()
      .eq('user_id', user.id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error clearing watch history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
