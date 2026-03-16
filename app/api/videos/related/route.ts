import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const videoId = url.searchParams.get('id')
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '6')

    if (!videoId) {
      return NextResponse.json(
        { error: 'Video ID is required' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get the original video to find its category if not provided
    let videoCategory = category
    if (!videoCategory) {
      const { data: videoData } = await supabase
        .from('videos')
        .select('category')
        .eq('id', videoId)
        .single()

      videoCategory = videoData?.category
    }

    // Get related videos
    let query = supabase
      .from('videos')
      .select('*, channel:channels(*)')
      .eq('status', 'ready')
      .neq('id', videoId)

    if (videoCategory) {
      query = query.eq('category', videoCategory)
    }

    const { data: videos, error } = await query
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Related videos error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch related videos' },
        { status: 500 }
      )
    }

    return NextResponse.json({ videos: videos || [] })
  } catch (err) {
    console.error('Related videos error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
