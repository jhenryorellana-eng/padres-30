import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import { purchaseFamilyPlan, prefetchOfferings } from '@/services/purchaseService';
import { getPostPurchaseInfo, createFamilyFromPurchase } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import { waitForConfiguration, loginRevenueCat } from '@/lib/revenuecat';
import { getPrice, type BillingCycle } from '@/utils/pricing';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { MaterialIcons } from '@expo/vector-icons';

type PaywallState = 'loading' | 'ready' | 'purchasing' | 'processing' | 'error';

export default function PaywallScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ childrenCount: string; billingCycle: string }>();

  const childrenCount = parseInt(params.childrenCount || '1');
  const billingCycle = (params.billingCycle || 'monthly') as BillingCycle;
  const fallbackPrice = getPrice(childrenCount, billingCycle);

  const [state, setState] = useState<PaywallState>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [localizedPrice, setLocalizedPrice] = useState<string | null>(null);

  // Pre-validate that the specific product exists before enabling purchase
  const loadProduct = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);

    try {
      await waitForConfiguration();
    } catch {
      // Configuration timed out - still try to fetch products
      console.warn('[Paywall] RevenueCat config timed out, attempting product fetch anyway');
    }

    try {
      // prefetchOfferings already does retries, then search in the returned packages
      const packages = await prefetchOfferings();
      const targetId = `family_${childrenCount}_${billingCycle}`;
      const pkg = packages.find(p =>
        p.identifier === targetId || p.identifier.includes(targetId)
      ) || null;

      if (pkg) {
        setLocalizedPrice(pkg.product.priceString);
        setState('ready');
      } else {
        setState('error');
        setErrorMessage(
          'No se pudieron cargar las opciones de pago. ' +
          'Verifica tu conexion e intenta de nuevo.'
        );
      }
    } catch {
      setState('error');
      setErrorMessage(
        'Error al cargar opciones de pago. Intenta de nuevo.'
      );
    }
  }, [childrenCount, billingCycle]);

  useEffect(() => {
    loadProduct();
  }, [loadProduct]);

  // Display price: prefer Apple/Google localized price, fallback to calculated
  const displayPrice = localizedPrice || `$${fallbackPrice}`;
  const priceLabel = billingCycle === 'monthly' ? 'mes' : 'ano';

  // Poll for family setup after purchase
  const waitForFamilySetup = useCallback(async () => {
    setState('processing');
    const maxRetries = 30;
    const intervalMs = 2000;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const info = await getPostPurchaseInfo();
        if (info?.familyId) {
          router.replace({
            pathname: '/onboarding/register-children',
            params: { childrenCount: String(childrenCount) },
          });
          return;
        }
      } catch {
        // Continue polling
      }
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }

    // Webhook hasn't processed — try fallback endpoint with purchase data
    try {
      const fallback = await createFamilyFromPurchase({
        productId: `family_${childrenCount}_${billingCycle}`,
        store: Platform.OS === 'ios' ? 'app_store' : 'play_store',
      });
      if (fallback?.familyId) {
        router.replace({
          pathname: '/onboarding/register-children',
          params: { childrenCount: String(childrenCount) },
        });
        return;
      }
    } catch {
      // Fallback also failed
    }

    Alert.alert(
      'Procesando',
      'Tu compra se esta procesando. Puedes cerrar la app e intentar iniciar sesion en unos minutos.',
      [{ text: 'OK', onPress: () => router.replace('/login') }]
    );
  }, [childrenCount, router]);

  const handlePurchase = useCallback(async () => {
    setState('purchasing');
    setErrorMessage(null);

    try {
      // Ensure RevenueCat identifies the user BEFORE purchase to prevent
      // anonymous INITIAL_PURCHASE webhooks (race condition fix)
      const { basicUser } = useAuthStore.getState();
      if (basicUser?.id) {
        try {
          await loginRevenueCat(basicUser.id);
        } catch {
          // Continue even if RC identification fails
        }
      }

      const customerInfo = await purchaseFamilyPlan(childrenCount, billingCycle);

      // Check if entitlement is active
      if (customerInfo.entitlements.active['starbiz_family_access']) {
        const { isPartialAuth, user, basicUser } = useAuthStore.getState();

        // Renewal from membresia screen (fully authenticated user)
        if (user) {
          Alert.alert(
            'Compra exitosa',
            'Tu membresia se ha renovado exitosamente.',
            [{ text: 'OK', onPress: () => router.replace('/(tabs)') }]
          );
          return;
        }

        // Renewal from login (partial auth with existing family)
        if (isPartialAuth && (basicUser as any)?.familyId) {
          Alert.alert(
            'Compra exitosa',
            'Tu membresia se ha renovado. Inicia sesion para continuar.',
            [{ text: 'Ir al login', onPress: () => router.replace('/login') }]
          );
          return;
        }

        // New user registration: wait for webhook to create family
        await waitForFamilySetup();
      } else {
        setState('error');
        setErrorMessage('La compra no se completo correctamente. Intenta de nuevo.');
      }
    } catch (error: any) {
      // User cancelled the purchase
      if (error.userCancelled) {
        setState('ready');
        return;
      }

      setState('error');
      setErrorMessage(
        error.message || 'Error al procesar la compra. Intenta de nuevo.'
      );
    }
  }, [childrenCount, billingCycle, waitForFamilySetup]);

  const isLoading = state === 'purchasing' || state === 'processing' || state === 'loading';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.step}>Paso 3 de 4</Text>
      <Text style={styles.title}>Confirmar suscripcion</Text>

      <Card style={styles.summaryCard} padding="lg">
        <Text style={styles.summaryTitle}>Resumen del plan</Text>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Plan Familiar</Text>
          <Text style={styles.summaryValue}>
            1 padre + {childrenCount} {childrenCount === 1 ? 'hijo' : 'hijos'}
          </Text>
        </View>

        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>Ciclo</Text>
          <Text style={styles.summaryValue}>
            {billingCycle === 'monthly' ? 'Mensual' : 'Anual'}
          </Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.summaryRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>
            {displayPrice}/{priceLabel}
          </Text>
        </View>
      </Card>

      {/* Security badges */}
      <View style={styles.badgesRow}>
        <View style={styles.badge}>
          <MaterialIcons name="verified-user" size={20} color={colors.success} />
          <Text style={styles.badgeText}>Pago seguro</Text>
        </View>
        <View style={styles.badge}>
          <MaterialIcons name="autorenew" size={20} color={colors.info} />
          <Text style={styles.badgeText}>Cancela cuando quieras</Text>
        </View>
      </View>

      {state === 'loading' && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>
            Cargando opciones de pago...
          </Text>
        </View>
      )}

      {errorMessage && (
        <Card style={styles.errorCard} padding="md">
          <Text style={styles.errorText}>{errorMessage}</Text>
        </Card>
      )}

      {state === 'processing' && (
        <View style={styles.processingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.processingText}>
            Activando tu membresia...
          </Text>
        </View>
      )}

      <Button
        title={isLoading ? 'Procesando...' : `Suscribirme - ${displayPrice}/${priceLabel}`}
        onPress={handlePurchase}
        loading={isLoading}
        disabled={isLoading || state === 'loading' || state === 'error'}
        fullWidth
        style={styles.button}
      />

      {state === 'error' && (
        <>
          <Button
            title="Reintentar"
            onPress={loadProduct}
            variant="outline"
            fullWidth
            style={styles.button}
          />
          <Button
            title="Volver"
            onPress={() => router.back()}
            variant="ghost"
            fullWidth
          />
        </>
      )}

      <Text style={styles.legalText}>
        La suscripcion se renueva automaticamente. Puedes cancelar en cualquier
        momento desde la configuracion de tu dispositivo. Al suscribirte, aceptas
        nuestros{' '}
        <Text
          style={styles.legalLink}
          onPress={() => Linking.openURL('https://starbizacademy.com/padres-3/terminos-servicio')}
        >
          Terminos de Servicio
        </Text>
        {' '}y{' '}
        <Text
          style={styles.legalLink}
          onPress={() => Linking.openURL('https://starbizacademy.com/padres-3/politica-privacidad')}
        >
          Politica de Privacidad
        </Text>.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  step: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['3xl'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  summaryCard: {
    marginBottom: 20,
  },
  summaryTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  summaryLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  summaryValue: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 12,
  },
  totalLabel: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  totalValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    color: colors.primary,
  },
  badgesRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginBottom: 20,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  badgeText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
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
  processingContainer: {
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  processingText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  button: {
    marginBottom: 12,
  },
  legalText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
    textAlign: 'center',
    lineHeight: fontSizes.xs * 1.6,
    marginTop: 8,
    paddingHorizontal: 16,
  },
  legalLink: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});
