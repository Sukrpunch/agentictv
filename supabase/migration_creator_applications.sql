-- Create creator_applications table for storing Founding Creator program applications
CREATE TABLE IF NOT EXISTS creator_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  platform TEXT NOT NULL DEFAULT 'agentictv',
  tools TEXT,
  content_type TEXT,
  sample_url TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_creator_apps_status ON creator_applications(status);
CREATE INDEX IF NOT EXISTS idx_creator_apps_platform ON creator_applications(platform);
CREATE INDEX IF NOT EXISTS idx_creator_apps_email ON creator_applications(email);
CREATE INDEX IF NOT EXISTS idx_creator_apps_created_at ON creator_applications(created_at DESC);

-- Create update trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creator_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER creator_applications_updated_at
  BEFORE UPDATE ON creator_applications
  FOR EACH ROW
  EXECUTE PROCEDURE update_creator_applications_updated_at();

-- Set up Row Level Security (RLS)
ALTER TABLE creator_applications ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert (public submissions)
CREATE POLICY "Allow public to insert creator applications" 
  ON creator_applications 
  FOR INSERT 
  WITH CHECK (true);

-- Allow read only to authenticated admin users (optional - adjust based on your auth setup)
CREATE POLICY "Allow read access to admin" 
  ON creator_applications 
  FOR SELECT 
  USING (auth.role() = 'authenticated');
