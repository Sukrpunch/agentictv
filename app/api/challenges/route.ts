import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const ADMIN_KEY = process.env.ADMIN_KEY || 'AgenticAdmin2026!';

function getStatusFromTimestamps(now: Date, startsAt: Date, endsAt: Date, votingEndsAt: Date): string {
  if (now < startsAt) return 'upcoming';
  if (now < endsAt) return 'open';
  if (now < votingEndsAt) return 'voting';
  return 'complete';
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status') || null;

    let query = supabase
      .from('challenges')
      .select('*')
      .order('starts_at', { ascending: false });

    const { data: challenges, error } = await query;

    if (error) {
      console.error('Error fetching challenges:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const now = new Date();

    // Add computed status and enrich data
    const enriched = (challenges || []).map((challenge: any) => {
      const computedStatus = getStatusFromTimestamps(
        now,
        new Date(challenge.starts_at),
        new Date(challenge.ends_at),
        new Date(challenge.voting_ends_at)
      );

      return {
        ...challenge,
        computed_status: computedStatus,
      };
    });

    // Filter by status if requested
    let filtered = enriched;
    if (status) {
      filtered = enriched.filter((c: any) => c.computed_status === status);
    }

    return NextResponse.json({
      challenges: filtered,
    });
  } catch (error: any) {
    console.error('Challenges API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminKey = req.headers.get('x-admin-key');
    if (adminKey !== ADMIN_KEY) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const {
      title,
      description,
      theme,
      rules,
      prize_agnt = 500,
      starts_at,
      ends_at,
      voting_ends_at,
    } = body;

    if (!title || !description || !theme || !starts_at || !ends_at || !voting_ends_at) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from('challenges')
      .insert([
        {
          title,
          description,
          theme,
          rules,
          prize_agnt,
          starts_at,
          ends_at,
          voting_ends_at,
          created_by: 'Mason',
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating challenge:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('Challenge creation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
