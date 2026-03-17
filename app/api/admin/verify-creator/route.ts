import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const adminKey = process.env.ADMIN_KEY || 'AgenticAdmin2026!';

export async function POST(req: NextRequest) {
  try {
    // Check admin key
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    const body = await req.json();
    const { username, verified, note } = body;

    if (!username || verified === undefined) {
      return NextResponse.json(
        { error: 'username and verified are required' },
        { status: 400 }
      );
    }

    // Find profile by username
    const { data: profile, error: lookupError } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .single();

    if (lookupError || !profile) {
      return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
    }

    // Update verification status
    const updateData: any = {
      is_verified: verified,
    };

    if (verified) {
      updateData.verified_at = new Date().toISOString();
      updateData.verified_note = note || null;
    } else {
      updateData.verified_at = null;
      updateData.verified_note = null;
    }

    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', profile.id)
      .select();

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update profile' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      profile: updatedProfile?.[0],
    });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check admin key
    const authHeader = req.headers.get('x-admin-key');
    if (authHeader !== adminKey) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false },
    });

    // Get all verified creators
    const { data: creators, error } = await supabase
      .from('profiles')
      .select('id, username, is_verified, verified_at, verified_note')
      .eq('is_verified', true);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch creators' },
        { status: 500 }
      );
    }

    return NextResponse.json({ creators });
  } catch (error: any) {
    console.error('Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
