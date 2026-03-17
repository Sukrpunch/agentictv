import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase';

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();

    // Get top 20 videos by view count
    const { data, error } = await supabase
      .from('videos')
      .select(
        `
        id,
        title,
        view_count,
        channel:channel_id (
          slug,
          display_name
        )
      `
      )
      .eq('status', 'ready')
      .order('view_count', { ascending: false })
      .limit(20);

    if (error) {
      console.error('Supabase error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch videos' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error: any) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
