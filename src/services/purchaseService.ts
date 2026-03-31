import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';

// Module-level cache for prefetched packages
let cachedPackages: PurchasesPackage[] | null = null;

/**
 * Get all available subscription packages from RevenueCat.
 * These correspond to the products configured in App Store Connect / Google Play.
 */
export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();

    console.log('[IAP] Offerings response:', JSON.stringify({
      currentId: offerings.current?.identifier || 'NONE',
      currentPackages: offerings.current?.availablePackages?.length || 0,
      allOfferingsKeys: Object.keys(offerings.all),
    }));

    const packages = offerings.current?.availablePackages || [];
    if (packages.length > 0) {
      cachedPackages = packages;
    }
    return packages;
  } catch (error) {
    console.error('[IAP] Error getting offerings:', error);
    return cachedPackages || [];
  }
}

/**
 * Get available packages with exponential backoff retries.
 * Apple's sandbox can take seconds to make products available after SDK init.
 */
async function getAvailablePackagesWithRetry(
  maxRetries = 5
): Promise<PurchasesPackage[]> {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    const packages = await getAvailablePackages();

    console.log(
      `[IAP] Fetch attempt ${attempt}/${maxRetries}: ` +
      `${packages.length} packages found` +
      (packages.length > 0 ? ` (${packages.map(p => p.identifier).join(', ')})` : '')
    );

    if (packages.length > 0) return packages;

    if (attempt < maxRetries) {
      const delay = Math.pow(2, attempt - 1) * 1000; // 1s, 2s, 4s, 8s, 16s
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  console.error('[IAP] No packages available after all retries');
  return cachedPackages || [];
}

/**
 * Pre-fetch and cache offerings. Call at app startup so products
 * are ready by the time the user reaches the paywall.
 */
export async function prefetchOfferings(): Promise<PurchasesPackage[]> {
  return getAvailablePackagesWithRetry(3);
}

/**
 * Find the specific package for a family plan configuration.
 * Package identifier format: family_{childrenCount}_{billingCycle}
 * Uses retry logic to handle sandbox delays.
 */
export async function findFamilyPackage(
  childrenCount: number,
  billingCycle: 'monthly' | 'yearly'
): Promise<PurchasesPackage | null> {
  // Try cache first
  const targetId = `family_${childrenCount}_${billingCycle}`;

  if (cachedPackages) {
    const cached = cachedPackages.find(pkg =>
      pkg.identifier === targetId || pkg.identifier.includes(targetId)
    );
    if (cached) return cached;
  }

  // Cache miss or not found - fetch with retries
  const packages = await getAvailablePackagesWithRetry();

  return packages.find(pkg =>
    pkg.identifier === targetId ||
    pkg.identifier.includes(targetId)
  ) || null;
}

/**
 * Purchase a family plan subscription via IAP.
 * This triggers the native Apple/Google purchase dialog.
 *
 * @throws Error if purchase fails or is cancelled
 */
export async function purchaseFamilyPlan(
  childrenCount: number,
  billingCycle: 'monthly' | 'yearly'
): Promise<CustomerInfo> {
  const pkg = await findFamilyPackage(childrenCount, billingCycle);

  if (!pkg) {
    const available = cachedPackages?.map(p => p.identifier).join(', ') || 'none';
    console.error(
      `[IAP] Package not found: family_${childrenCount}_${billingCycle}. ` +
      `Available: ${available}`
    );
    throw new Error(
      'Este plan no está disponible en tu dispositivo. ' +
      'Por favor intenta más tarde o suscríbete desde app.starbizacademy.com'
    );
  }

  const { customerInfo } = await Purchases.purchasePackage(pkg);
  return customerInfo;
}

/**
 * Restore previous purchases (required by Apple guidelines).
 * Useful when a user reinstalls the app or switches devices.
 */
export async function restorePurchases(): Promise<CustomerInfo> {
  return await Purchases.restorePurchases();
}

/**
 * Get current subscription status.
 */
export async function getSubscriptionStatus(): Promise<{
  isActive: boolean;
  expirationDate: string | null;
  productIdentifier: string | null;
}> {
  try {
    const customerInfo = await Purchases.getCustomerInfo();
    const entitlement = customerInfo.entitlements.active['starbiz_family_access'];

    if (entitlement) {
      return {
        isActive: true,
        expirationDate: entitlement.expirationDate,
        productIdentifier: entitlement.productIdentifier,
      };
    }

    return { isActive: false, expirationDate: null, productIdentifier: null };
  } catch {
    return { isActive: false, expirationDate: null, productIdentifier: null };
  }
}
