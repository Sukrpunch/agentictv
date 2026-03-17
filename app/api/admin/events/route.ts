import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminKey = process.env.ADMIN_KEY || 'AgenticAdmin2026!';

export async function GET(req: NextRequest) {
  try {
    // Verify admin key
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: events, error } = await supabase
      .from('live_events')
      .select('*')
      .order('scheduled_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin key
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      title,
      theme,
      description,
      scheduled_at,
      duration_minutes = 90,
      playlist = [],
    } = body;

    if (!title || !theme || !scheduled_at) {
      return NextResponse.json(
        { error: 'Missing required fields: title, theme, scheduled_at' },
        { status: 400 }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: event, error } = await supabase
      .from('live_events')
      .insert([
        {
          title,
          theme,
          description: description || null,
          scheduled_at,
          duration_minutes,
          playlist,
          status: 'scheduled',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Insert error:', error);
      return NextResponse.json({ error: 'Failed to create event' }, { status: 500 });
    }

    return NextResponse.json({ event }, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
