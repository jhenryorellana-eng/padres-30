import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import { Platform } from 'react-native';

const RC_API_KEY = Platform.select({
  ios: process.env.EXPO_PUBLIC_RC_APPLE_API_KEY || '',
  android: process.env.EXPO_PUBLIC_RC_GOOGLE_API_KEY || '',
}) || '';

const ENTITLEMENT_ID = 'starbiz_family_access';

let isConfigured = false;
let configPromise: Promise<void> | null = null;

/**
 * Configure RevenueCat SDK. Call once at app startup.
 * If appUserId is provided, the user is identified immediately.
 * Otherwise, an anonymous user is created (to be identified after login/register).
 */
export async function configureRevenueCat(appUserId?: string): Promise<void> {
  if (isConfigured) return;
  if (!RC_API_KEY) {
    console.warn('[RevenueCat] API key not configured. IAP will not work.');
    return;
  }

  const platform = Platform.OS;
  const maskedKey = RC_API_KEY.substring(0, 8) + '...';
  console.log(`[RevenueCat] Configuring for ${platform} (key: ${maskedKey})`);

  // Enable debug logs in non-production builds for sandbox review diagnostics
  if (__DEV__ || process.env.EXPO_PUBLIC_ENV !== 'production') {
    Purchases.setLogLevel(LOG_LEVEL.DEBUG);
  }

  await Purchases.configure({
    apiKey: RC_API_KEY,
    appUserID: appUserId || null,
    usesStoreKit2IfAvailable: false,
  });

  isConfigured = true;
  console.log('[RevenueCat] Configuration complete');
}

/**
 * Wait until RevenueCat is configured.
 * Resolves when configured, rejects on timeout (10s).
 */
export async function waitForConfiguration(): Promise<void> {
  if (isConfigured) return;
  if (configPromise) return configPromise;

  configPromise = new Promise<void>((resolve, reject) => {
    const interval = setInterval(() => {
      if (isConfigured) {
        clearInterval(interval);
        configPromise = null;
        resolve();
      }
    }, 200);

    setTimeout(() => {
      clearInterval(interval);
      configPromise = null;
      if (isConfigured) {
        resolve();
      } else {
        console.warn('[RevenueCat] Configuration timed out after 10s');
        reject(new Error('RevenueCat configuration timed out'));
      }
    }, 10_000);
  });

  return configPromise;
}

/**
 * Identify the user in RevenueCat with their Supabase Auth UUID.
 * This links purchases across platforms (web Stripe + mobile IAP).
 */
export async function loginRevenueCat(userId: string): Promise<void> {
  try {
    await Purchases.logIn(userId);
  } catch (error) {
    console.error('RevenueCat login error:', error);
  }
}

/**
 * Log out the current user from RevenueCat.
 * Creates a new anonymous user internally.
 */
export async function logoutRevenueCat(): Promise<void> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    // Only logout if user is identified (not anonymous)
    if (customerInfo.originalAppUserId && !customerInfo.originalAppUserId.startsWith('$RCAnonymousID:')) {
      await Purchases.logOut();
    }
  } catch {
    // Silently ignore - user may already be anonymous
  }
}

/**
 * Check if the current user has an active family access entitlement.
 * Works for both IAP and Stripe-synced subscriptions.
 */
export async function checkEntitlement(): Promise<boolean> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
  } catch {
    return false;
  }
}
