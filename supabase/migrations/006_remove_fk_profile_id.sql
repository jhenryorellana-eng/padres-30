-- Migration: Remove foreign key constraint on profile_id
-- Reason: Hub Central and Junior-app use different Supabase instances,
-- so the parent UUID from Hub Central doesn't exist in Junior-app's auth.users.
-- Security is validated in application code (ratingsService.ts).

ALTER TABLE mini_app_ratings DROP CONSTRAINT IF EXISTS mini_app_ratings_profile_id_fkey;
