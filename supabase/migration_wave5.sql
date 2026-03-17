-- Wave 5 Migration: Live Events, AI Auto-tagging, Prompt Archive, Community Channels

-- Add mood column to videos if not present
ALTER TABLE videos ADD COLUMN IF NOT EXISTS mood TEXT;

-- Mason Live Screenings / Watch Parties
CREATE TABLE IF NOT EXISTS live_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  theme TEXT NOT NULL,
  description TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 90,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled','live','ended')),
  playlist UUID[] DEFAULT '{}',
  viewer_count INTEGER DEFAULT 0,
  stream_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Prompt Archive
CREATE TABLE IF NOT EXISTS prompt_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  tool TEXT NOT NULL,
  tool_version TEXT,
  prompt TEXT NOT NULL,
  settings JSONB DEFAULT '{}',
  genre TEXT,
  tags TEXT[],
  use_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_prompt_archive_tool ON prompt_archive(tool);
CREATE INDEX IF NOT EXISTS idx_prompt_archive_creator ON prompt_archive(creator_id);

-- Community Channels (curated video channels)
CREATE TABLE IF NOT EXISTS channels_community (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  theme TEXT,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_ids UUID[] DEFAULT '{}',
  video_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT TRUE,
  cover_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_community_channels_slug ON channels_community(slug);
CREATE INDEX IF NOT EXISTS idx_community_channels_owner ON channels_community(owner_id);

CREATE TABLE IF NOT EXISTS channel_follows (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  channel_id UUID REFERENCES channels_community(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, channel_id)
);
CREATE INDEX IF NOT EXISTS idx_channel_follows_user ON channel_follows(user_id);

-- Enable Row Level Security
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_archive ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels_community ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_follows ENABLE ROW LEVEL SECURITY;

-- Policies for live_events
CREATE POLICY "live_events_public_read" ON live_events
  FOR SELECT USING (true);

-- Policies for prompt_archive
CREATE POLICY "prompt_archive_public_read" ON prompt_archive
  FOR SELECT USING (true);

CREATE POLICY "prompt_archive_creator_insert" ON prompt_archive
  FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "prompt_archive_creator_update" ON prompt_archive
  FOR UPDATE USING (auth.uid() = creator_id);

CREATE POLICY "prompt_archive_creator_delete" ON prompt_archive
  FOR DELETE USING (auth.uid() = creator_id);

-- Policies for channels_community
CREATE POLICY "community_channels_public_read" ON channels_community
  FOR SELECT USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "community_channels_owner_insert" ON channels_community
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "community_channels_owner_update" ON channels_community
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "community_channels_owner_delete" ON channels_community
  FOR DELETE USING (auth.uid() = owner_id);

-- Policies for channel_follows
CREATE POLICY "channel_follows_user_manage" ON channel_follows
  FOR ALL USING (auth.uid() = user_id);
