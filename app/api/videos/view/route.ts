import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';
import { awardAGNT, AGNT_REWARDS } from '@/lib/agnt';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Increment view count and get new count
    const { data: currentVideo } = await supabase
      .from('videos')
      .select('view_count, channel_id')
      .eq('id', videoId)
      .single();

    if (!currentVideo) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const newViewCount = (currentVideo.view_count || 0) + 1;

    const { error } = await supabase
      .from('videos')
      .update({ view_count: newViewCount })
      .eq('id', videoId);

    if (error) {
      console.error('Error incrementing views:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Award AGNT every 100 views to the video owner
    const previousViewCount = currentVideo.view_count || 0;
    const previousMilestone = Math.floor(previousViewCount / 100);
    const currentMilestone = Math.floor(newViewCount / 100);

    if (currentMilestone > previousMilestone) {
      // Get channel owner
      const { data: channel } = await supabase
        .from('channels')
        .select('owner_email')
        .eq('id', currentVideo.channel_id)
        .single();

      if (channel?.owner_email) {
        // Get or create user from owner email to get their UUID
        const { data: userData } = await supabase
          .from('auth.users')
          .select('id')
          .eq('email', channel.owner_email)
          .single();

        if (userData?.id) {
          await awardAGNT(
            userData.id,
            AGNT_REWARDS.VIEW_100,
            `View milestone (${currentMilestone * 100} views) reached on video ${videoId}`
          );
        }
      }
    }

    return NextResponse.json({ success: true, views: newViewCount });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
