-- Remix chain
ALTER TABLE videos ADD COLUMN IF NOT EXISTS parent_video_id UUID REFERENCES videos(id) ON DELETE SET NULL;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_remix BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS linked_track_url TEXT;

-- Weekly breakdowns
CREATE TABLE IF NOT EXISTS weekly_breakdowns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_start DATE NOT NULL UNIQUE,
  top_video_id UUID REFERENCES videos(id) ON DELETE SET NULL,
  top_creator_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  new_creators_count INTEGER DEFAULT 0,
  total_views_week INTEGER DEFAULT 0,
  trending_genre TEXT,
  highlight_text TEXT,
  content JSONB DEFAULT '{}',
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE weekly_breakdowns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "breakdowns_public_read" ON weekly_breakdowns FOR SELECT USING (true);
