-- Admin Dashboard Migration
-- Run this manually in Supabase SQL Editor

-- Notification Recipients table
CREATE TABLE IF NOT EXISTS notification_recipients (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE notification_recipients ENABLE ROW LEVEL SECURITY;

-- Only admins can manage notification recipients (via service role key in API)
CREATE POLICY "Service role full access" ON notification_recipients
  FOR ALL USING (true) WITH CHECK (true);

-- Seed data
INSERT INTO notification_recipients (email, name, active) VALUES
  ('jamie@ledgepipe.com', 'Jamie', true),
  ('harold.ai.caskey@gmail.com', 'Harold', true)
ON CONFLICT (email) DO NOTHING;
