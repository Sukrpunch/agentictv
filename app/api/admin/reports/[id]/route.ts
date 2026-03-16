import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const ADMIN_KEY = process.env.ADMIN_PASSWORD || 'AgenticAdmin2026!'

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const adminKey = req.headers.get('x-admin-key')
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { action } = await req.json()

    if (!['dismiss', 'resolve'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    const status = action === 'dismiss' ? 'dismissed' : 'resolved'
    const { id } = await params

    const { error } = await supabase
      .from('content_reports')
      .update({ status })
      .eq('id', id)

    if (error) {
      throw error
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Admin report update error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
