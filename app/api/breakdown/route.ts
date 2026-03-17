import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Get latest breakdowns with video and creator details
    const { data: breakdowns, error } = await supabase
      .from('weekly_breakdowns')
      .select(`
        *,
        top_video:videos(*),
        top_creator:profiles(*)
      `)
      .order('week_start', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch breakdowns' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      breakdowns,
    });
  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
