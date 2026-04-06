-- X (Twitter) OAuth tokens & tweet rate limiting
-- Run this in Supabase SQL Editor

-- 1. X OAuth tokens table
CREATE TABLE IF NOT EXISTS x_auth_tokens (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  access_token TEXT NOT NULL,
  access_token_secret TEXT NOT NULL,
  x_user_id TEXT NOT NULL,
  x_screen_name TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE x_auth_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own X tokens"
  ON x_auth_tokens FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own X tokens"
  ON x_auth_tokens FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own X tokens"
  ON x_auth_tokens FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own X tokens"
  ON x_auth_tokens FOR DELETE
  USING (auth.uid() = user_id);

-- 2. Tweet log for rate limiting (3 tweets/day per user)
CREATE TABLE IF NOT EXISTS x_tweet_log (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tweeted_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_x_tweet_log_user_date
  ON x_tweet_log (user_id, tweeted_at DESC);

ALTER TABLE x_tweet_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own tweet log"
  ON x_tweet_log FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tweet log"
  ON x_tweet_log FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 3. Function to check daily tweet limit
CREATE OR REPLACE FUNCTION check_daily_tweet_limit(p_user_id UUID, p_limit INT DEFAULT 3)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_count INT;
BEGIN
  SELECT COUNT(*) INTO today_count
  FROM x_tweet_log
  WHERE user_id = p_user_id
    AND tweeted_at >= (now() AT TIME ZONE 'Asia/Tokyo')::date::timestamptz;

  RETURN today_count < p_limit;
END;
$$;
