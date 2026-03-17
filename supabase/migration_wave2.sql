-- $AGNT Tips
CREATE TABLE IF NOT EXISTS agnt_tips (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sender_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  recipient_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sender_id, video_id, (created_at::date))
);
CREATE INDEX IF NOT EXISTS idx_agnt_tips_recipient ON agnt_tips(recipient_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_agnt_tips_video ON agnt_tips(video_id, created_at DESC);

-- "What Made This" disclosure
CREATE TABLE IF NOT EXISTS video_credits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE UNIQUE,
  tools JSONB DEFAULT '[]',
  prompt TEXT,
  notes TEXT,
  show_prompt BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verified creator badge
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS verified_note TEXT;

-- Fraud guard
CREATE TABLE IF NOT EXISTS tip_velocity_log (
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  hour_bucket TIMESTAMPTZ,
  tip_count INTEGER DEFAULT 0,
  new_account_tip_count INTEGER DEFAULT 0,
  PRIMARY KEY (creator_id, hour_bucket)
);

ALTER TABLE agnt_tips ENABLE ROW LEVEL SECURITY;
ALTER TABLE video_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE tip_velocity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "tips_public_read" ON agnt_tips FOR SELECT USING (true);
CREATE POLICY "tips_auth_insert" ON agnt_tips FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "video_credits_public_read" ON video_credits FOR SELECT USING (true);
CREATE POLICY "video_credits_owner_manage" ON video_credits FOR ALL
  USING (video_id IN (SELECT id FROM videos WHERE creator_id = auth.uid()));
CREATE POLICY "tip_velocity_service_only" ON tip_velocity_log FOR ALL USING (false);
