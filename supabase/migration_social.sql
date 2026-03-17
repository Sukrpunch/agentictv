-- Create profiles table (linked to auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  username TEXT UNIQUE NOT NULL,
  bio TEXT,
  avatar_url TEXT,
  follower_count INTEGER DEFAULT 0,
  following_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comments on videos
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  body TEXT NOT NULL CHECK (char_length(body) <= 500),
  timestamp_ms INTEGER, -- timestamped video comment
  parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_comments_video ON comments(video_id, created_at DESC);

-- Follows
CREATE TABLE IF NOT EXISTS follows (
  follower_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  following_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (follower_id, following_id)
);

-- Collaborations
CREATE TABLE IF NOT EXISTS collaborations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'collaborator' CHECK (role IN ('creator','collaborator','remixer')),
  agnt_share INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add social fields to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_collab BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS is_remix BOOLEAN DEFAULT FALSE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS original_video_id UUID REFERENCES videos(id);
ALTER TABLE videos ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES profiles(id) ON DELETE CASCADE;

-- RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborations ENABLE ROW LEVEL SECURITY;

-- Profile policies
CREATE POLICY IF NOT EXISTS "profiles_public_read" ON profiles FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "profiles_auth_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY IF NOT EXISTS "profiles_own_update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Comment policies
CREATE POLICY IF NOT EXISTS "comments_public_read" ON comments FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "comments_auth_insert" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY IF NOT EXISTS "comments_own_delete" ON comments FOR DELETE USING (auth.uid() = user_id);

-- Follow policies
CREATE POLICY IF NOT EXISTS "follows_public_read" ON follows FOR SELECT USING (true);
CREATE POLICY IF NOT EXISTS "follows_auth_manage" ON follows FOR ALL USING (auth.uid() = follower_id);

-- Collaboration policies
CREATE POLICY IF NOT EXISTS "collabs_public_read" ON collaborations FOR SELECT USING (true);

-- Follow counter triggers
CREATE OR REPLACE FUNCTION update_atv_follow_counts()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE profiles SET following_count = COALESCE(following_count,0) + 1 WHERE id = NEW.follower_id;
    UPDATE profiles SET follower_count = COALESCE(follower_count,0) + 1 WHERE id = NEW.following_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE profiles SET following_count = GREATEST(0, COALESCE(following_count,0) - 1) WHERE id = OLD.follower_id;
    UPDATE profiles SET follower_count = GREATEST(0, COALESCE(follower_count,0) - 1) WHERE id = OLD.following_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_follow_change ON follows;
CREATE TRIGGER on_follow_change
  AFTER INSERT OR DELETE ON follows
  FOR EACH ROW EXECUTE FUNCTION update_atv_follow_counts();

-- Comment count trigger
CREATE OR REPLACE FUNCTION update_video_comment_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET comment_count = COALESCE(comment_count,0) + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET comment_count = GREATEST(0, COALESCE(comment_count,0) - 1) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_comment_change ON comments;
CREATE TRIGGER on_comment_change
  AFTER INSERT OR DELETE ON comments
  FOR EACH ROW EXECUTE FUNCTION update_video_comment_count();
