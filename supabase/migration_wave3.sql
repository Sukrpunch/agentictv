-- Weekly chart snapshots
CREATE TABLE IF NOT EXISTS chart_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL,
  position INTEGER NOT NULL,
  prev_position INTEGER,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  score NUMERIC NOT NULL DEFAULT 0,
  view_count_week INTEGER DEFAULT 0,
  unique_viewers_week INTEGER DEFAULT 0,
  like_count_week INTEGER DEFAULT 0,
  comment_count_week INTEGER DEFAULT 0,
  tip_count_week INTEGER DEFAULT 0,
  peak_position INTEGER,
  weeks_on_chart INTEGER DEFAULT 1,
  is_new_entry BOOLEAN DEFAULT TRUE,
  is_bullet BOOLEAN DEFAULT FALSE,
  UNIQUE(week_start, position)
);
CREATE INDEX IF NOT EXISTS idx_chart_entries_week ON chart_entries(week_start DESC, position ASC);

-- Dedications
CREATE TABLE IF NOT EXISTS chart_dedications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  sender_name TEXT NOT NULL,
  recipient_name TEXT NOT NULL,
  message TEXT NOT NULL CHECK (char_length(message) <= 500),
  week_start DATE NOT NULL,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Challenges
CREATE TABLE IF NOT EXISTS challenges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  theme TEXT NOT NULL,
  rules TEXT,
  prize_agnt INTEGER DEFAULT 500,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  voting_ends_at TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'open', 'voting', 'complete')),
  winner_video_id UUID REFERENCES videos(id),
  created_by TEXT DEFAULT 'Mason',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS challenge_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vote_count INTEGER DEFAULT 0,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(challenge_id, video_id)
);

CREATE TABLE IF NOT EXISTS challenge_votes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  entry_id UUID REFERENCES challenge_entries(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, challenge_id)
);

ALTER TABLE chart_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE chart_dedications ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chart_entries_public_read" ON chart_entries FOR SELECT USING (true);
CREATE POLICY "chart_dedications_public_read" ON chart_dedications FOR SELECT USING (true);
CREATE POLICY "chart_dedications_insert_open" ON chart_dedications FOR INSERT WITH CHECK (true);
CREATE POLICY "challenges_public_read" ON challenges FOR SELECT USING (true);
CREATE POLICY "challenge_entries_public_read" ON challenge_entries FOR SELECT USING (true);
CREATE POLICY "challenge_entries_auth_insert" ON challenge_entries FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "challenge_votes_public_read" ON challenge_votes FOR SELECT USING (true);
CREATE POLICY "challenge_votes_own" ON challenge_votes FOR ALL USING (auth.uid() = user_id);
