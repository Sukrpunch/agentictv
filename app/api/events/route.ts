import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Default seed events
const seedEvents = [
  {
    title: 'Runway Gen-3 Showcase',
    theme: 'sci-fi',
    description: 'Explore the cutting-edge capabilities of Runway Gen-3 with curated AI-generated videos.',
    scheduled_at: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T21:00:00Z', // Next Friday 9PM
    duration_minutes: 90,
  },
  {
    title: 'AI Animation Festival',
    theme: 'animation',
    description: 'A celebration of AI-generated animation featuring the most creative and experimental works.',
    scheduled_at: new Date(Date.now() + 6 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T15:00:00Z', // Next Saturday 3PM
    duration_minutes: 120,
  },
  {
    title: 'Sora Shorts Sunday',
    theme: 'experimental',
    description: 'Dive into experimental short-form content created with OpenAI\'s Sora.',
    scheduled_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0] + 'T19:00:00Z', // Next Sunday 7PM
    duration_minutes: 90,
  },
];

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const now = new Date().toISOString();
    
    // Get upcoming events (next 7 days) and currently live events
    const { data: events, error } = await supabase
      .from('live_events')
      .select('*')
      .gte('scheduled_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .lte('scheduled_at', new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('scheduled_at', { ascending: true });

    if (error) {
      console.error('Error fetching events:', error);
      return NextResponse.json({ error: 'Failed to fetch events' }, { status: 500 });
    }

    // If no events exist, return seed events
    if (!events || events.length === 0) {
      return NextResponse.json({
        events: seedEvents.map(event => ({
          ...event,
          id: Math.random().toString(36).substring(7),
          status: 'scheduled',
          playlist: [],
          viewer_count: 0,
          created_at: new Date().toISOString(),
        })),
        upcoming: true,
      });
    }

    // Calculate dynamic status based on scheduled_at
    const enrichedEvents = events.map(event => {
      const scheduledTime = new Date(event.scheduled_at).getTime();
      const endTime = scheduledTime + (event.duration_minutes * 60 * 1000);
      const currentTime = Date.now();
      
      let status = event.status;
      if (currentTime >= scheduledTime && currentTime < endTime) {
        status = 'live';
      } else if (currentTime >= endTime) {
        status = 'ended';
      } else {
        status = 'scheduled';
      }
      
      return { ...event, status };
    });

    return NextResponse.json({ events: enrichedEvents });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
