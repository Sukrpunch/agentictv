import { createClient } from '@supabase/supabase-js';

// AGNT reward amounts
export const AGNT_REWARDS = {
  VIEW_100: 10,           // Every 100 views
  LIKE: 1,                // Per like received
  FEATURED: 50,           // Video featured on homepage
  FOUNDING_CREATOR: 500,  // Founding Creator signup bonus
  REFERRAL: 25,           // Referring another creator
};

/**
 * Award AGNT tokens to a user
 * Uses service role client to bypass RLS
 * @param userId - User ID (can be null for special bonuses like founding creator)
 * @param amount - Amount of AGNT to award
 * @param reason - Reason for the award (for audit trail)
 * @returns New balance or null if user not found
 */
export async function awardAGNT(
  userId: string | null,
  amount: number,
  reason: string
): Promise<number | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    // If no userId, just log the transaction (for founding creator bonus before signup)
    if (!userId) {
      // Log transaction without updating balance
      const { error } = await supabase
        .from('agnt_transactions')
        .insert([
          {
            user_id: null,
            amount,
            reason,
          },
        ]);

      if (error) {
        console.error('Error logging AGNT transaction:', error);
        return null;
      }
      return amount;
    }

    // Call the PL/pgSQL function
    const { data, error } = await supabase
      .rpc('award_agnt', {
        p_user_id: userId,
        p_amount: amount,
        p_reason: reason,
      });

    if (error) {
      console.error('Error awarding AGNT:', error);
      return null;
    }

    return data as number;
  } catch (err) {
    console.error('Unexpected error in awardAGNT:', err);
    return null;
  }
}

/**
 * Get current AGNT balance for a user
 */
export async function getAGNTBalance(userId: string): Promise<number> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('agnt_balance')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return 0;
    }

    return data.agnt_balance || 0;
  } catch (err) {
    console.error('Error getting AGNT balance:', err);
    return 0;
  }
}

/**
 * Get AGNT transaction history for a user
 */
export async function getAGNTHistory(userId: string, limit: number = 50) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
  );

  try {
    const { data, error } = await supabase
      .from('agnt_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting AGNT history:', error);
      return [];
    }

    return data || [];
  } catch (err) {
    console.error('Error fetching AGNT history:', err);
    return [];
  }
}
