import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import Purchases from 'react-native-purchases';
import { Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { getSubscriptionStatus } from '@/services/purchaseService';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

const CONFIRMATION_WORD = 'ELIMINAR';

const DELETED_DATA_ITEMS = [
  'Tu perfil y datos personales',
  'Datos de tus hijos vinculados',
  'Codigos de padre e hijos (P-XXXXXXXX, E-XXXXXXXX)',
  'Historial de sesiones y notificaciones',
  'Membresia y datos de suscripcion',
];

export default function EliminarCuentaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { deleteAccount } = useAuthStore();

  const [confirmation, setConfirmation] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  useEffect(() => {
    getSubscriptionStatus().then(({ isActive }) => {
      setHasActiveSubscription(isActive);
    });
  }, []);

  const isConfirmed = confirmation.toUpperCase() === CONFIRMATION_WORD;

  const handleManageSubscription = useCallback(async () => {
    try {
      await Purchases.showManageSubscriptions();
    } catch {
      if (Platform.OS === 'ios') {
        Linking.openURL('https://apps.apple.com/account/subscriptions');
      } else {
        Linking.openURL('https://play.google.com/store/account/subscriptions');
      }
    }
  }, []);

  const handleDelete = useCallback(async () => {
    Alert.alert(
      'Eliminar cuenta',
      'Esta accion es permanente y no se puede deshacer. Se eliminaran todos tus datos, los de tu familia y los codigos de acceso.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Si, eliminar mi cuenta',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            const result = await deleteAccount();

            if (result.success) {
              setIsDeleting(false);
              Alert.alert(
                'Cuenta eliminada',
                'Tu cuenta ha sido eliminada exitosamente.',
                [{ text: 'OK', onPress: () => router.replace('/login') }]
              );
            } else if (result.error?.includes('suscripcion')) {
              setIsDeleting(false);
              Alert.alert(
                'Suscripcion activa',
                'Debes cancelar tu suscripcion antes de eliminar tu cuenta.',
                [
                  { text: 'Cancelar suscripcion', onPress: handleManageSubscription },
                  { text: 'Volver', style: 'cancel' },
                ]
              );
            } else {
              setIsDeleting(false);
              Alert.alert(
                'Error',
                result.error || 'No se pudo eliminar la cuenta. Intenta de nuevo.'
              );
            }
          },
        },
      ]
    );
  }, [deleteAccount, handleManageSubscription, router]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Eliminar cuenta</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Warning */}
        <Card style={styles.warningCard} padding="md">
          <View style={styles.warningRow}>
            <MaterialIcons name="warning" size={24} color={colors.error} />
            <View style={styles.warningTextContainer}>
              <Text style={styles.warningTitle}>Accion irreversible</Text>
              <Text style={styles.warningText}>
                Eliminar tu cuenta es permanente y no se puede deshacer.
                Se eliminara toda tu informacion personal, datos familiares,
                hijos vinculados y codigos de acceso.
              </Text>
            </View>
          </View>
        </Card>

        {/* What gets deleted */}
        <Card style={styles.dataCard} padding="lg">
          <Text style={styles.sectionTitle}>Datos que se eliminaran</Text>
          {DELETED_DATA_ITEMS.map((item, index) => (
            <View key={index} style={styles.dataItem}>
              <MaterialIcons name="remove-circle" size={18} color={colors.error} />
              <Text style={styles.dataItemText}>{item}</Text>
            </View>
          ))}
        </Card>

        {/* Active subscription warning */}
        {hasActiveSubscription && (
          <Card style={styles.subscriptionCard} padding="md">
            <View style={styles.warningRow}>
              <MaterialIcons name="info" size={22} color={colors.warning} />
              <View style={styles.warningTextContainer}>
                <Text style={styles.subscriptionWarning}>
                  Tienes una suscripcion activa. Debes cancelarla antes de
                  eliminar tu cuenta para evitar cargos futuros.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={styles.manageButton}
              onPress={handleManageSubscription}
            >
              <Text style={styles.manageButtonText}>Cancelar suscripcion</Text>
            </TouchableOpacity>
          </Card>
        )}

        {/* Confirmation input */}
        <View style={styles.confirmSection}>
          <Text style={styles.confirmLabel}>
            Escribe <Text style={styles.confirmWord}>{CONFIRMATION_WORD}</Text> para confirmar
          </Text>
          <TextInput
            style={styles.confirmInput}
            value={confirmation}
            onChangeText={setConfirmation}
            placeholder={CONFIRMATION_WORD}
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!isDeleting}
          />
        </View>

        {/* Delete button */}
        {isDeleting ? (
          <View style={styles.deletingContainer}>
            <ActivityIndicator size="large" color={colors.error} />
            <Text style={styles.deletingText}>Eliminando cuenta...</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={[styles.deleteButton, !isConfirmed && styles.deleteButtonDisabled]}
            onPress={handleDelete}
            disabled={!isConfirmed}
            activeOpacity={0.7}
          >
            <MaterialIcons name="delete-forever" size={22} color="#FFFFFF" />
            <Text style={styles.deleteButtonText}>Eliminar mi cuenta</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    padding: 16,
  },
  warningCard: {
    backgroundColor: colors.error + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 16,
  },
  warningRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  warningTextContainer: {
    flex: 1,
  },
  warningTitle: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base,
    color: colors.error,
    marginBottom: 4,
  },
  warningText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: fontSizes.sm * 1.5,
  },
  dataCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  dataItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 6,
  },
  dataItemText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    flex: 1,
  },
  subscriptionCard: {
    backgroundColor: '#FFF3CD',
    borderLeftWidth: 4,
    borderLeftColor: colors.warning,
    marginBottom: 16,
  },
  subscriptionWarning: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
    lineHeight: fontSizes.sm * 1.5,
  },
  manageButton: {
    marginTop: 12,
    alignSelf: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  manageButtonText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    color: colors.warning,
  },
  confirmSection: {
    marginBottom: 24,
  },
  confirmLabel: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 8,
  },
  confirmWord: {
    fontFamily: fontFamilies.bold,
    color: colors.error,
  },
  confirmInput: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    textAlign: 'center',
    letterSpacing: 4,
  },
  deletingContainer: {
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
  },
  deletingText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.error,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: colors.error,
    paddingVertical: 16,
    borderRadius: 12,
  },
  deleteButtonDisabled: {
    opacity: 0.4,
  },
  deleteButtonText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.base,
    color: '#FFFFFF',
  },
});
