import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// Activity type descriptions with emojis
const activityDescriptions: Record<string, (metadata: any, actor: any) => string> = {
  video_upload: (metadata, actor) => 
    `🎬 ${actor?.username ? `@${actor.username}` : 'A creator'} just dropped "${metadata.title}"`,
  
  chart_number_one: (metadata, actor) =>
    `👑 "${metadata.title}" by ${actor?.username ? `@${actor.username}` : 'a creator'} just hit #1 on the charts`,
  
  challenge_winner: (metadata, actor) =>
    `🏆 ${actor?.username ? `@${actor.username}` : 'A creator'} won "${metadata.challenge_name}" · ${metadata.prize || '500 AGNT'} awarded`,
  
  challenge_opened: (metadata, actor) =>
    `⚔️ New challenge: "${metadata.title}" — ${metadata.prize || '500 AGNT'}`,
  
  milestone_views: (metadata, actor) =>
    `🎉 ${actor?.username ? `@${actor.username}` : 'A creator'} hit ${metadata.views || '1M'} views on "${metadata.title}"`,
  
  milestone_followers: (metadata, actor) =>
    `🎉 ${actor?.username ? `@${actor.username}` : 'A creator'} hit ${metadata.followers || '10K'} followers`,
  
  new_creator: (metadata, actor) =>
    `✨ ${actor?.username ? `@${actor.username}` : 'A new creator'} just joined Agentic TV`,
  
  featured: (metadata, actor) =>
    `🌟 "${metadata.title}" is now featured`,
  
  chart_entry: (metadata, actor) =>
    `📈 "${metadata.title}" by ${actor?.username ? `@${actor.username}` : 'a creator'} entered the charts`,
};

interface ActivityEntry {
  id: string;
  type: string;
  actor_id: string;
  video_id?: string;
  challenge_id?: string;
  metadata: Record<string, any>;
  created_at: string;
  profiles?: { username: string; display_name: string; avatar_url?: string };
  videos?: { title: string; cloudflare_video_id?: string };
  challenges?: { name: string };
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const limit = parseInt(searchParams.get('limit') || '20');
    const before = searchParams.get('before');

    let query = supabase
      .from('activity_feed')
      .select(
        `
        id,
        type,
        actor_id,
        video_id,
        challenge_id,
        metadata,
        created_at,
        profiles:actor_id (username, display_name, avatar_url),
        videos:video_id (title, cloudflare_video_id),
        challenges:challenge_id (name)
      `,
        { count: 'exact' }
      )
      .eq('is_public', true)
      .order('created_at', { ascending: false });

    if (before) {
      query = query.lt('created_at', before);
    }

    const { data, error, count } = await query.limit(limit);

    if (error) {
      console.error('Activity feed error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Enrich activity data with descriptions and links
    const enrichedData = (data || []).map((activity: ActivityEntry) => {
      const actor = Array.isArray(activity.profiles) ? activity.profiles[0] : activity.profiles;
      const video = Array.isArray(activity.videos) ? activity.videos[0] : activity.videos;

      let title = activityDescriptions[activity.type]?.(activity.metadata, actor) || 'Activity on Agentic TV';
      let actionUrl = '';
      let actionLabel = '';

      if (activity.type === 'video_upload' && video) {
        actionUrl = `/watch/${activity.video_id}`;
        actionLabel = '▶ Watch';
      } else if (activity.type === 'chart_number_one' && video) {
        actionUrl = '/charts';
        actionLabel = 'View Charts';
      } else if (activity.type === 'challenge_winner' && activity.challenge_id) {
        actionUrl = `/challenges/${activity.challenge_id}`;
        actionLabel = 'View Challenge';
      } else if (activity.type === 'challenge_opened' && activity.challenge_id) {
        actionUrl = `/challenges/${activity.challenge_id}`;
        actionLabel = 'Join Challenge';
      } else if (actor) {
        actionUrl = `/creators/${actor.username}`;
        actionLabel = 'View Creator';
      }

      let thumbnail = '';
      if (video?.cloudflare_video_id) {
        thumbnail = `https://videodelivery.net/${video.cloudflare_video_id}/thumbnails/thumbnail.jpg`;
      } else if (actor?.avatar_url) {
        thumbnail = actor.avatar_url;
      }

      return {
        id: activity.id,
        type: activity.type,
        title,
        description: activity.metadata.genre || '',
        actor: actor || { username: 'unknown', display_name: 'Unknown' },
        video: video || null,
        thumbnail,
        actionUrl,
        actionLabel,
        createdAt: activity.created_at,
        metadata: activity.metadata,
      };
    });

    return NextResponse.json({
      data: enrichedData,
      count,
      nextCursor: enrichedData.length === limit ? enrichedData[enrichedData.length - 1].createdAt : null,
    });
  } catch (err) {
    console.error('Activity feed error:', err);
    return NextResponse.json({ error: 'Failed to fetch activity feed' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ') && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== authHeader?.replace('Bearer ', '')) {
      // Allow service role key for backend operations
      const serviceKey = request.headers.get('x-service-key');
      if (!serviceKey || serviceKey !== process.env.SUPABASE_SERVICE_ROLE_KEY) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await request.json();
    const { type, actor_id, video_id, challenge_id, metadata, is_public } = body;

    if (!type || !['video_upload', 'chart_entry', 'chart_number_one', 'challenge_winner', 'challenge_opened', 'milestone_views', 'milestone_followers', 'new_creator', 'featured'].includes(type)) {
      return NextResponse.json({ error: 'Invalid activity type' }, { status: 400 });
    }

    const supabaseServer = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data, error } = await supabaseServer
      .from('activity_feed')
      .insert({
        type,
        actor_id,
        video_id,
        challenge_id,
        metadata: metadata || {},
        is_public: is_public !== false,
      })
      .select()
      .single();

    if (error) {
      console.error('Activity creation error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err) {
    console.error('Activity creation error:', err);
    return NextResponse.json({ error: 'Failed to create activity' }, { status: 500 });
  }
}
