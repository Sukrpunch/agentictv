-- Activity Feed Table
CREATE TABLE IF NOT EXISTS activity_feed (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN (
    'video_upload', 'chart_entry', 'chart_number_one',
    'challenge_winner', 'challenge_opened', 'milestone_views',
    'milestone_followers', 'new_creator', 'featured'
  )),
  actor_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  is_public BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_activity_feed_created ON activity_feed(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_feed_actor ON activity_feed(actor_id, created_at DESC);

-- Row Level Security
ALTER TABLE activity_feed ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can see public activity)
CREATE POLICY "activity_feed_public_read" ON activity_feed 
  FOR SELECT 
  USING (is_public = true);

-- Service role can insert (for backend triggers and API)
CREATE POLICY "activity_feed_service_insert" ON activity_feed 
  FOR INSERT 
  WITH CHECK (true);
