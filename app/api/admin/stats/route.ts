import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_KEY = process.env.ADMIN_PASSWORD || 'AgenticAdmin2026!'

export async function GET(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Get total videos count
    const { count: total_videos } = await supabase
      .from('videos')
      .select('*', { count: 'exact', head: true })

    // Get total channels count
    const { count: total_channels } = await supabase
      .from('channels')
      .select('*', { count: 'exact', head: true })

    // Get total views
    const { data: viewsData } = await supabase
      .from('videos')
      .select('view_count')

    const total_views = viewsData?.reduce((sum, v) => sum + (v.view_count || 0), 0) || 0

    return NextResponse.json({
      total_videos: total_videos || 0,
      total_channels: total_channels || 0,
      total_views,
    })
  } catch (err) {
    console.error('Admin stats error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
