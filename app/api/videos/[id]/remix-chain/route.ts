import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Get the video
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (videoError || !video) {
      return NextResponse.json(
        { error: 'Video not found' },
        { status: 404 }
      );
    }

    // Get ancestors (parent chain, max 5 levels up)
    const ancestors = [];
    let currentVideo = video;
    let depth = 0;
    const maxDepth = 5;

    while (currentVideo.parent_video_id && depth < maxDepth) {
      const { data: parentVideo, error: parentError } = await supabase
        .from('videos')
        .select('*')
        .eq('id', currentVideo.parent_video_id)
        .single();

      if (parentError || !parentVideo) break;

      ancestors.unshift(parentVideo);
      currentVideo = parentVideo;
      depth++;
    }

    // Get children (videos that remixed this one)
    const { data: children, error: childrenError } = await supabase
      .from('videos')
      .select('*')
      .eq('parent_video_id', id)
      .eq('upload_status', 'published')
      .order('created_at', { ascending: false });

    // Get siblings (other remixes of same parent)
    const siblings = [];
    if (video.parent_video_id) {
      const { data: siblingData, error: siblingError } = await supabase
        .from('videos')
        .select('*')
        .eq('parent_video_id', video.parent_video_id)
        .neq('id', id)
        .eq('upload_status', 'published')
        .order('created_at', { ascending: false })
        .limit(5);

      if (!siblingError && siblingData) {
        siblings.push(...siblingData);
      }
    }

    return NextResponse.json({
      ancestors,
      children: children || [],
      siblings,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
