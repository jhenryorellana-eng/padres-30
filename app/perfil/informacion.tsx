import React, { useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { Avatar, Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { formatMemberSince } from '@/utils/formatters';

interface InfoRowProps {
  label: string;
  value: string;
  copiable?: boolean;
}

function InfoRow({ label, value, copiable }: InfoRowProps) {
  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(value);
    Alert.alert('Copiado', 'Código copiado al portapapeles');
  }, [value]);

  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <View style={styles.infoValueContainer}>
        <Text style={[styles.infoValue, copiable && styles.infoValueCopiable]}>
          {value}
        </Text>
        {copiable && (
          <TouchableOpacity onPress={handleCopy} style={styles.copyButton}>
            <MaterialIcons name="content-copy" size={18} color={colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export default function InformacionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const fullName = user?.fullName || 'Usuario';
  const memberSince = user?.createdAt ? formatMemberSince(user.createdAt) : '-';
  const childrenCount = user?.linkedChildren?.length || 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mi Información</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.avatarSection}>
          <Avatar name={fullName} size="xl" />
          <Text style={styles.name}>{fullName}</Text>
          <Badge text="PADRES 3.0" variant="primary" />
        </View>

        <Card style={styles.infoCard}>
          {user?.email && <InfoRow label="Email" value={user.email} />}
          {user?.code && (
            <InfoRow label="Código de padre" value={user.code} copiable />
          )}
          <InfoRow label="Hijos vinculados" value={`${childrenCount} hijo${childrenCount !== 1 ? 's' : ''}`} />
          <InfoRow label="Miembro desde" value={memberSince} />
        </Card>

        <Text style={styles.note}>
          Puedes administrar la información de tus hijos desde la sección
          "Mis Hijos" en tu cuenta.
        </Text>
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
    paddingBottom: 40,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 16,
  },
  name: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['2xl'],
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  infoCard: {
    marginBottom: 24,
  },
  infoRow: {
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  infoLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  infoValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoValue: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
  },
  infoValueCopiable: {
    fontFamily: fontFamilies.bold,
    color: colors.starbizDark,
    letterSpacing: 1,
  },
  copyButton: {
    padding: 4,
  },
  note: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.sm * 1.5,
  },
});
