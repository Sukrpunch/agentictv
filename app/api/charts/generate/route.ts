import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_KEY = process.env.ADMIN_KEY || 'AgenticAdmin2026!';

export async function POST(req: NextRequest) {
  try {
    // Check admin key
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Calculate week_start (most recent Monday)
    const today = new Date();
    const dayOfWeek = today.getDay();
    const daysBack = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - daysBack);
    const weekStartStr = weekStart.toISOString().split('T')[0];

    // Calculate 7 days back
    const sevenDaysAgo = new Date(today);
    sevenDaysAgo.setDate(today.getDate() - 7);

    // Fetch all published videos with their engagement metrics from the last 7 days
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        view_count,
        created_at,
        likes (count),
        comments (count)
      `)
      .eq('status', 'ready')
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('view_count', { ascending: false })
      .limit(100);

    if (videosError) {
      console.error('Error fetching videos:', videosError);
      return NextResponse.json({ error: videosError.message }, { status: 500 });
    }

    // Calculate scores and get tips
    const videoScores = await Promise.all(
      (videos || []).map(async (video: any) => {
        // Get tips count
        const { count: tipsCount } = await supabase
          .from('tips')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', video.id)
          .gte('created_at', sevenDaysAgo.toISOString());

        const viewCount = video.view_count || 0;
        const uniqueViewers = viewCount; // Simplified: using view_count
        const likeCount = video.likes?.[0]?.count || 0;
        const commentCount = video.comments?.[0]?.count || 0;
        const tipCount = tipsCount || 0;

        // Calculate score: (view_count × 0.4) + (unique_viewers × 0.25) + (like_count × 0.20) + (comment_count × 0.10) + (tip_count × 0.05)
        const score =
          viewCount * 0.4 +
          uniqueViewers * 0.25 +
          likeCount * 0.2 +
          commentCount * 0.1 +
          tipCount * 0.05;

        return {
          video_id: video.id,
          score,
          view_count_week: viewCount,
          unique_viewers_week: uniqueViewers,
          like_count_week: likeCount,
          comment_count_week: commentCount,
          tip_count_week: tipCount,
        };
      })
    );

    // Sort by score descending
    videoScores.sort((a, b) => b.score - a.score);

    // Get previous week's positions for comparison
    const sevenDaysBackDate = new Date(today);
    sevenDaysBackDate.setDate(today.getDate() - 14);
    const prevWeekStart = new Date(sevenDaysBackDate);
    prevWeekStart.setDate(sevenDaysBackDate.getDate() - (sevenDaysBackDate.getDay() === 0 ? 6 : sevenDaysBackDate.getDay() - 1));
    const prevWeekStartStr = prevWeekStart.toISOString().split('T')[0];

    const { data: prevEntries } = await supabase
      .from('chart_entries')
      .select('video_id, position')
      .eq('week_start', prevWeekStartStr);

    const prevPositions: Record<string, number> = {};
    (prevEntries || []).forEach((entry: any) => {
      prevPositions[entry.video_id] = entry.position;
    });

    // Prepare chart entries (top 20)
    const chartEntries = videoScores.slice(0, 20).map((scoreData, index) => {
      const position = index + 1;
      const prevPosition = prevPositions[scoreData.video_id] || null;
      const isBullet = prevPosition && prevPosition - position >= 10;
      const isNewEntry = !prevPosition;

      return {
        week_start: weekStartStr,
        position,
        prev_position: prevPosition,
        video_id: scoreData.video_id,
        score: scoreData.score,
        view_count_week: scoreData.view_count_week,
        unique_viewers_week: scoreData.unique_viewers_week,
        like_count_week: scoreData.like_count_week,
        comment_count_week: scoreData.comment_count_week,
        tip_count_week: scoreData.tip_count_week,
        peak_position: Math.min(position, prevPosition || 999),
        weeks_on_chart: prevPosition ? 2 : 1, // Simplified calculation
        is_new_entry: isNewEntry,
        is_bullet: isBullet,
      };
    });

    // Upsert entries
    const { error: upsertError } = await supabase
      .from('chart_entries')
      .upsert(chartEntries, { onConflict: 'week_start,position' });

    if (upsertError) {
      console.error('Error upserting chart entries:', upsertError);
      return NextResponse.json({ error: upsertError.message }, { status: 500 });
    }

    return NextResponse.json({
      message: 'Chart generated successfully',
      week_start: weekStartStr,
      entries_count: chartEntries.length,
    });
  } catch (error: any) {
    console.error('Chart generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
