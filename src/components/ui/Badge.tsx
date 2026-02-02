import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

interface BadgeProps {
  text: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

export function Badge({
  text,
  variant = 'default',
  size = 'md',
  style,
}: BadgeProps) {
  return (
    <View style={[styles.base, styles[variant], styles[`size_${size}`], style]}>
      <Text style={[styles.text, styles[`text_${variant}`], styles[`textSize_${size}`]]}>
        {text}
      </Text>
    </View>
  );
}

// Notification dot badge
interface NotificationBadgeProps {
  count?: number;
  style?: ViewStyle;
}

export function NotificationBadge({ count, style }: NotificationBadgeProps) {
  if (!count || count <= 0) return null;

  const displayCount = count > 99 ? '99+' : count.toString();

  return (
    <View style={[styles.notificationBadge, style]}>
      <Text style={styles.notificationText}>{displayCount}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    alignSelf: 'flex-start',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  // Variants
  default: {
    backgroundColor: colors.lavender,
  },
  primary: {
    backgroundColor: colors.primary,
  },
  success: {
    backgroundColor: colors.success,
  },
  warning: {
    backgroundColor: colors.warning,
  },
  error: {
    backgroundColor: colors.error,
  },
  info: {
    backgroundColor: colors.info,
  },
  // Sizes
  size_sm: {
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  size_md: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  size_lg: {
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  // Text styles
  text: {
    fontFamily: fontFamilies.semiBold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  text_default: {
    color: colors.secondary,
  },
  text_primary: {
    color: colors.textLight,
  },
  text_success: {
    color: colors.textLight,
  },
  text_warning: {
    color: colors.text,
  },
  text_error: {
    color: colors.textLight,
  },
  text_info: {
    color: colors.textLight,
  },
  textSize_sm: {
    fontSize: fontSizes.xs - 2,
  },
  textSize_md: {
    fontSize: fontSizes.xs,
  },
  textSize_lg: {
    fontSize: fontSizes.sm,
  },
  // Notification badge
  notificationBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: colors.error,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  notificationText: {
    fontFamily: fontFamilies.bold,
    fontSize: 10,
    color: colors.textLight,
  },
});

export default Badge;
