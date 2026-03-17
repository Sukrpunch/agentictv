import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const cloudflareAccountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
const cloudflareToken = process.env.CLOUDFLARE_STREAM_TOKEN || '';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { data: video, error } = await supabase
      .from('videos')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    return NextResponse.json({ video });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const { data: video, error: getError } = await supabase
      .from('videos')
      .select('creator_id, cloudflare_video_id')
      .eq('id', id)
      .single();

    if (getError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse update data
    const body = await req.json();
    const {
      title,
      description,
      category,
      genre,
      tags,
      upload_status,
      thumbnail_url,
      is_remix,
      parent_video_id,
      linked_track_url,
    } = body;

    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (category !== undefined) updateData.category = category;
    if (genre !== undefined) updateData.genre = genre;
    if (tags !== undefined) updateData.tags = tags;
    if (upload_status !== undefined) updateData.upload_status = upload_status;
    if (thumbnail_url !== undefined) updateData.thumbnail_url = thumbnail_url;
    if (is_remix !== undefined) updateData.is_remix = is_remix;
    if (parent_video_id !== undefined) updateData.parent_video_id = parent_video_id;
    if (linked_track_url !== undefined) updateData.linked_track_url = linked_track_url;

    // Update video
    const { data: updatedVideo, error: updateError } = await supabase
      .from('videos')
      .update(updateData)
      .eq('id', id)
      .select();

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update video' }, { status: 500 });
    }

    return NextResponse.json({ video: updatedVideo?.[0] });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    // Get auth header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check ownership
    const { data: video, error: getError } = await supabase
      .from('videos')
      .select('creator_id, cloudflare_video_id')
      .eq('id', id)
      .single();

    if (getError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    if (video.creator_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Cloudflare Stream
    if (video.cloudflare_video_id && cloudflareToken && cloudflareAccountId) {
      try {
        await fetch(
          `https://api.cloudflare.com/client/v4/accounts/${cloudflareAccountId}/stream/${video.cloudflare_video_id}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${cloudflareToken}`,
            },
          }
        );
      } catch (cfError) {
        console.error('Cloudflare delete error:', cfError);
        // Continue with DB deletion even if Cloudflare fails
      }
    }

    // Delete from database
    const { error: deleteError } = await supabase
      .from('videos')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return NextResponse.json({ error: 'Failed to delete video' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
