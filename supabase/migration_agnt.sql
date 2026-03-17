-- Add AGNT balance tracking to profiles
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  agnt_balance INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create AGNT transactions table for audit trail
CREATE TABLE IF NOT EXISTS agnt_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_agnt_tx_user ON agnt_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_agnt_tx_created ON agnt_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_agnt_balance ON profiles(agnt_balance DESC);

-- Set up Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agnt_transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own profile
CREATE POLICY "Users can read own profile" 
  ON profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- Allow users to read own transactions
CREATE POLICY "Users can read own transactions" 
  ON agnt_transactions 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- Service role can insert/update for background operations
-- (These will bypass RLS when using service role key)

-- Create function to award AGNT
CREATE OR REPLACE FUNCTION award_agnt(
  p_user_id UUID,
  p_amount INTEGER,
  p_reason TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_new_balance INTEGER;
BEGIN
  -- Insert transaction
  INSERT INTO agnt_transactions (user_id, amount, reason)
  VALUES (p_user_id, p_amount, p_reason);
  
  -- Ensure profile exists
  INSERT INTO profiles (id, agnt_balance)
  VALUES (p_user_id, p_amount)
  ON CONFLICT (id) DO UPDATE
  SET agnt_balance = profiles.agnt_balance + p_amount,
      updated_at = NOW();
  
  -- Get and return new balance
  SELECT agnt_balance INTO v_new_balance FROM profiles WHERE id = p_user_id;
  RETURN v_new_balance;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
