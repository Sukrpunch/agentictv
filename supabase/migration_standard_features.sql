-- Playlists / Watchlists
CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  creator_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  is_public BOOLEAN DEFAULT TRUE,
  video_count INTEGER DEFAULT 0,
  follower_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS playlist_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(playlist_id, video_id)
);

CREATE TABLE IF NOT EXISTS playlist_follows (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, playlist_id)
);

-- Watch history
CREATE TABLE IF NOT EXISTS watch_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES videos(id) ON DELETE CASCADE,
  watch_seconds INTEGER DEFAULT 0,
  watched_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON watch_history(user_id, watched_at DESC);

-- User likes (auth-based, separate from anonymous likes)
CREATE TABLE IF NOT EXISTS user_video_likes (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Watch later
CREATE TABLE IF NOT EXISTS watch_later (
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  added_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, video_id)
);

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_history_user ON search_history(user_id, created_at DESC);

-- Add subtitle support to videos
ALTER TABLE videos ADD COLUMN IF NOT EXISTS subtitle_url TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE playlist_follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_video_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE watch_later ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "playlists_public_read" ON playlists FOR SELECT USING (is_public = true OR auth.uid() = creator_id);
CREATE POLICY "playlists_owner_manage" ON playlists FOR ALL USING (auth.uid() = creator_id);
CREATE POLICY "playlists_owner_insert" ON playlists FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "playlist_videos_public_read" ON playlist_videos FOR SELECT USING (true);
CREATE POLICY "playlist_videos_owner_manage" ON playlist_videos FOR ALL USING (playlist_id IN (SELECT id FROM playlists WHERE creator_id = auth.uid()));
CREATE POLICY "playlist_videos_owner_insert" ON playlist_videos FOR INSERT WITH CHECK (playlist_id IN (SELECT id FROM playlists WHERE creator_id = auth.uid()));

CREATE POLICY "playlist_follows_own" ON playlist_follows FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "watch_history_own" ON watch_history FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "user_video_likes_public_read" ON user_video_likes FOR SELECT USING (true);
CREATE POLICY "user_video_likes_own_manage" ON user_video_likes FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "watch_later_own" ON watch_later FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "search_history_own" ON search_history FOR ALL USING (auth.uid() = user_id);

-- Video like count trigger (for authenticated likes)
CREATE OR REPLACE FUNCTION update_video_like_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE videos SET like_count = COALESCE(like_count,0) + 1 WHERE id = NEW.video_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE videos SET like_count = GREATEST(0, COALESCE(like_count,0) - 1) WHERE id = OLD.video_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_user_video_like ON user_video_likes;
CREATE TRIGGER on_user_video_like AFTER INSERT OR DELETE ON user_video_likes FOR EACH ROW EXECUTE FUNCTION update_video_like_count();

-- Playlist video count trigger
CREATE OR REPLACE FUNCTION update_playlist_video_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE playlists SET video_count = COALESCE(video_count,0) + 1 WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE playlists SET video_count = GREATEST(0, COALESCE(video_count,0) - 1) WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_playlist_video_change ON playlist_videos;
CREATE TRIGGER on_playlist_video_change AFTER INSERT OR DELETE ON playlist_videos FOR EACH ROW EXECUTE FUNCTION update_playlist_video_count();

-- Playlist follower count trigger
CREATE OR REPLACE FUNCTION update_playlist_follower_count()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE playlists SET follower_count = COALESCE(follower_count,0) + 1 WHERE id = NEW.playlist_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE playlists SET follower_count = GREATEST(0, COALESCE(follower_count,0) - 1) WHERE id = OLD.playlist_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_playlist_follow_change ON playlist_follows;
CREATE TRIGGER on_playlist_follow_change AFTER INSERT OR DELETE ON playlist_follows FOR EACH ROW EXECUTE FUNCTION update_playlist_follower_count();
