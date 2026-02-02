-- Migration: Add reviewer_name column to mini_app_ratings
-- Purpose: Store student's name with their rating so reviews show real names
-- instead of truncated UUIDs like "Usuario B247"

-- Add column for the student's name who submitted the rating
ALTER TABLE mini_app_ratings ADD COLUMN IF NOT EXISTS reviewer_name TEXT;

-- Comment explaining the column
COMMENT ON COLUMN mini_app_ratings.reviewer_name IS 'Name of the student who submitted the rating (firstName from their profile)';
