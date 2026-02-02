-- Migration: Create user_app_preferences table
-- Description: Stores user's mini app ordering preferences

-- Create the user_app_preferences table
CREATE TABLE IF NOT EXISTS user_app_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  app_order JSONB NOT NULL DEFAULT '[]'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Ensure one record per user
  CONSTRAINT unique_profile_preferences UNIQUE (profile_id)
);

-- Create index for faster lookups by profile_id
CREATE INDEX IF NOT EXISTS idx_user_app_preferences_profile_id
  ON user_app_preferences(profile_id);

-- Enable Row Level Security
ALTER TABLE user_app_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only read their own preferences
CREATE POLICY "Users can read own preferences"
  ON user_app_preferences
  FOR SELECT
  USING (auth.uid() = profile_id);

-- RLS Policy: Users can insert their own preferences
CREATE POLICY "Users can insert own preferences"
  ON user_app_preferences
  FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policy: Users can update their own preferences
CREATE POLICY "Users can update own preferences"
  ON user_app_preferences
  FOR UPDATE
  USING (auth.uid() = profile_id)
  WITH CHECK (auth.uid() = profile_id);

-- RLS Policy: Users can delete their own preferences
CREATE POLICY "Users can delete own preferences"
  ON user_app_preferences
  FOR DELETE
  USING (auth.uid() = profile_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_app_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at on row update
CREATE TRIGGER trigger_update_user_app_preferences_updated_at
  BEFORE UPDATE ON user_app_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_user_app_preferences_updated_at();
