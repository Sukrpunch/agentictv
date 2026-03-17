import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json([]);
    }

    // Get last 10 search queries
    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Error fetching search history:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          authorization: request.headers.get('authorization') || '',
        },
      },
    });

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { query } = await request.json();

    if (!query || !query.trim()) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Get current count for this user
    const { count: currentCount } = await supabase
      .from('search_history')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Keep only last 10 queries - delete oldest if needed
    if ((currentCount || 0) >= 10) {
      const { data: oldQueries } = await supabase
        .from('search_history')
        .select('id')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })
        .limit(currentCount! - 9);

      if (oldQueries && oldQueries.length > 0) {
        const oldIds = oldQueries.map((q) => q.id);
        await supabase.from('search_history').delete().in('id', oldIds);
      }
    }

    // Insert new query
    const { data, error } = await supabase
      .from('search_history')
      .insert({
        user_id: user.id,
        query: query.trim(),
      })
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error saving search query:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
