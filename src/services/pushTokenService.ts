import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getPushToken, requestNotificationPermissions } from './notificationService';

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const DEVICE_ID_KEY = 'padres_3_0_device_id';
const APP_ID = 'padres_3_0';

/**
 * Get or create a persistent device ID.
 * Stored in AsyncStorage so it survives app restarts but not reinstalls.
 */
async function getDeviceId(): Promise<string> {
  let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
  if (!deviceId) {
    deviceId = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
    await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
  }
  return deviceId;
}

/**
 * Register the device's push token with the backend Edge Function.
 * Call after login and on app restart (loadStoredAuth).
 */
export async function registerPushToken(accessToken: string): Promise<void> {
  try {
    const hasPermission = await requestNotificationPermissions();
    if (!hasPermission) return;

    const token = await getPushToken();
    if (!token) return;

    const deviceId = await getDeviceId();

    const response = await fetch(`${SUPABASE_URL}/functions/v1/push-token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        token,
        device_id: deviceId,
        platform: Platform.OS as 'ios' | 'android',
        app_id: APP_ID,
      }),
    });

    if (!response.ok) {
      console.error('[PushToken] Registration failed:', await response.text());
    } else {
      console.log('[PushToken] Registered successfully');
    }
  } catch (error) {
    console.error('[PushToken] Registration error:', error);
  }
}

/**
 * Unregister the device's push token on logout.
 */
export async function unregisterPushToken(accessToken: string): Promise<void> {
  try {
    const deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) return;

    await fetch(`${SUPABASE_URL}/functions/v1/push-token`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ device_id: deviceId }),
    });

    console.log('[PushToken] Unregistered successfully');
  } catch (error) {
    console.error('[PushToken] Unregister error:', error);
  }
}
