import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { MiniApp } from '@/constants/miniApps';

interface MiniAppHeaderProps {
  app: MiniApp;
  onInfo: () => void;
  onClose: () => void;
}

export function MiniAppHeader({ app, onInfo, onClose }: MiniAppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <TouchableOpacity style={styles.button} onPress={onInfo}>
        <MaterialIcons name="info-outline" size={24} color={colors.textLight} />
      </TouchableOpacity>

      <View style={styles.titleContainer}>
        <View style={[styles.iconDot, { backgroundColor: app.color }]} />
        <Text style={styles.title}>{app.name}</Text>
      </View>

      <TouchableOpacity style={styles.button} onPress={onClose}>
        <MaterialIcons name="close" size={24} color={colors.textLight} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.starbizDark,
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  button: {
    padding: 12,
    borderRadius: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  title: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.textLight,
  },
});

export default MiniAppHeader;
