import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const query = url.searchParams.get('q') || ''
    const category = url.searchParams.get('category')
    const limit = parseInt(url.searchParams.get('limit') || '20')

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { videos: [], total: 0 },
        { status: 400 }
      )
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.SUPABASE_SERVICE_ROLE_KEY || ''
    )

    // Build the search query
    let searchQuery = supabase
      .from('videos')
      .select('*, channel:channels(*)', { count: 'exact' })
      .eq('status', 'ready')
      .or(`title.ilike.%${query}%,description.ilike.%${query}%,ai_tool.ilike.%${query}%`)

    if (category) {
      searchQuery = searchQuery.eq('category', category)
    }

    const { data: videos, count, error } = await searchQuery
      .order('view_count', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Search error:', error)
      return NextResponse.json(
        { error: 'Search failed' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      videos: videos || [],
      total: count || 0,
    })
  } catch (err) {
    console.error('Search error:', err)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
