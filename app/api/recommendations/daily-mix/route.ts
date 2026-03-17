import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);
  return error ? null : user;
}

export async function GET(req: NextRequest) {
  try {
    const user = await getUser(req);
    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Get user's watch history (last 30 videos)
    const { data: watchHistory } = await supabase
      .from('watch_history')
      .select('video_id, videos(genre, category, creator_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    // Get user's liked videos
    const { data: likedVideos } = await supabase
      .from('likes')
      .select('video_id, videos(genre, category, creator_id)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(20);

    // Get user's follows
    const { data: follows } = await supabase
      .from('follows')
      .select('following_id')
      .eq('follower_id', user.id);

    const followedCreatorIds = new Set(follows?.map(f => f.following_id) || []);

    // Extract genres and categories from history
    const genreFreq = new Map<string, number>();
    const categoryFreq = new Map<string, number>();
    let topGenre = '';
    let maxGenreCount = 0;

    watchHistory?.forEach(item => {
      const video = item.videos as any;
      if (video?.genre) {
        const count = (genreFreq.get(video.genre) || 0) + 1;
        genreFreq.set(video.genre, count);
        if (count > maxGenreCount) {
          maxGenreCount = count;
          topGenre = video.genre;
        }
      }
      if (video?.category) {
        categoryFreq.set(video.category, (categoryFreq.get(video.category) || 0) + 1);
      }
    });

    // Get all published videos (excluding recently watched)
    const recentlyWatchedIds = new Set(watchHistory?.map(h => h.video_id) || []);

    const { data: allVideos } = await supabase
      .from('videos')
      .select('*')
      .eq('upload_status', 'published')
      .order('view_count', { ascending: false })
      .limit(500);

    // Score videos
    const scoredVideos = (allVideos || []).map(video => {
      let score = 0;

      // Avoid recently watched
      if (recentlyWatchedIds.has(video.id)) {
        score -= 5;
      }

      // Genre match
      if (video.genre && video.genre === topGenre) {
        score += 3;
      } else if (video.genre && genreFreq.has(video.genre)) {
        score += 1;
      }

      // Creator follow
      if (video.creator_id && followedCreatorIds.has(video.creator_id)) {
        score += 2;
      }

      // Trending (high view count)
      if (video.view_count > 100) {
        score += 1;
      }

      return { ...video, score };
    });

    // Sort by score and shuffle top 20 for variety
    const topScored = scoredVideos
      .filter(v => v.score >= 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    // Shuffle top 20
    const shuffled = topScored.sort(() => Math.random() - 0.5).slice(0, 10);

    // Cold start: if user has no history, return top 10 by view_count
    const recommendations = shuffled.length > 0 
      ? shuffled 
      : (allVideos || []).slice(0, 10);

    return NextResponse.json({
      recommendations,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
