import Purchases, {
  type PurchasesPackage,
  type CustomerInfo,
} from 'react-native-purchases';

/**
 * Get all available subscription packages from RevenueCat.
 * These correspond to the products configured in App Store Connect / Google Play.
 */
export async function getAvailablePackages(): Promise<PurchasesPackage[]> {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.current?.availablePackages || [];
  } catch (error) {
    console.error('Error getting offerings:', error);
    return [];
  }
}

/**
 * Find the specific package for a family plan configuration.
 * Package identifier format: family_{childrenCount}_{billingCycle}
 */
export async function findFamilyPackage(
  childrenCount: number,
  billingCycle: 'monthly' | 'yearly'
): Promise<PurchasesPackage | null> {
  const packages = await getAvailablePackages();
  const targetId = `family_${childrenCount}_${billingCycle}`;

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
    // Log technical details for debugging
    const packages = await getAvailablePackages();
    console.error(
      `[IAP] Package not found: family_${childrenCount}_${billingCycle}. ` +
      `Available packages: ${packages.map(p => p.identifier).join(', ') || 'none'}`
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
