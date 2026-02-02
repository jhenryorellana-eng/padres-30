import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MiniAppWebView } from '@/components/miniapp';
import { getMiniAppById } from '@/constants/miniApps';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

export default function MiniAppScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();

  const app = getMiniAppById(id);

  if (!app) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>Mini-app no encontrada</Text>
      </View>
    );
  }

  const handleClose = () => {
    router.back();
  };

  return (
    <View style={styles.container}>
      <MiniAppWebView app={app} onClose={handleClose} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.starbizDark,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: 24,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.lg,
    color: colors.error,
    textAlign: 'center',
  },
});
