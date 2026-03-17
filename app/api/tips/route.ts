import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export async function POST(req: NextRequest) {
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

    const { video_id } = await req.json();
    if (!video_id) {
      return NextResponse.json({ error: 'video_id required' }, { status: 400 });
    }

    // 1. Get video and creator
    const { data: video, error: videoError } = await supabase
      .from('videos')
      .select('id, creator_id')
      .eq('id', video_id)
      .single();

    if (videoError || !video) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    // 2. No self-tipping
    if (video.creator_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot tip your own video' },
        { status: 400 }
      );
    }

    // 3. Check tipper account age (>= 7 days)
    const { data: tipper, error: tipperError } = await supabase
      .from('profiles')
      .select('created_at')
      .eq('id', user.id)
      .single();

    if (tipperError || !tipper) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    const accountAge = Math.floor(
      (Date.now() - new Date(tipper.created_at).getTime()) / (1000 * 60 * 60 * 24)
    );
    if (accountAge < 7) {
      return NextResponse.json(
        { error: 'Account must be at least 7 days old to tip' },
        { status: 403 }
      );
    }

    // 4. Check if already tipped today (UNIQUE constraint handles this too)
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const { data: existingTip, error: checkError } = await supabase
      .from('agnt_tips')
      .select('id')
      .eq('sender_id', user.id)
      .eq('video_id', video_id)
      .gte('created_at', today.toISOString())
      .limit(1);

    if (!checkError && existingTip && existingTip.length > 0) {
      return NextResponse.json(
        { error: 'Already tipped this video today' },
        { status: 400 }
      );
    }

    // 5. Check daily cap (max 500 AGNT from tips per creator per day)
    const { data: tipsToday, error: capCheckError } = await supabase
      .from('agnt_tips')
      .select('amount')
      .eq('recipient_id', video.creator_id)
      .gte('created_at', today.toISOString());

    if (!capCheckError && tipsToday) {
      const totalTipsToday = tipsToday.reduce((sum, t) => sum + t.amount, 0);
      if (totalTipsToday + 10 > 500) {
        return NextResponse.json(
          { error: 'Daily tip cap reached for this creator' },
          { status: 400 }
        );
      }
    }

    // 6. Insert tip
    const { data: newTip, error: insertError } = await supabase
      .from('agnt_tips')
      .insert([
        {
          sender_id: user.id,
          recipient_id: video.creator_id,
          video_id: video_id,
          amount: 10,
        },
      ])
      .select();

    if (insertError || !newTip) {
      return NextResponse.json(
        { error: 'Failed to create tip' },
        { status: 500 }
      );
    }

    // 7. Award AGNT to creator - try award_agnt() function first
    const { error: awardError } = await supabase.rpc('award_agnt', {
      user_id: video.creator_id,
      amount: 10,
      reason: 'tip',
    });

    if (awardError) {
      // Fallback: directly update balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('agnt_balance')
        .eq('id', video.creator_id)
        .single();

      if (!profileError && profile) {
        await supabase
          .from('profiles')
          .update({
            agnt_balance: (profile.agnt_balance || 0) + 10,
          })
          .eq('id', video.creator_id);
      }
    }

    // 8. Record transaction
    await supabase.from('agnt_transactions').insert([
      {
        user_id: video.creator_id,
        type: 'tip',
        amount: 10,
        related_id: newTip[0].id,
        description: `Tip from video`,
      },
    ]);

    // 9. Update velocity log
    const hourBucket = new Date(today);
    hourBucket.setMinutes(0, 0, 0);

    const { data: existingLog, error: logError } = await supabase
      .from('tip_velocity_log')
      .select('tip_count, new_account_tip_count')
      .eq('creator_id', video.creator_id)
      .eq('hour_bucket', hourBucket.toISOString())
      .single();

    if (logError?.code === 'PGRST116') {
      // No existing log, create one
      await supabase.from('tip_velocity_log').insert([
        {
          creator_id: video.creator_id,
          hour_bucket: hourBucket.toISOString(),
          tip_count: 1,
          new_account_tip_count: accountAge < 7 ? 1 : 0,
        },
      ]);
    } else if (!logError && existingLog) {
      // Update existing log
      const newAccountCount =
        accountAge < 7 ? existingLog.new_account_tip_count + 1 : existingLog.new_account_tip_count;
      await supabase
        .from('tip_velocity_log')
        .update({
          tip_count: existingLog.tip_count + 1,
          new_account_tip_count: newAccountCount,
        })
        .eq('creator_id', video.creator_id)
        .eq('hour_bucket', hourBucket.toISOString());
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const { searchParams } = new URL(req.url);
    const videoId = searchParams.get('video_id');

    if (!videoId) {
      return NextResponse.json({ error: 'video_id required' }, { status: 400 });
    }

    // Get tip count for video
    const { data: tips, error: tipsError } = await supabase
      .from('agnt_tips')
      .select('id')
      .eq('video_id', videoId);

    if (tipsError) {
      return NextResponse.json({ error: 'Failed to fetch tips' }, { status: 500 });
    }

    // Check if current user has tipped (requires auth)
    let hasTipped = false;
    const authHeader = req.headers.get('Authorization');
    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);

      if (!authError && user) {
        const today = new Date();
        today.setUTCHours(0, 0, 0, 0);

        const { data: userTip } = await supabase
          .from('agnt_tips')
          .select('id')
          .eq('sender_id', user.id)
          .eq('video_id', videoId)
          .gte('created_at', today.toISOString())
          .limit(1);

        hasTipped = userTip && userTip.length > 0;
      }
    }

    return NextResponse.json({
      tipCount: tips.length,
      hasTipped,
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
