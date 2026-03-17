import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { sendPushToUser } from '@/lib/push/sendPush';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!videoId) {
      return NextResponse.json(
        { error: 'Missing video_id' },
        { status: 400 }
      );
    }

    // Fetch comments with author profiles
    const { data: comments, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        video_id,
        user_id,
        body,
        timestamp_ms,
        parent_id,
        created_at,
        user:profiles(
          id,
          display_name,
          username,
          bio,
          avatar_url,
          follower_count,
          following_count,
          created_at
        )
        `
      )
      .eq('video_id', videoId)
      .is('parent_id', true) // Only fetch top-level comments
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch comments' },
        { status: 500 }
      );
    }

    // Fetch replies for each comment
    const commentsWithReplies = await Promise.all(
      (comments || []).map(async (comment) => {
        const { data: replies } = await supabase
          .from('comments')
          .select(
            `
            id,
            video_id,
            user_id,
            body,
            timestamp_ms,
            parent_id,
            created_at,
            user:profiles(
              id,
              display_name,
              username,
              bio,
              avatar_url,
              follower_count,
              following_count,
              created_at
            )
            `
          )
          .eq('parent_id', comment.id)
          .order('created_at', { ascending: true });

        return { ...comment, replies };
      })
    );

    return NextResponse.json(commentsWithReplies);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { video_id, body: comment_body, timestamp_ms, parent_id } = body;

    // Get user from auth header
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Use service role to validate user (in production, you'd validate the token)
    const { data: { user }, error: authError } = await supabase.auth.admin.getUserById(
      req.headers.get('x-user-id') || ''
    );

    if (!user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Validate input
    if (!video_id || !comment_body) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (comment_body.length > 500) {
      return NextResponse.json(
        { error: 'Comment too long (max 500 characters)' },
        { status: 400 }
      );
    }

    // Insert comment
    const { data: newComment, error: insertError } = await supabase
      .from('comments')
      .insert([
        {
          video_id,
          user_id: user.id,
          body: comment_body,
          timestamp_ms: timestamp_ms || null,
          parent_id: parent_id || null,
        },
      ])
      .select(
        `
        id,
        video_id,
        user_id,
        body,
        timestamp_ms,
        parent_id,
        created_at,
        user:profiles(
          id,
          display_name,
          username,
          bio,
          avatar_url,
          follower_count,
          following_count,
          created_at
        )
        `
      )
      .single();

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    // Get video owner ID for notification
    const { data: video } = await supabase
      .from('videos')
      .select('user_id')
      .eq('id', video_id)
      .single();

    if (video && video.user_id !== user.id) {
      // Get commenter profile for notification message
      const { data: commenterProfile } = await supabase
        .from('profiles')
        .select('display_name, username')
        .eq('id', user.id)
        .single();

      // Create notification for video owner
      await supabase
        .from('notifications')
        .insert({
          user_id: video.user_id,
          actor_id: user.id,
          type: 'comment',
          entity_id: video_id,
          entity_type: 'video',
          message: (commenterProfile?.display_name || 'Someone') + ' commented on your video',
        });

      // Send push notification
      await sendPushToUser(video.user_id, {
        title: 'AgenticTV',
        body: (commenterProfile?.display_name || 'Someone') + ' commented on your video',
        url: `/watch/${video_id}`,
      });
    }

    return NextResponse.json(newComment);
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const commentId = searchParams.get('comment_id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Missing comment_id' },
        { status: 400 }
      );
    }

    // Get user from auth
    const userId = req.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Verify ownership
    const { data: comment } = await supabase
      .from('comments')
      .select('user_id')
      .eq('id', commentId)
      .single();

    if (!comment || comment.user_id !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Delete comment
    const { error: deleteError } = await supabase
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (deleteError) {
      console.error('Delete error:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
