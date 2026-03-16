import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get the current user from the session
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // In a real app, you'd validate the auth token here
    // For now, we'll get the user email from the request context
    // This assumes the client passes the user email
    const userEmail = req.headers.get('x-user-email')
    if (!userEmail) {
      return NextResponse.json(
        { error: 'User email required' },
        { status: 400 }
      )
    }

    // Get the user's channel
    const { data: channel, error: channelError } = await supabase
      .from('channels')
      .select('id')
      .eq('owner_email', userEmail)
      .single()

    if (channelError || !channel) {
      return NextResponse.json(
        { error: 'Channel not found' },
        { status: 404 }
      )
    }

    // Get all videos for this channel
    const { data: videos, error: videosError } = await supabase
      .from('videos')
      .select('*')
      .eq('channel_id', channel.id)
      .eq('status', 'ready')

    if (videosError) {
      throw videosError
    }

    // Calculate total views
    const total_views = videos?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0

    // Get top 5 videos by view count
    const top_videos = (videos || [])
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 5)
      .map(v => ({
        id: v.id,
        title: v.title,
        view_count: v.view_count,
        thumbnail_url: v.thumbnail_url,
      }))

    // Generate last 30 days data
    const views_by_day: { date: string; views: number }[] = []
    const now = new Date()
    for (let i = 29; i >= 0; i--) {
      const date = new Date(now)
      date.setDate(date.getDate() - i)
      const dateStr = date.toISOString().split('T')[0]

      // Simple simulation: distribute views across days
      const dayViews = Math.floor(total_views / 30) + (i % 3) * Math.floor(total_views / 100)
      views_by_day.push({
        date: dateStr,
        views: dayViews,
      })
    }

    // Get additional metrics
    const { data: channelData } = await supabase
      .from('channels')
      .select('channel_type')
      .eq('id', channel.id)
      .single()

    return NextResponse.json({
      total_views,
      views_by_day,
      top_videos,
      video_count: videos?.length || 0,
      channel_type: channelData?.channel_type || 'agent',
    })
  } catch (err) {
    console.error('Analytics error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
