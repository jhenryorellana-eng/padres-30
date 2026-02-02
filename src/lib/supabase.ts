import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Environment variables for Supabase connection
// These should be set in your .env file:
// EXPO_PUBLIC_SUPABASE_URL=your-supabase-url
// EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  // Return null if not configured (allows offline-first operation)
  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  if (!supabaseInstance) {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        storage: AsyncStorage,
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
      },
    });
  }

  return supabaseInstance;
}

/**
 * Set the Supabase session with tokens from our auth system.
 * This syncs the JWT tokens so RLS policies can evaluate auth.uid() correctly.
 */
export async function setSupabaseSession(
  accessToken: string,
  refreshToken: string
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  const { error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });

  if (error) {
    console.error('Error setting Supabase session:', error);
    return false;
  }

  console.log('Supabase session synchronized successfully');
  return true;
}

/**
 * Clear the Supabase session on logout.
 * Performs complete cleanup at 4 levels to prevent session persistence.
 */
export async function clearSupabaseSession(): Promise<void> {
  const supabase = getSupabase();
  if (!supabase) return;

  try {
    // Level 1: Stop auto-refresh timer to prevent background token refresh
    await supabase.auth.stopAutoRefresh();

    // Level 2: SignOut with local scope (avoids errors in multi-user scenarios)
    await supabase.auth.signOut({ scope: 'local' });

    // Level 3: Clear all Supabase keys from AsyncStorage
    const supabaseKeys = [
      'supabase.auth.token',
      'supabase.auth.token-user',
      'supabase.auth.token-code-verifier',
    ];
    await AsyncStorage.multiRemove(supabaseKeys);

    // Level 4: Force refresh to invalidate in-memory cache
    // This will fail (no session) but clears the internal state
    await supabase.auth.refreshSession();

    console.log('Supabase session cleared completely');
  } catch (error) {
    // Errors are expected at level 4 when there's no session
    console.log('Supabase session cleanup completed');
  }
}

export const supabase = getSupabase();

export default supabase;
