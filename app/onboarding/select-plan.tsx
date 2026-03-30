import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Card } from '@/components/ui';
import {
  calculateMonthlyPrice,
  calculateYearlyPrice,
  calculateAnnualSavings,
  PLAN_FEATURES,
  type BillingCycle,
} from '@/utils/pricing';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { MaterialIcons } from '@expo/vector-icons';

export default function SelectPlanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [childrenCount, setChildrenCount] = useState(1);
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const monthlyPrice = calculateMonthlyPrice(childrenCount);
  const yearlyPrice = calculateYearlyPrice(childrenCount);
  const savings = calculateAnnualSavings(childrenCount);
  const displayPrice = billingCycle === 'monthly' ? monthlyPrice : yearlyPrice;

  const handleContinue = () => {
    router.push({
      pathname: '/onboarding/paywall',
      params: { childrenCount: String(childrenCount), billingCycle },
    });
  };

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      <Text style={styles.step}>Paso 2 de 4</Text>
      <Text style={styles.title}>Elige tu plan</Text>
      <Text style={styles.subtitle}>
        Una sola membresia para toda tu familia
      </Text>

      {/* Billing cycle toggle */}
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleOption, billingCycle === 'monthly' && styles.toggleActive]}
          onPress={() => setBillingCycle('monthly')}
        >
          <Text style={[styles.toggleText, billingCycle === 'monthly' && styles.toggleTextActive]}>
            Mensual
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleOption, billingCycle === 'yearly' && styles.toggleActive]}
          onPress={() => setBillingCycle('yearly')}
        >
          <Text style={[styles.toggleText, billingCycle === 'yearly' && styles.toggleTextActive]}>
            Anual (-25%)
          </Text>
        </TouchableOpacity>
      </View>

      {/* Children count selector */}
      <Card style={styles.childrenCard} padding="lg">
        <Text style={styles.childrenLabel}>Cantidad de hijos</Text>
        <View style={styles.counterRow}>
          <TouchableOpacity
            style={[styles.counterBtn, childrenCount <= 1 && styles.counterBtnDisabled]}
            onPress={() => setChildrenCount(Math.max(1, childrenCount - 1))}
            disabled={childrenCount <= 1}
          >
            <MaterialIcons name="remove" size={24} color={childrenCount <= 1 ? colors.border : colors.primary} />
          </TouchableOpacity>
          <Text style={styles.counterValue}>{childrenCount}</Text>
          <TouchableOpacity
            style={[styles.counterBtn, childrenCount >= 10 && styles.counterBtnDisabled]}
            onPress={() => setChildrenCount(Math.min(10, childrenCount + 1))}
            disabled={childrenCount >= 10}
          >
            <MaterialIcons name="add" size={24} color={childrenCount >= 10 ? colors.border : colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.childrenHint}>
          1 padre + {childrenCount} {childrenCount === 1 ? 'hijo' : 'hijos'}
        </Text>
      </Card>

      {/* Price display */}
      <Card style={styles.priceCard} padding="lg">
        <Text style={styles.priceLabel}>
          {billingCycle === 'monthly' ? 'Precio mensual' : 'Precio anual'}
        </Text>
        <Text style={styles.price}>
          ${displayPrice}
          <Text style={styles.pricePeriod}>
            /{billingCycle === 'monthly' ? 'mes' : 'ano'}
          </Text>
        </Text>
        {billingCycle === 'yearly' && (
          <Text style={styles.savings}>Ahorras ${savings} al ano</Text>
        )}
        {childrenCount > 1 && (
          <Text style={styles.breakdown}>
            Base $17 + {childrenCount - 1} {childrenCount - 1 === 1 ? 'hijo adicional' : 'hijos adicionales'} (${(childrenCount - 1) * 10})
          </Text>
        )}
      </Card>

      {/* Features */}
      <Card style={styles.featuresCard} padding="lg">
        <Text style={styles.featuresTitle}>Incluye:</Text>
        {PLAN_FEATURES.map((feature, i) => (
          <View key={i} style={styles.featureRow}>
            <MaterialIcons name="check-circle" size={20} color={colors.success} />
            <Text style={styles.featureText}>{feature}</Text>
          </View>
        ))}
        <View style={styles.featureRow}>
          <MaterialIcons name="check-circle" size={20} color={colors.success} />
          <Text style={styles.featureText}>
            {childrenCount} {childrenCount === 1 ? 'perfil' : 'perfiles'} junior
          </Text>
        </View>
      </Card>

      <Button
        title="Continuar"
        onPress={handleContinue}
        fullWidth
        style={styles.button}
      />
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
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 4,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  toggleOption: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  toggleActive: {
    backgroundColor: colors.primary,
  },
  toggleText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  toggleTextActive: {
    color: '#ffffff',
  },
  childrenCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  childrenLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
  },
  counterBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  counterBtnDisabled: {
    opacity: 0.4,
  },
  counterValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['4xl'],
    color: colors.primary,
    minWidth: 40,
    textAlign: 'center',
  },
  childrenHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 8,
  },
  priceCard: {
    marginBottom: 16,
    alignItems: 'center',
    backgroundColor: colors.primary + '08',
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  priceLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  price: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['4xl'],
    color: colors.primary,
  },
  pricePeriod: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.lg,
    color: colors.textSecondary,
  },
  savings: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    color: colors.success,
    marginTop: 4,
  },
  breakdown: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginTop: 4,
  },
  featuresCard: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  featureText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    flex: 1,
  },
  button: {
    marginBottom: 16,
  },
});
