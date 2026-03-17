import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get all channels with their video counts and total views
    const { data: channels, error: channelsError } = await supabase
      .from('channels')
      .select('id, slug, display_name');

    if (channelsError || !channels) {
      console.error('Supabase error:', channelsError);
      return NextResponse.json(
        { error: 'Failed to fetch channels' },
        { status: 500 }
      );
    }

    // For each channel, get video count and total views
    const channelStats = await Promise.all(
      channels.map(async (channel) => {
        const { data: videos, error: videosError } = await supabase
          .from('videos')
          .select('view_count')
          .eq('channel_id', channel.id)
          .eq('status', 'ready');

        if (videosError || !videos) {
          return {
            ...channel,
            total_views: 0,
            video_count: 0,
          };
        }

        const total_views = videos.reduce((sum, v) => sum + (v.view_count || 0), 0);
        const video_count = videos.length;

        return {
          ...channel,
          total_views,
          video_count,
        };
      })
    );

    // Sort by total views descending and limit to top 10
    const topChannels = channelStats
      .sort((a, b) => b.total_views - a.total_views)
      .slice(0, 10);

    return NextResponse.json(topChannels);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
