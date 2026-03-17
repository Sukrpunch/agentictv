import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(req.url);
    const weekParam = searchParams.get('week');

    // Get the most recent Monday if no week specified
    let weekStart: Date;
    if (weekParam) {
      weekStart = new Date(weekParam);
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() - daysBack);
    }

    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Fetch chart entries with video and creator details
    const { data: entries, error } = await supabase
      .from('chart_entries')
      .select(`
        *,
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
        )
      `)
      .eq('week_start', weekStartStr)
      .order('position', { ascending: true })
      .limit(20);

    if (error) {
      console.error('Error fetching chart entries:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Helper function for Mason commentary
    function masonCommentary(entry: any): string {
      const video = entry.videos;
      if (entry.position === 1 && entry.weeks_on_chart === 1) {
        return `New at number one. ${video.title} is the moment.`;
      }
      if (entry.position === 1) {
        return `${entry.weeks_on_chart} weeks at the top. ${video.title} owns the screen.`;
      }
      if (entry.is_new_entry) {
        return `New entry at #${entry.position}. Watch this creator.`;
      }
      if (entry.is_bullet) {
        return `The bullet — up ${entry.prev_position! - entry.position} spots to #${entry.position}. ${video.title} is catching fire.`;
      }
      if (entry.prev_position && entry.prev_position < entry.position) {
        return `Dropping from #${entry.prev_position} to #${entry.position}. Still holding ground.`;
      }
      if (entry.prev_position && entry.prev_position > entry.position) {
        return `Up ${entry.prev_position - entry.position} this week to #${entry.position}.`;
      }
      return `Steady at #${entry.position} for ${entry.weeks_on_chart} weeks.`;
    }

    // Map entries with commentary
    const enrichedEntries = entries.map((entry: any) => ({
      ...entry,
      mason_commentary: masonCommentary(entry),
      thumbnail_url: entry.videos?.cloudflare_stream_id
        ? `https://videodelivery.net/${entry.videos.cloudflare_stream_id}/thumbnails/thumbnail.jpg`
        : '/placeholder-thumbnail.jpg',
    }));

    return NextResponse.json({
      week_start: weekStartStr,
      entries: enrichedEntries,
    });
  } catch (error: any) {
    console.error('Chart API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
