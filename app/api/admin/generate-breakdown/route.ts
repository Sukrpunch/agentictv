import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day;
  return new Date(d.setDate(diff));
}

export async function POST(req: NextRequest) {
  try {
    // Verify admin key
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get the most recent completed week (last Sunday)
    const now = new Date();
    const weekStart = getWeekStart(now);
    // If today is Sunday, use last week. Otherwise, use the Sunday of this week
    if (now.getDay() === 0) {
      weekStart.setDate(weekStart.getDate() - 7);
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 7);

    // Get top video of the week
    const { data: topVideoData } = await supabase
      .from('watch_history')
      .select('video_id, videos!inner(*)')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString())
      .order('created_at', { ascending: false });

    const videoViewCounts = new Map<string, number>();
    topVideoData?.forEach(item => {
      const videoId = item.video_id;
      videoViewCounts.set(videoId, (videoViewCounts.get(videoId) || 0) + 1);
    });

    const topVideoId = Array.from(videoViewCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    // Get top creator of the week
    const { data: topCreatorData } = await supabase
      .from('watch_history')
      .select('videos!inner(creator_id)')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    const creatorViewCounts = new Map<string, number>();
    topCreatorData?.forEach(item => {
      const video = item.videos as any;
      if (video?.creator_id) {
        creatorViewCounts.set(
          video.creator_id,
          (creatorViewCounts.get(video.creator_id) || 0) + 1
        );
      }
    });

    const topCreatorId = Array.from(creatorViewCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0];

    // Get new creators count
    const { data: newCreators } = await supabase
      .from('profiles')
      .select('id')
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    const newCreatorsCount = newCreators?.length || 0;

    // Get total views for the week
    const { count: totalViews } = await supabase
      .from('watch_history')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', weekStart.toISOString())
      .lt('created_at', weekEnd.toISOString());

    // Get trending genre
    const { data: genreData } = await supabase
      .from('videos')
      .select('genre')
      .eq('upload_status', 'published')
      .order('view_count', { ascending: false })
      .limit(20);

    const genreFreq = new Map<string, number>();
    genreData?.forEach(item => {
      if (item.genre) {
        genreFreq.set(item.genre, (genreFreq.get(item.genre) || 0) + 1);
      }
    });

    const trendingGenre = Array.from(genreFreq.entries()).sort(
      (a, b) => b[1] - a[1]
    )[0]?.[0] || 'Mixed';

    // Fetch full video and creator data for highlight text
    let topVideoTitle = 'A Great Video';
    let topCreatorName = 'Someone';

    if (topVideoId) {
      const { data: videoData } = await supabase
        .from('videos')
        .select('title, creator_id')
        .eq('id', topVideoId)
        .single();

      topVideoTitle = videoData?.title || 'A Great Video';
    }

    if (topCreatorId) {
      const { data: creatorData } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', topCreatorId)
        .single();

      topCreatorName = creatorData?.display_name || creatorData?.username || 'Someone';
    }

    // Generate highlight text
    const weekOfDate = weekStart.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    const highlightText = `Week of ${weekOfDate}. "${topVideoTitle}" led the charts with ${videoViewCounts.get(topVideoId) || 0} views. ${newCreatorsCount} new creators joined. ${trendingGenre} dominated the feed. Another week in the books.`;

    // Upsert breakdown
    const { data: breakdown, error: upsertError } = await supabase
      .from('weekly_breakdowns')
      .upsert({
        week_start: weekStart.toISOString().split('T')[0],
        top_video_id: topVideoId || null,
        top_creator_id: topCreatorId || null,
        new_creators_count: newCreatorsCount,
        total_views_week: totalViews || 0,
        trending_genre: trendingGenre,
        highlight_text: highlightText,
        content: {
          top_video_title: topVideoTitle,
          top_creator_name: topCreatorName,
        },
        published_at: new Date().toISOString(),
      }, {
        onConflict: 'week_start',
      })
      .select()
      .single();

    if (upsertError) {
      console.error('Upsert error:', upsertError);
      return NextResponse.json(
        { error: 'Failed to create breakdown' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      breakdown,
      message: 'Breakdown generated successfully',
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
