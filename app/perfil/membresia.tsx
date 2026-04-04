import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Linking,
  Platform,
} from 'react-native';
import { Stack, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Purchases from 'react-native-purchases';
import { Button, Card } from '@/components/ui';
import { restorePurchases } from '@/services/purchaseService';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { MaterialIcons } from '@expo/vector-icons';

const ENTITLEMENT_ID = 'starbiz_family_access';

export default function MembresiaScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user } = useAuthStore();

  const [hasEntitlement, setHasEntitlement] = useState(false);
  const [expirationDate, setExpirationDate] = useState<string | null>(null);
  const [planChildrenCount, setPlanChildrenCount] = useState<number | null>(null);
  const [planBillingCycle, setPlanBillingCycle] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRestoring, setIsRestoring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [restoreMessage, setRestoreMessage] = useState<string | null>(null);

  useEffect(() => {
    async function loadSubscriptionStatus() {
      try {
        const customerInfo = await Purchases.getCustomerInfo();
        const activeEntitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
        // Use "all" to get info even if expired
        const entitlement = activeEntitlement || customerInfo.entitlements.all[ENTITLEMENT_ID];

        if (activeEntitlement) {
          setHasEntitlement(true);
        }

        if (entitlement) {
          setExpirationDate(entitlement.expirationDate || null);

          // Parse product ID to get plan details (e.g. "family_3_monthly")
          const productId = entitlement.productIdentifier;
          if (productId) {
            const match = productId.match(/family_(\d+)_(monthly|yearly)/);
            if (match) {
              setPlanChildrenCount(parseInt(match[1]));
              setPlanBillingCycle(match[2] === 'yearly' ? 'Anual' : 'Mensual');
            }
          }
        }
      } catch {
        // RevenueCat might not be configured yet - that's ok
      } finally {
        setIsLoading(false);
      }
    }

    loadSubscriptionStatus();
  }, []);

  const handleRestore = useCallback(async () => {
    setIsRestoring(true);
    setRestoreMessage(null);
    setError(null);

    try {
      const customerInfo = await restorePurchases();
      const entitlement = customerInfo.entitlements.active[ENTITLEMENT_ID];
      if (entitlement) {
        setHasEntitlement(true);
        setExpirationDate(entitlement.expirationDate || null);
        const productId = entitlement.productIdentifier;
        if (productId) {
          const match = productId.match(/family_(\d+)_(monthly|yearly)/);
          if (match) {
            setPlanChildrenCount(parseInt(match[1]));
            setPlanBillingCycle(match[2] === 'yearly' ? 'Anual' : 'Mensual');
          }
        }
        setRestoreMessage('Compras restauradas exitosamente');
      } else {
        setRestoreMessage('No se encontraron compras anteriores');
      }
    } catch {
      setError('Error al restaurar compras. Intenta de nuevo.');
    } finally {
      setIsRestoring(false);
    }
  }, []);

  const handleManageSubscription = useCallback(async () => {
    try {
      await Purchases.showManageSubscriptions();
    } catch {
      // Fallback to deep link if showManageSubscriptions fails
      if (Platform.OS === 'ios') {
        Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
        Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
    }
  }, []);

  // Use plan children count from RevenueCat product ID, fallback to linked children
  const childrenCount = planChildrenCount || user?.linkedChildren?.length || 0;

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Mi Membresia', headerShown: true }} />
        <View style={[styles.centered, { paddingTop: insets.top + 48 }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Mi Membresia',
          headerShown: true,
          headerStyle: { backgroundColor: colors.background },
          headerTintColor: colors.text,
          headerTitleStyle: { fontFamily: fontFamilies.semiBold },
        }}
      />
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 24 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {error && (
          <Card style={styles.errorCard} padding="md">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {restoreMessage && (
          <Card style={styles.successCard} padding="md">
            <Text style={styles.successText}>{restoreMessage}</Text>
          </Card>
        )}

        {user ? (
          <>
            {/* Status card */}
            <Card style={styles.statusCard} padding="lg">
              <View style={styles.statusHeader}>
                <Text style={styles.cardTitle}>Estado de membresia</Text>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: (hasEntitlement ? colors.success : colors.error) + '20' },
                ]}>
                  <View style={[
                    styles.statusDot,
                    { backgroundColor: hasEntitlement ? colors.success : colors.error },
                  ]} />
                  <Text style={[
                    styles.statusLabel,
                    { color: hasEntitlement ? colors.success : colors.error },
                  ]}>
                    {hasEntitlement ? 'Activa' : 'Inactiva'}
                  </Text>
                </View>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>Plan</Text>
                <Text style={styles.infoValue}>
                  Familiar ({childrenCount} {childrenCount === 1 ? 'hijo' : 'hijos'})
                </Text>
              </View>

              {planBillingCycle && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Ciclo</Text>
                  <Text style={styles.infoValue}>{planBillingCycle}</Text>
                </View>
              )}

              {expirationDate && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Proxima renovacion</Text>
                  <Text style={styles.infoValue}>
                    {new Date(expirationDate).toLocaleDateString('es', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </Card>

            {/* Renewal card - shown when membership is inactive */}
            {!hasEntitlement && (
              <Card style={styles.renewCard} padding="md">
                <Text style={styles.renewText}>
                  Tu membresia ha expirado. Renueva para seguir disfrutando de todas las mini-apps educativas.
                </Text>
                <Button
                  title="Renovar suscripcion"
                  onPress={() => router.push('/onboarding/select-plan')}
                  fullWidth
                />
              </Card>
            )}

            {/* Codes card */}
            <Card style={styles.codesCard} padding="lg">
              <Text style={styles.cardTitle}>Codigos familiares</Text>

              <View style={styles.codeItem}>
                <MaterialIcons name="person" size={20} color={colors.primary} />
                <View style={styles.codeInfo}>
                  <Text style={styles.codeType}>Padre</Text>
                  <Text style={styles.codeText}>{user.code}</Text>
                </View>
              </View>

              {user.linkedChildren?.map((child, i) => (
                <View key={child.code} style={styles.codeItem}>
                  <MaterialIcons name="child-care" size={20} color={colors.secondary} />
                  <View style={styles.codeInfo}>
                    <Text style={styles.codeType}>{child.name || `Hijo ${i + 1}`}</Text>
                    <Text style={styles.codeText}>{child.code}</Text>
                  </View>
                </View>
              ))}
            </Card>

            {/* Manage subscription info */}
            <Card style={styles.infoCard} padding="md">
              <View style={styles.noteRow}>
                <MaterialIcons name="info" size={20} color={colors.info} />
                <Text style={styles.noteText}>
                  Gestiona tu plan, ciclo de facturacion o cancela tu suscripcion desde el boton de abajo.
                </Text>
              </View>
            </Card>

            <Button
              title="Administrar suscripcion"
              onPress={handleManageSubscription}
              variant="outline"
              fullWidth
              style={styles.actionButton}
            />
          </>
        ) : (
          <Card style={styles.emptyCard} padding="lg">
            <MaterialIcons name="card-membership" size={48} color={colors.textTertiary} />
            <Text style={styles.emptyTitle}>Sin membresia activa</Text>
            <Text style={styles.emptyText}>
              No tienes una membresia activa.
            </Text>
          </Card>
        )}

        {/* Restore purchases - required by Apple */}
        <Button
          title={isRestoring ? 'Restaurando...' : 'Restaurar compras'}
          onPress={handleRestore}
          variant="ghost"
          loading={isRestoring}
          disabled={isRestoring}
          fullWidth
          style={styles.restoreButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  errorCard: {
    backgroundColor: colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  successCard: {
    backgroundColor: colors.success + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.success,
    marginBottom: 16,
  },
  successText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.success,
  },
  statusCard: {
    marginBottom: 16,
  },
  statusHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.xs,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  infoValue: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
  },
  renewCard: {
    backgroundColor: colors.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 16,
  },
  renewText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: 12,
    lineHeight: fontSizes.sm * 1.5,
  },
  codesCard: {
    marginBottom: 16,
  },
  codeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  codeInfo: {
    flex: 1,
  },
  codeType: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  codeText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base,
    color: colors.primary,
    letterSpacing: 1,
  },
  infoCard: {
    backgroundColor: colors.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    marginBottom: 16,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    flex: 1,
    lineHeight: fontSizes.sm * 1.5,
  },
  actionButton: {
    marginBottom: 12,
  },
  emptyCard: {
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.5,
  },
  restoreButton: {
    marginTop: 8,
    marginBottom: 16,
  },
});
