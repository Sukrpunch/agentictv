-- Create webhook_events table for Cloudflare webhook logging
CREATE TABLE IF NOT EXISTS webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on event_type for faster queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);

-- Create index on processed_at for time-based queries
CREATE INDEX IF NOT EXISTS idx_webhook_events_time ON webhook_events(processed_at);
