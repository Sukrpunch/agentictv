import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Verify token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: challengeId } = params;
    const body = await req.json();
    const { entry_id } = body;

    if (!entry_id) {
      return NextResponse.json(
        { error: 'Missing entry_id' },
        { status: 400 }
      );
    }

    // Verify challenge exists and is in voting period
    const { data: challenge, error: challengeError } = await supabase
      .from('challenges')
      .select('ends_at, voting_ends_at')
      .eq('id', challengeId)
      .single();

    if (challengeError || !challenge) {
      return NextResponse.json({ error: 'Challenge not found' }, { status: 404 });
    }

    const now = new Date();
    if (now < new Date(challenge.ends_at) || now >= new Date(challenge.voting_ends_at)) {
      return NextResponse.json(
        { error: 'Challenge voting is not active' },
        { status: 400 }
      );
    }

    // Verify entry exists
    const { data: entry, error: entryError } = await supabase
      .from('challenge_entries')
      .select('id, challenge_id')
      .eq('id', entry_id)
      .single();

    if (entryError || !entry) {
      return NextResponse.json({ error: 'Entry not found' }, { status: 404 });
    }

    if (entry.challenge_id !== challengeId) {
      return NextResponse.json(
        { error: 'Entry does not belong to this challenge' },
        { status: 400 }
      );
    }

    // Check if user already voted
    const { data: existingVote, error: checkError } = await supabase
      .from('challenge_votes')
      .select('id')
      .eq('user_id', user.id)
      .eq('challenge_id', challengeId)
      .single();

    if (existingVote) {
      return NextResponse.json(
        { error: 'You have already voted in this challenge' },
        { status: 400 }
      );
    }

    // Create vote
    const { data: vote, error: insertError } = await supabase
      .from('challenge_votes')
      .insert([
        {
          user_id: user.id,
          challenge_id: challengeId,
          entry_id: entry_id,
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('Error creating vote:', insertError);
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Increment vote count on entry
    const { error: updateError } = await supabase
      .from('challenge_entries')
      .update({ vote_count: () => 'vote_count + 1' })
      .eq('id', entry_id);

    if (updateError) {
      console.error('Error updating vote count:', updateError);
    }

    // Award 5 AGNT to voter (simplified - would need token system)
    // For now, just return success

    return NextResponse.json(vote, { status: 201 });
  } catch (error: any) {
    console.error('Challenge vote error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
