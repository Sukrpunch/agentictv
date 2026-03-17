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
    const period = searchParams.get('period') || 'week'; // day, week, month

    // Calculate date cutoff
    const today = new Date();
    let cutoffDate: Date;

    switch (period) {
      case 'day':
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 1);
        break;
      case 'month':
        cutoffDate = new Date(today);
        cutoffDate.setMonth(today.getMonth() - 1);
        break;
      case 'week':
      default:
        cutoffDate = new Date(today);
        cutoffDate.setDate(today.getDate() - 7);
    }

    // Fetch videos with view and like counts
    const { data: videos, error } = await supabase
      .from('videos')
      .select(`
        id,
        title,
        description,
        cloudflare_stream_id,
        duration_seconds,
        view_count,
        created_at,
        channel_id,
        channels (
          id,
          slug,
          display_name
        ),
        likes (count)
      `)
      .eq('status', 'ready')
      .gte('created_at', cutoffDate.toISOString())
      .order('view_count', { ascending: false })
      .limit(100);

    if (error) {
      console.error('Error fetching trending videos:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Calculate engagement score and sort
    const scored = (videos || []).map((video: any) => ({
      ...video,
      engagement_score: (video.view_count || 0) + (video.likes?.[0]?.count || 0),
      like_count: video.likes?.[0]?.count || 0,
      thumbnail_url: video.cloudflare_stream_id
        ? `https://videodelivery.net/${video.cloudflare_stream_id}/thumbnails/thumbnail.jpg`
        : '/placeholder-thumbnail.jpg',
    }));

    // Sort by engagement and limit to 20
    scored.sort((a, b) => b.engagement_score - a.engagement_score);
    const trending = scored.slice(0, 20);

    // Calculate trending indicators (percentage growth)
    const trendingIndicators = await Promise.all(
      trending.map(async (video: any) => {
        // Calculate growth from previous period
        const prevCutoff = new Date(cutoffDate);
        const periodDays = Math.floor((today.getTime() - cutoffDate.getTime()) / (1000 * 60 * 60 * 24));
        prevCutoff.setDate(cutoffDate.getDate() - periodDays);

        const { count: prevViewCount } = await supabase
          .from('views')
          .select('id', { count: 'exact', head: true })
          .eq('video_id', video.id)
          .gte('created_at', prevCutoff.toISOString())
          .lt('created_at', cutoffDate.toISOString());

        const growth =
          (prevViewCount || 0) > 0
            ? Math.round(((video.view_count - (prevViewCount || 0)) / (prevViewCount || 1)) * 100)
            : 0;

        return {
          ...video,
          growth_percentage: growth,
        };
      })
    );

    return NextResponse.json({
      period,
      period_start: cutoffDate.toISOString().split('T')[0],
      videos: trendingIndicators,
    });
  } catch (error: any) {
    console.error('Trending API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
