-- Ensure videos table has upload-related columns
ALTER TABLE videos ADD COLUMN IF NOT EXISTS cloudflare_video_id TEXT UNIQUE;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE videos ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE videos ADD COLUMN IF NOT EXISTS upload_status TEXT DEFAULT 'published' CHECK (upload_status IN ('draft','published','unlisted'));
ALTER TABLE videos ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0;

-- Add profiles columns if not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS agnt_balance DECIMAL(18, 8) DEFAULT 0;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_videos_cloudflare_id ON videos(cloudflare_video_id);
CREATE INDEX IF NOT EXISTS idx_videos_creator_id ON videos(creator_id);
CREATE INDEX IF NOT EXISTS idx_videos_genre ON videos(genre);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
