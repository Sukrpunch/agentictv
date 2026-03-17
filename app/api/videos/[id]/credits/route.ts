import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: credits, error } = await supabase
      .from('video_credits')
      .select('*')
      .eq('video_id', id)
      .single();

    if (error?.code === 'PGRST116') {
      // No credits found, return null
      return NextResponse.json({ credits: null });
    }

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch credits' }, { status: 500 });
    }

    return NextResponse.json({ credits });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

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

    // Check ownership
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('creator_id')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { tools, prompt, notes, show_prompt } = body;

    // Check if credits already exist
    const { data: existingCredits, error: checkError } = await supabase
      .from('video_credits')
      .select('id')
      .eq('video_id', id)
      .single();

    if (checkError?.code === 'PGRST116') {
      // No existing credits, insert new ones
      const { data: credits, error: insertError } = await supabase
        .from('video_credits')
        .insert([
          {
            video_id: id,
            tools: tools || [],
            prompt,
            notes,
            show_prompt: show_prompt || false,
          },
        ])
        .select();

      if (insertError) {
        return NextResponse.json(
          { error: 'Failed to create credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({ credits: credits?.[0] });
    } else if (!checkError) {
      // Update existing credits
      const { data: credits, error: updateError } = await supabase
        .from('video_credits')
        .update({
          tools: tools || [],
          prompt,
          notes,
          show_prompt: show_prompt || false,
          updated_at: new Date().toISOString(),
        })
        .eq('video_id', id)
        .select();

      if (updateError) {
        return NextResponse.json(
          { error: 'Failed to update credits' },
          { status: 500 }
        );
      }

      return NextResponse.json({ credits: credits?.[0] });
    } else {
      return NextResponse.json(
        { error: 'Failed to check credits' },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // PUT is same as POST for upsert
  return POST(req, { params });
}
