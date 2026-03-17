import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const { id: challengeId } = params;
    const body = await req.json();
    const { video_id } = body;

    if (!video_id) {
      return NextResponse.json(
        { error: 'Missing video_id' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is open
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('starts_at, ends_at, status')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const now = new Date();
    if (now < new Date(challenge.starts_at) || now >= new Date(challenge.ends_at)) {
      return NextResponse.json(
        { error: 'Challenge is not open for entries' },
        { status: 400 }
      );
    }

    // Verify video exists and belongs to user
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, channel_id, channels(id, owner_email)')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const userEmail = user.email || '';
    const videoOwnerEmail = video.channels?.owner_email || '';

    if (videoOwnerEmail !== userEmail) {
      return NextResponse.json(
        { error: 'You do not own this video' },
        { status: 403 }
      );
    }

    // Check if user already has an entry in this challenge
    const { data: existingEntry, error: checkError } = await supabase
      .from('challenge_entries')
      .select('id')
      .eq('challenge_id', challengeId)
      .eq('creator_id', user.id)
      .single();

    if (existingEntry) {
      return NextResponse.json(
        { error: 'You have already submitted an entry to this challenge' },
        { status: 400 }
      );
    }

    // Create entry
    const { data: entry, error: insertError } = await supabase
      .from('challenge_entries')
      .insert([
        {
          challenge_id: challengeId,
          video_id: video_id,
          creator_id: user.id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating entry:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    return NextResponse.json(entry, { status: 201 });
  } catch (error: any) {
    console.error('Challenge entry error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
