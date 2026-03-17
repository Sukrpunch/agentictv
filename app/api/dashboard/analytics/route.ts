import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface AnalyticsResponse {
  overview: {
    total_views: number;
    total_views_change: number;
    total_viewers: number;
    total_viewers_change: number;
    total_likes: number;
    total_likes_change: number;
    total_followers: number;
    total_followers_change: number;
    total_tips: number;
    total_tips_change: number;
    total_videos: number;
    avg_watch_time_seconds: number;
    completion_rate: number;
  };
  views_over_time: { date: string; views: number }[];
  top_videos: {
    id: string;
    title: string;
    views: number;
    likes: number;
    tips: number;
    viewers: number;
    watch_time_minutes: number;
    thumbnail_url: string | null;
  }[];
  follower_growth: { date: string; followers: number }[];
  genre_breakdown: { genre: string; count: number; views: number }[];
  recent_activity: {
    type: 'view' | 'like' | 'follow' | 'tip' | 'comment';
    created_at: string;
    actor_username?: string;
    video_title?: string;
  }[];
}

function getPeriodDates(period: string): { start: Date; end: Date; prevStart: Date; prevEnd: Date } {
  const end = new Date();
  let start = new Date();

  switch (period) {
    case '7d':
      start.setDate(end.getDate() - 7);
      break;
    case '30d':
      start.setDate(end.getDate() - 30);
      break;
    case '90d':
      start.setDate(end.getDate() - 90);
      break;
    case 'all':
      start = new Date('2000-01-01');
      break;
    default:
      start.setDate(end.getDate() - 30);
  }

  const prevEnd = new Date(start);
  const diff = end.getTime() - start.getTime();
  const prevStart = new Date(prevEnd.getTime() - diff);

  return { start, end, prevStart, prevEnd };
}

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

    const searchParams = request.nextUrl.searchParams;
    const period = searchParams.get('period') || '30d';

    const { start, end, prevStart, prevEnd } = getPeriodDates(period);

    // Get creator's videos
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('id, title, genre, thumbnail_url, view_count, duration_seconds, created_at')
      .eq('creator_id', user.id);

    if (videosError) throw videosError;
    if (!videos || videos.length === 0) {
      return NextResponse.json({
        overview: {
          total_views: 0,
          total_views_change: 0,
          total_viewers: 0,
          total_viewers_change: 0,
          total_likes: 0,
          total_likes_change: 0,
          total_followers: 0,
          total_followers_change: 0,
          total_tips: 0,
          total_tips_change: 0,
          total_videos: 0,
          avg_watch_time_seconds: 0,
          completion_rate: 0,
        },
        views_over_time: [],
        top_videos: [],
        follower_growth: [],
        genre_breakdown: [],
        recent_activity: [],
      } as AnalyticsResponse);
    }

    const videoIds = videos.map((v) => v.id);

    // Get watch history for current period
    const { data: currentWatches } = await supabase
      .from('watch_history')
      .select('user_id, watch_seconds, watched_at, video_id')
      .in('video_id', videoIds)
      .gte('watched_at', start.toISOString())
      .lte('watched_at', end.toISOString());

    // Get watch history for previous period
    const { data: prevWatches } = await supabase
      .from('watch_history')
      .select('user_id, watch_seconds, video_id')
      .in('video_id', videoIds)
      .gte('watched_at', prevStart.toISOString())
      .lte('watched_at', prevEnd.toISOString());

    // Get likes for current period
    const { data: currentLikes } = await supabase
      .from('video_likes')
      .select('id, created_at, video_id')
      .in('video_id', videoIds)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Get likes for previous period
    const { data: prevLikes } = await supabase
      .from('video_likes')
      .select('id')
      .in('video_id', videoIds)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    // Get follower counts
    const { data: currentFollowers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', user.id);

    const { data: prevFollowers } = await supabase
      .from('follows')
      .select('id')
      .eq('following_id', user.id)
      .lte('created_at', prevEnd.toISOString());

    // Get tips for current period
    const { data: currentTips } = await supabase
      .from('agnt_tips')
      .select('amount, created_at, video_id')
      .in('video_id', videoIds)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString());

    // Get tips for previous period
    const { data: prevTipsData } = await supabase
      .from('agnt_tips')
      .select('amount')
      .in('video_id', videoIds)
      .gte('created_at', prevStart.toISOString())
      .lte('created_at', prevEnd.toISOString());

    // Get comments
    const { data: currentComments } = await supabase
      .from('comments')
      .select('id, created_at, content, user_id, video_id, profiles(username)')
      .in('video_id', videoIds)
      .gte('created_at', start.toISOString())
      .lte('created_at', end.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Calculate metrics
    const currentViewCount = currentWatches?.length || 0;
    const prevViewCount = prevWatches?.length || 0;
    const currentUniqueViewers = new Set(currentWatches?.map((w) => w.user_id)).size;
    const prevUniqueViewers = new Set(prevWatches?.map((w) => w.user_id)).size;

    const currentLikeCount = currentLikes?.length || 0;
    const prevLikeCount = prevLikes?.length || 0;
    const currentFollowerCount = currentFollowers?.length || 0;
    const prevFollowerCount = prevFollowers?.length || 0;

    const currentTipsAmount = currentTips?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;
    const prevTipsAmount = prevTipsData?.reduce((sum, t) => sum + (t.amount || 0), 0) || 0;

    // Calculate average watch time and completion rate
    const totalWatchSeconds = currentWatches?.reduce((sum, w) => sum + (w.watch_seconds || 0), 0) || 0;
    const avgWatchTimeSeconds =
      currentViewCount > 0 ? Math.round(totalWatchSeconds / currentViewCount) : 0;

    // Calculate completion rate from watch_history
    const avgVideoDuration = videos.reduce((sum, v) => sum + (v.duration_seconds || 0), 0) / videos.length;
    const completionRate =
      avgVideoDuration > 0 ? Math.round((avgWatchTimeSeconds / avgVideoDuration) * 100) : 0;

    // Generate views over time
    const viewsOverTime: { date: string; views: number }[] = [];
    const dateMap = new Map<string, number>();

    currentWatches?.forEach((watch) => {
      const date = new Date(watch.watched_at).toISOString().split('T')[0];
      dateMap.set(date, (dateMap.get(date) || 0) + 1);
    });

    // Fill in all dates in the range
    const currentDate = new Date(start);
    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      viewsOverTime.push({
        date: dateStr,
        views: dateMap.get(dateStr) || 0,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    // Get follower growth over time
    const { data: allFollows } = await supabase
      .from('follows')
      .select('created_at')
      .eq('following_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: true });

    const followerGrowth: { date: string; followers: number }[] = [];
    let cumulativeFollowers = prevFollowerCount;
    const followerDateMap = new Map<string, number>();

    allFollows?.forEach((follow) => {
      const date = new Date(follow.created_at).toISOString().split('T')[0];
      followerDateMap.set(date, (followerDateMap.get(date) || 0) + 1);
    });

    const currentDate2 = new Date(start);
    while (currentDate2 <= end) {
      const dateStr = currentDate2.toISOString().split('T')[0];
      cumulativeFollowers += followerDateMap.get(dateStr) || 0;
      followerGrowth.push({
        date: dateStr,
        followers: cumulativeFollowers,
      });
      currentDate2.setDate(currentDate2.getDate() + 1);
    }

    // Genre breakdown
    const genreMap = new Map<string, { count: number; views: number }>();
    videos.forEach((video) => {
      const genre = video.genre || 'Uncategorized';
      const views = currentWatches?.filter((w) => w.video_id === video.id).length || 0;
      const current = genreMap.get(genre) || { count: 0, views: 0 };
      genreMap.set(genre, {
        count: current.count + 1,
        views: current.views + views,
      });
    });

    const genreBreakdown = Array.from(genreMap.entries())
      .map(([genre, data]) => ({
        genre,
        count: data.count,
        views: data.views,
      }))
      .sort((a, b) => b.views - a.views);

    // Top videos with detailed stats
    const topVideos = videos
      .map((video) => {
        const videoWatches = currentWatches?.filter((w) => w.video_id === video.id) || [];
        const videoLikes = currentLikes?.filter((l) => l.video_id === video.id) || [];
        const videoTips = currentTips?.filter((t) => t.video_id === video.id) || [];
        const viewCount = videoWatches.length;
        const likeCount = videoLikes.length;
        const tipsAmount = videoTips.reduce((sum, t) => sum + (t.amount || 0), 0);
        const uniqueViewers = new Set(videoWatches.map((w) => w.user_id)).size;
        const watchTimeMinutes = Math.round(
          videoWatches.reduce((sum, w) => sum + (w.watch_seconds || 0), 0) / 60
        );

        return {
          id: video.id,
          title: video.title,
          views: viewCount,
          likes: likeCount,
          tips: tipsAmount,
          viewers: uniqueViewers,
          watch_time_minutes: watchTimeMinutes,
          thumbnail_url: video.thumbnail_url,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // Recent activity
    const recentActivity: AnalyticsResponse['recent_activity'] = [];

    // Add recent views
    currentWatches
      ?.slice(0, 5)
      .forEach((watch) => {
        const video = videos.find((v) => v.id === watch.video_id);
        if (video) {
          recentActivity.push({
            type: 'view',
            created_at: watch.watched_at,
            video_title: video.title,
          });
        }
      });

    // Add recent likes
    currentLikes
      ?.slice(0, 5)
      .forEach((like) => {
        const video = videos.find((v) => v.id === like.video_id);
        if (video) {
          recentActivity.push({
            type: 'like',
            created_at: like.created_at,
            video_title: video.title,
          });
        }
      });

    // Add recent follows
    const { data: recentFollows } = await supabase
      .from('follows')
      .select('created_at, follower_id, profiles(username)')
      .eq('following_id', user.id)
      .gte('created_at', start.toISOString())
      .order('created_at', { ascending: false })
      .limit(5);

    recentFollows?.forEach((follow) => {
      recentActivity.push({
        type: 'follow',
        created_at: follow.created_at,
        actor_username: (follow.profiles as any)?.username || 'Unknown',
      });
    });

    // Add recent tips
    currentTips
      ?.slice(0, 5)
      .forEach((tip) => {
        const video = videos.find((v) => v.id === tip.video_id);
        if (video) {
          recentActivity.push({
            type: 'tip',
            created_at: tip.created_at,
            video_title: video.title,
          });
        }
      });

    // Add recent comments
    (currentComments || []).forEach((comment) => {
      recentActivity.push({
        type: 'comment',
        created_at: comment.created_at,
        actor_username: (comment.profiles as any)?.username || 'Unknown',
        video_title: comment.video_id, // We'll need to look this up
      });
    });

    // Sort by date and limit to 20
    recentActivity.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    recentActivity.slice(0, 20);

    // Calculate percent changes
    const viewsChange = prevViewCount > 0 ? ((currentViewCount - prevViewCount) / prevViewCount) * 100 : 0;
    const viewersChange =
      prevUniqueViewers > 0 ? ((currentUniqueViewers - prevUniqueViewers) / prevUniqueViewers) * 100 : 0;
    const likesChange = prevLikeCount > 0 ? ((currentLikeCount - prevLikeCount) / prevLikeCount) * 100 : 0;
    const followersChange =
      prevFollowerCount > 0
        ? ((currentFollowerCount - prevFollowerCount) / prevFollowerCount) * 100
        : 0;
    const tipsChange = prevTipsAmount > 0 ? ((currentTipsAmount - prevTipsAmount) / prevTipsAmount) * 100 : 0;

    const response: AnalyticsResponse = {
      overview: {
        total_views: currentViewCount,
        total_views_change: Math.round(viewsChange * 100) / 100,
        total_viewers: currentUniqueViewers,
        total_viewers_change: Math.round(viewersChange * 100) / 100,
        total_likes: currentLikeCount,
        total_likes_change: Math.round(likesChange * 100) / 100,
        total_followers: currentFollowerCount,
        total_followers_change: Math.round(followersChange * 100) / 100,
        total_tips: Math.round(currentTipsAmount),
        total_tips_change: Math.round(tipsChange * 100) / 100,
        total_videos: videos.length,
        avg_watch_time_seconds: avgWatchTimeSeconds,
        completion_rate: completionRate,
      },
      views_over_time: viewsOverTime,
      top_videos: topVideos,
      follower_growth: followerGrowth,
      genre_breakdown: genreBreakdown,
      recent_activity: recentActivity.slice(0, 20),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
