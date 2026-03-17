import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const tool = searchParams.get('tool');
    const q = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '50');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    let query = supabase
      .from('prompt_archive')
      .select(`
        *,
        creator:creator_id(id, display_name, avatar_url),
        video:video_id(id, title, cloudflare_stream_id)
      `)
      .order('use_count', { ascending: false });

    if (tool && tool !== 'all') {
      query = query.eq('tool', tool);
    }

    if (q) {
      query = query.ilike('prompt', `%${q}%`);
    }

    const { data: prompts, error } = await query.limit(limit);

    if (error) {
      console.error('Error fetching prompts:', error);
      return NextResponse.json({ error: 'Failed to fetch prompts' }, { status: 500 });
    }

    return NextResponse.json({ prompts });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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

    const body = await req.json();
    const {
      video_id,
      tool,
      tool_version,
      prompt,
      settings = {},
      genre,
      tags = [],
      is_public = true,
    } = body;

    if (!tool || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: tool, prompt' },
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

    // Only insert if public
    if (!is_public) {
      return NextResponse.json({
        message: 'Prompt saved privately',
        prompt: null,
      });
    }

    // Insert prompt
    const { data: newPrompt, error: insertError } = await supabase
      .from('prompt_archive')
      .insert([
        {
          video_id: video_id || null,
          creator_id: profile.id,
          tool,
          tool_version: tool_version || null,
          prompt,
          settings,
          genre: genre || null,
          tags,
          use_count: 0,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json({ error: 'Failed to save prompt' }, { status: 500 });
    }

    return NextResponse.json({ prompt: newPrompt }, { status: 201 });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
