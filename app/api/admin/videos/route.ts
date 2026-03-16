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

    // Get processing and pending videos
    const { data: videos, error } = await supabase
      .from('videos')
      .select('*, channel:channels(display_name)')
      .in('status', ['processing', 'pending'])
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      throw error
    }

    return NextResponse.json(videos || [])
  } catch (err) {
    console.error('Admin videos error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
