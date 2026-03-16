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

    const { data: reports, error } = await supabase
      .from('content_reports')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      throw error
    }

    return NextResponse.json(reports || [])
  } catch (err) {
    console.error('Admin reports error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
