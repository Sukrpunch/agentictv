-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Channels table
CREATE TABLE channels (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT,
  channel_type TEXT NOT NULL DEFAULT 'human' CHECK (channel_type IN ('agent', 'human', 'hybrid')),
  avatar_color TEXT DEFAULT '#7c3aed',
  owner_email TEXT NOT NULL,
  total_views BIGINT DEFAULT 0,
  video_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT DEFAULT 'other',
  ai_tool TEXT,
  channel_type TEXT DEFAULT 'human' CHECK (channel_type IN ('agent', 'human', 'hybrid')),
  cloudflare_stream_id TEXT UNIQUE,
  thumbnail_url TEXT,
  playback_url TEXT,
  duration_seconds INTEGER,
  status TEXT DEFAULT 'processing' CHECK (status IN ('processing', 'ready', 'error')),
  view_count BIGINT DEFAULT 0,
  is_featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX idx_videos_channel_id ON videos(channel_id);
CREATE INDEX idx_videos_status ON videos(status);
CREATE INDEX idx_videos_category ON videos(category);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);
CREATE INDEX idx_channels_slug ON channels(slug);
CREATE INDEX idx_channels_owner_email ON channels(owner_email);

-- RLS Policies
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;

-- Channel Policies
CREATE POLICY "Anyone can read channels" ON channels
  FOR SELECT
  USING (TRUE);

CREATE POLICY "Users can update own channel" ON channels
  FOR UPDATE
  USING (auth.jwt() ->> 'email' = owner_email);

CREATE POLICY "Users can insert channel on register" ON channels
  FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = owner_email);

-- Video Policies
CREATE POLICY "Anyone can read ready videos" ON videos
  FOR SELECT
  USING (status = 'ready' OR TRUE);

CREATE POLICY "Users can insert video to own channel" ON videos
  FOR INSERT
  WITH CHECK (
    channel_id IN (
      SELECT id FROM channels WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

CREATE POLICY "Users can update own channel videos" ON videos
  FOR UPDATE
  USING (
    channel_id IN (
      SELECT id FROM channels WHERE owner_email = auth.jwt() ->> 'email'
    )
  );

-- Helper function to increment views (RPC)
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS BIGINT AS $$
  UPDATE videos
  SET view_count = view_count + 1
  WHERE id = video_id
  RETURNING view_count;
$$ LANGUAGE SQL;

-- Service role bypass (for webhooks & API)
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;
ALTER TABLE videos DISABLE ROW LEVEL SECURITY;

-- Then re-enable with service role bypass
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
