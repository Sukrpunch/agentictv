import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { videoId } = await request.json();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    // Increment view count
    const { data, error } = await supabase
      .from('videos')
      .update({ view_count: supabase.rpc('increment_views') })
      .eq('id', videoId)
      .select();

    if (error) {
      console.error('Error incrementing views:', error);
      // Fallback: manually increment
      const { data: videoData } = await supabase
        .from('videos')
        .select('view_count')
        .eq('id', videoId)
        .single();

      if (videoData) {
        await supabase
          .from('videos')
          .update({ view_count: (videoData.view_count || 0) + 1 })
          .eq('id', videoId);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('View tracking error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
