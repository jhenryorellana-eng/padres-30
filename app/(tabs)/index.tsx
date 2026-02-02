import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppGrid } from '@/components/apps';
import { useAuthStore } from '@/stores/authStore';
import { useApps } from '@/hooks/useApps';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { MiniApp } from '@/constants/miniApps';

export default function AppsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  const { apps } = useApps();

  const firstName =
    user?.firstName || user?.fullName?.split(' ')[0] || 'Usuario';

  const handleAppPress = useCallback(
    (app: MiniApp) => {
      router.push(`/miniapp/${app.id}`);
    },
    [router]
  );

  const handleAppLongPress = useCallback(
    (app: MiniApp) => {
      router.push(`/app-info/${app.id}`);
    },
    [router]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.headerContainer}>
        <View style={styles.headerLeft}>
          <Text style={styles.greeting}>Hola, {firstName}</Text>
          <Text style={styles.subtitle}>Gestiona tu familia</Text>
        </View>
      </View>

      <AppGrid
        apps={apps}
        onAppPress={handleAppPress}
        onAppLongPress={handleAppLongPress}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['2xl'],
    color: colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
});
