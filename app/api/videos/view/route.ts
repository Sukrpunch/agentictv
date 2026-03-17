import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

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
      .select('view_count')
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

    return NextResponse.json({ success: true, views: newViewCount });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
