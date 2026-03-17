import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

function getStatusFromTimestamps(now: Date, startsAt: Date, endsAt: Date, votingEndsAt: Date): string {
  if (now < startsAt) return 'upcoming';
  if (now < endsAt) return 'open';
  if (now < votingEndsAt) return 'voting';
  return 'complete';
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { id } = await params;

    // Fetch challenge details
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('*')
      .eq('id', id)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const now = new Date();
    const computedStatus = getStatusFromTimestamps(
      now,
      new Date(challenge.starts_at),
      new Date(challenge.ends_at),
      new Date(challenge.voting_ends_at)
    );

    // Fetch entries with video and creator details
    const { data: entries, error: entriesError } = await supabase
      .from('challenge_entries')
      .select(`
        id,
        challenge_id,
        video_id,
        creator_id,
        vote_count,
        submitted_at,
        videos (
          id,
          title,
          cloudflare_stream_id,
          duration_seconds,
          channel_id,
          channels (
            id,
            slug,
            display_name
          )
        ),
        profiles (
          id,
          username,
          avatar_url
        )
      `)
      .eq('challenge_id', id)
      .order('vote_count', { ascending: false });

    if (entriesError) {
      console.error('Error fetching entries:', entriesError);
    }

    // Fetch winner details if exists
    let winner = null;
    if (challenge.winner_video_id) {
      const { data: winnerVideo } = await supabase
        .from('videos')
        .select(`
          id,
          title,
          cloudflare_stream_id,
          channel_id,
          channels (
            id,
            slug,
            display_name
          )
        `)
        .eq('id', challenge.winner_video_id)
        .single();

      winner = winnerVideo;
    }

    return NextResponse.json({
      challenge: {
        ...challenge,
        computed_status: computedStatus,
      },
      entries: (entries || []).map((entry: any) => ({
        ...entry,
        thumbnail_url: entry.videos?.cloudflare_stream_id
          ? `https://videodelivery.net/${entry.videos.cloudflare_stream_id}/thumbnails/thumbnail.jpg`
          : '/placeholder-thumbnail.jpg',
      })),
      winner: winner ? {
        ...winner,
        thumbnail_url: winner.cloudflare_stream_id
          ? `https://videodelivery.net/${winner.cloudflare_stream_id}/thumbnails/thumbnail.jpg`
          : '/placeholder-thumbnail.jpg',
      } : null,
    });
  } catch (error: any) {
    console.error('Challenge detail error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
