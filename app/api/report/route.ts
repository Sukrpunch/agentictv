import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { content_type, content_id, reason, reporter_email } = body

    if (!content_type || !content_id || !reason) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (!['video', 'channel'].includes(content_type)) {
      return NextResponse.json(
        { error: 'Invalid content type' },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Create the report
    const { data, error } = await supabase
      .from('content_reports')
      .insert({
        content_type,
        content_id,
        reason,
        reporter_email: reporter_email || null,
        status: 'pending',
      })
      .select()

    if (error) {
      console.error('Report creation error:', error)
      return NextResponse.json(
        { error: 'Failed to submit report' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { success: true, report: data },
      { status: 201 }
    )
  } catch (err) {
    console.error('Report error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
