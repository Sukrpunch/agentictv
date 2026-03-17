import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

interface LikeRequestBody {
  fingerprint: string;
  action: 'like' | 'unlike';
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: videoId } = await params;
    const body: LikeRequestBody = await request.json();

    const { fingerprint, action } = body;

    if (!videoId || !fingerprint || !action) {
      return NextResponse.json(
        { error: 'Video ID, fingerprint, and action required' },
        { status: 400 }
      );
    }

    if (!['like', 'unlike'].includes(action)) {
      return NextResponse.json(
        { error: 'Action must be "like" or "unlike"' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();

    if (action === 'like') {
      // Check if already liked
      const { data: existingLike } = await supabase
        .from('video_likes')
        .select('id')
        .eq('video_id', videoId)
        .eq('session_fingerprint', fingerprint)
        .single();

      if (existingLike) {
        // Already liked - no-op, return current state
        const { data: videoData } = await supabase
          .from('videos')
          .select('likes')
          .eq('id', videoId)
          .single();

        return NextResponse.json({
          liked: true,
          likes: videoData?.likes || 0,
        });
      }

      // Insert the like record
      const { error: insertError } = await supabase
        .from('video_likes')
        .insert({
          video_id: videoId,
          session_fingerprint: fingerprint,
        });

      if (insertError) {
        console.error('Error inserting like:', insertError);
        return NextResponse.json(
          { error: 'Failed to like video' },
          { status: 500 }
        );
      }

      // Increment likes count
      const { data: videoData, error: updateError } = await supabase
        .from('videos')
        .update({ likes: supabase.rpc('increment_likes', { video_id: videoId }) })
        .eq('id', videoId)
        .select('likes')
        .single();

      if (updateError) {
        // Fallback: manually increment
        const { data: currentVideo } = await supabase
          .from('videos')
          .select('likes')
          .eq('id', videoId)
          .single();

        if (currentVideo) {
          const newLikes = (currentVideo.likes || 0) + 1;
          await supabase
            .from('videos')
            .update({ likes: newLikes })
            .eq('id', videoId);

          return NextResponse.json({
            liked: true,
            likes: newLikes,
          });
        }
      }

      return NextResponse.json({
        liked: true,
        likes: videoData?.likes || 0,
      });
    } else {
      // unlike
      const { error: deleteError } = await supabase
        .from('video_likes')
        .delete()
        .eq('video_id', videoId)
        .eq('session_fingerprint', fingerprint);

      if (deleteError) {
        console.error('Error removing like:', deleteError);
        return NextResponse.json(
          { error: 'Failed to unlike video' },
          { status: 500 }
        );
      }

      // Decrement likes count
      const { data: currentVideo } = await supabase
        .from('videos')
        .select('likes')
        .eq('id', videoId)
        .single();

      if (currentVideo) {
        const newLikes = Math.max((currentVideo.likes || 1) - 1, 0);
        await supabase
          .from('videos')
          .update({ likes: newLikes })
          .eq('id', videoId);

        return NextResponse.json({
          liked: false,
          likes: newLikes,
        });
      }

      return NextResponse.json({
        liked: false,
        likes: 0,
      });
    }
  } catch (error: any) {
    console.error('Like handling error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
