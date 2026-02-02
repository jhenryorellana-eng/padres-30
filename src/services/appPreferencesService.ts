import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSupabase } from '@/lib/supabase';

const LOCAL_STORAGE_KEY = 'padres_3_0_apps_order';
const LOCAL_TIMESTAMP_KEY = 'padres_3_0_apps_order_timestamp';

interface AppPreferences {
  appOrder: string[];
  updatedAt: string;
}

interface SupabasePreferences {
  id: string;
  profile_id: string;
  app_order: string[];
  updated_at: string;
}

/**
 * Get the authenticated user's ID from Supabase session.
 * This ID matches auth.uid() in RLS policies, ensuring policy checks pass.
 */
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  const { data: { user } } = await supabase.auth.getUser();
  return user?.id || null;
}

/**
 * Fetch app preferences from local storage
 */
export async function fetchLocalPreferences(): Promise<AppPreferences | null> {
  try {
    const orderJson = await AsyncStorage.getItem(LOCAL_STORAGE_KEY);
    const timestampStr = await AsyncStorage.getItem(LOCAL_TIMESTAMP_KEY);

    if (!orderJson) return null;

    return {
      appOrder: JSON.parse(orderJson),
      updatedAt: timestampStr || new Date(0).toISOString(),
    };
  } catch (error) {
    console.error('Error fetching local preferences:', error);
    return null;
  }
}

/**
 * Save app preferences to local storage
 */
export async function saveLocalPreferences(
  appOrder: string[]
): Promise<boolean> {
  try {
    const timestamp = new Date().toISOString();
    await AsyncStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(appOrder));
    await AsyncStorage.setItem(LOCAL_TIMESTAMP_KEY, timestamp);
    return true;
  } catch (error) {
    console.error('Error saving local preferences:', error);
    return false;
  }
}

/**
 * Fetch app preferences from Supabase
 */
export async function fetchRemotePreferences(
  _profileId: string
): Promise<AppPreferences | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    // Get uid from Supabase session (matches auth.uid() in RLS)
    const authUserId = await getAuthenticatedUserId();
    if (!authUserId) return null;

    const { data, error } = await supabase
      .from('user_app_preferences')
      .select('*')
      .eq('profile_id', authUserId)
      .single();

    if (error) {
      // PGRST116 = no rows returned, which is expected for new users
      if (error.code !== 'PGRST116') {
        console.error('Error fetching remote preferences:', error);
      }
      return null;
    }

    const prefs = data as SupabasePreferences;
    return {
      appOrder: prefs.app_order,
      updatedAt: prefs.updated_at,
    };
  } catch (error) {
    console.error('Error fetching remote preferences:', error);
    return null;
  }
}

/**
 * Save app preferences to Supabase (upsert)
 */
export async function saveRemotePreferences(
  _profileId: string,
  appOrder: string[]
): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    // Get uid from Supabase session (matches auth.uid() in RLS)
    const authUserId = await getAuthenticatedUserId();
    if (!authUserId) {
      console.error('No authenticated user found in Supabase session');
      return false;
    }

    const { error } = await supabase.from('user_app_preferences').upsert(
      {
        profile_id: authUserId,
        app_order: appOrder,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'profile_id',
      }
    );

    if (error) {
      console.error('Error saving remote preferences:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error saving remote preferences:', error);
    return false;
  }
}

/**
 * Sync app preferences between local and remote storage
 * Strategy: Most recent timestamp wins (conflict resolution)
 */
export async function syncAppPreferences(
  profileId: string | null,
  defaultOrder: string[]
): Promise<string[]> {
  // Fetch local preferences
  const localPrefs = await fetchLocalPreferences();

  // If no profile ID, just use local storage
  if (!profileId) {
    return localPrefs?.appOrder || defaultOrder;
  }

  // Fetch remote preferences
  const remotePrefs = await fetchRemotePreferences(profileId);

  // No local and no remote: return default
  if (!localPrefs && !remotePrefs) {
    await saveLocalPreferences(defaultOrder);
    return defaultOrder;
  }

  // Only local exists: push to remote
  if (localPrefs && !remotePrefs) {
    await saveRemotePreferences(profileId, localPrefs.appOrder);
    return localPrefs.appOrder;
  }

  // Only remote exists: pull to local
  if (!localPrefs && remotePrefs) {
    await saveLocalPreferences(remotePrefs.appOrder);
    return remotePrefs.appOrder;
  }

  // Both exist: compare timestamps and use most recent
  if (localPrefs && remotePrefs) {
    const localTime = new Date(localPrefs.updatedAt).getTime();
    const remoteTime = new Date(remotePrefs.updatedAt).getTime();

    if (localTime > remoteTime) {
      // Local is newer, push to remote
      await saveRemotePreferences(profileId, localPrefs.appOrder);
      return localPrefs.appOrder;
    } else {
      // Remote is newer or same, pull to local
      await saveLocalPreferences(remotePrefs.appOrder);
      return remotePrefs.appOrder;
    }
  }

  return defaultOrder;
}

/**
 * Save preferences to both local and remote storage
 */
export async function saveAppPreferences(
  profileId: string | null,
  appOrder: string[]
): Promise<boolean> {
  // Always save locally first
  const localSaved = await saveLocalPreferences(appOrder);

  // If we have a profile ID, also save remotely
  if (profileId) {
    await saveRemotePreferences(profileId, appOrder);
  }

  return localSaved;
}

export default {
  fetchLocalPreferences,
  saveLocalPreferences,
  fetchRemotePreferences,
  saveRemotePreferences,
  syncAppPreferences,
  saveAppPreferences,
};
