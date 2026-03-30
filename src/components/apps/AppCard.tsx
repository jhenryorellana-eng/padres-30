import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { MiniApp } from '@/constants/miniApps';

interface AppCardProps {
  app: MiniApp;
  isActive?: boolean;
  cardWidth: number;
  iconSize: number;
}

export function AppCard({ app, isActive, cardWidth, iconSize }: AppCardProps) {
  const borderRadius = Math.round(iconSize * 0.28);
  const materialIconSize = Math.round(iconSize * 0.5);

  return (
    <View style={[styles.container, { width: cardWidth }, isActive && styles.containerActive]}>
      <View style={styles.iconWrapper}>
        <LinearGradient
          colors={[app.gradient.from, app.gradient.to]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.iconContainer, { width: iconSize, height: iconSize, borderRadius }]}
        >
          <View style={[styles.iconOverlay, { borderRadius }]} />
          <MaterialIcons
            name={app.icon as keyof typeof MaterialIcons.glyphMap}
            size={materialIconSize}
            color={colors.textLight}
          />
        </LinearGradient>
      </View>
      <Text style={[styles.name, { maxWidth: cardWidth - 8 }]} numberOfLines={1}>
        {app.name}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
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
  },
  name: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
    textAlign: 'center',
  },
});

export default AppCard;
