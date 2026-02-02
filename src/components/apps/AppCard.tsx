import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { MiniApp } from '@/constants/miniApps';

const { width } = Dimensions.get('window');
const GRID_PADDING = 16;
const GRID_GAP_X = 24;
const GRID_GAP_Y = 40;
const NUM_COLUMNS = 3;
const CARD_WIDTH =
  (width - GRID_PADDING * 2 - GRID_GAP_X * (NUM_COLUMNS - 1)) / NUM_COLUMNS;
const ICON_SIZE = 72;

interface AppCardProps {
  app: MiniApp;
  isActive?: boolean;
}

export function AppCard({ app, isActive }: AppCardProps) {
  return (
    <View style={[styles.container, isActive && styles.containerActive]}>
      <View style={styles.iconWrapper}>
        <LinearGradient
          colors={[app.gradient.from, app.gradient.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconContainer}
        >
          {/* Bright overlay effect */}
          <View style={styles.iconOverlay} />
          <MaterialIcons
            name={app.icon as keyof typeof MaterialIcons.glyphMap}
            size={36}
            color={colors.textLight}
          />
        </LinearGradient>
      </View>
      <Text style={styles.name} numberOfLines={1}>
        {app.name}
      </Text>
    </View>
  );
}

export const CARD_DIMENSIONS = {
  width: CARD_WIDTH,
  iconSize: ICON_SIZE,
  gapX: GRID_GAP_X,
  gapY: GRID_GAP_Y,
  columns: NUM_COLUMNS,
  padding: GRID_PADDING,
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    alignItems: 'center',
    paddingVertical: 8,
  },
  containerActive: {
    opacity: 0.9,
    transform: [{ scale: 1.05 }],
  },
  iconWrapper: {
    marginBottom: 10,
  },
  iconContainer: {
    width: ICON_SIZE,
    height: ICON_SIZE,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  iconOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
  },
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'center',
    maxWidth: CARD_WIDTH - 8,
  },
});

export default AppCard;
