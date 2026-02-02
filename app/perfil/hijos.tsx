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
import { Card, Badge } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { LinkedChild } from '@/types';

interface ChildCardProps {
  child: LinkedChild;
}

function ChildCard({ child }: ChildCardProps) {
  const router = useRouter();

  const handleCopyCode = useCallback(async () => {
    await Clipboard.setStringAsync(child.code);
    Alert.alert('Copiado', `Código de ${child.name} copiado al portapapeles`);
  }, [child.code, child.name]);

  const handleViewDashboard = useCallback(() => {
    router.push('/miniapp/child_dashboard');
  }, [router]);

  const initials = child.name
    .split(' ')
    .map((word) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <Card style={styles.childCard}>
      <View style={styles.childHeader}>
        <View style={styles.childAvatar}>
          <Text style={styles.childAvatarText}>{initials}</Text>
        </View>
        <View style={styles.childInfo}>
          <Text style={styles.childName}>{child.name}</Text>
          <View style={styles.codeContainer}>
            <Text style={styles.childCode}>{child.code}</Text>
            <TouchableOpacity onPress={handleCopyCode} style={styles.copyButton}>
              <MaterialIcons name="content-copy" size={16} color={colors.primary} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <View style={styles.childActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={handleViewDashboard}
        >
          <MaterialIcons name="insights" size={20} color={colors.primary} />
          <Text style={styles.actionText}>Ver progreso</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
}

export default function HijosScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();

  const children = user?.linkedChildren || [];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Mis Hijos</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {children.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>
              Hijos vinculados ({children.length})
            </Text>

            {children.map((child) => (
              <ChildCard key={child.id} child={child} />
            ))}

            <View style={styles.hintContainer}>
              <MaterialIcons
                name="info-outline"
                size={20}
                color={colors.textSecondary}
              />
              <Text style={styles.hintText}>
                Comparte el código de cada hijo para que puedan acceder a CEO
                Junior con su propia cuenta.
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.emptyContainer}>
            <MaterialIcons
              name="child-care"
              size={64}
              color={colors.textSecondary}
            />
            <Text style={styles.emptyTitle}>Sin hijos vinculados</Text>
            <Text style={styles.emptyText}>
              Aún no tienes hijos vinculados a tu cuenta familiar. Contacta al
              soporte para agregar hijos a tu membresía.
            </Text>
          </View>
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
    paddingBottom: 40,
  },
  sectionTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 16,
  },
  childCard: {
    marginBottom: 12,
    padding: 16,
  },
  childHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg,
    color: colors.textLight,
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 4,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  childCode: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.sm,
    color: colors.starbizDark,
    letterSpacing: 0.5,
  },
  copyButton: {
    padding: 4,
    marginLeft: 8,
  },
  childActions: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    paddingHorizontal: 12,
    backgroundColor: colors.lavender,
    borderRadius: 8,
  },
  actionText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    marginLeft: 6,
  },
  hintContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: colors.lavender,
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  hintText: {
    flex: 1,
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginLeft: 12,
    lineHeight: fontSizes.sm * 1.5,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: fontSizes.base * 1.5,
  },
});
