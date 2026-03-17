import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const { searchParams } = new URL(request.url);
    const fingerprint = searchParams.get('fp');

    if (!videoId || !fingerprint) {
      return NextResponse.json(
        { error: 'Video ID and fingerprint required' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    // Check if this fingerprint has liked this video
    const { data } = await supabase
      .from('video_likes')
      .select('id')
      .eq('video_id', videoId)
      .eq('session_fingerprint', fingerprint)
      .single();

    return NextResponse.json({
      liked: !!data,
    });
  } catch (error: any) {
    console.error('Like status check error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
