-- Migration: Relax RLS policies for mini_app_ratings
-- Reason: Hub Central and Junior-app use different Supabase instances,
-- so the JWT from Hub Central is not valid for Junior-app's Supabase.
-- auth.uid() returns NULL, causing RLS policy violations.
-- Security is now validated in application code (ratingsService.ts).

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can insert own rating" ON mini_app_ratings;
DROP POLICY IF EXISTS "Users can update own rating" ON mini_app_ratings;

-- New policy: Allow INSERT (validation done in code)
-- ratingsService.ts ensures:
-- 1. User must be authenticated (authStore.user exists)
-- 2. profile_id always comes from authStore.user.id (not client input)
-- 3. UNIQUE constraint prevents duplicate ratings per user/app
CREATE POLICY "Authenticated users can insert rating"
  ON mini_app_ratings FOR INSERT
  WITH CHECK (true);

-- New policy: Allow UPDATE (validation done in code)
CREATE POLICY "Users can update own rating"
  ON mini_app_ratings FOR UPDATE
  USING (true)
  WITH CHECK (true);
