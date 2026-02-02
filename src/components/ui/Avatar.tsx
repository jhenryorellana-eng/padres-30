import React from 'react';
import { View, Text, Image, StyleSheet, ViewStyle } from 'react-native';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { getInitials } from '@/utils/formatters';

interface AvatarProps {
  name: string;
  imageUrl?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  style?: ViewStyle;
}

const SIZES = {
  sm: 32,
  md: 48,
  lg: 64,
  xl: 96,
};

const FONT_SIZES = {
  sm: fontSizes.sm,
  md: fontSizes.lg,
  lg: fontSizes.xl,
  xl: fontSizes['3xl'],
};

export function Avatar({ name, imageUrl, size = 'md', style }: AvatarProps) {
  const dimension = SIZES[size];
  const fontSize = FONT_SIZES[size];

  const containerStyle = [
    styles.container,
    {
      width: dimension,
      height: dimension,
      borderRadius: dimension / 2,
    },
    style,
  ];

  if (imageUrl) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: imageUrl }}
          style={[
            styles.image,
            { width: dimension, height: dimension, borderRadius: dimension / 2 },
          ]}
        />
      </View>
    );
  }

  const initials = getInitials(name);

  return (
    <View style={containerStyle}>
      <Text style={[styles.initials, { fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    resizeMode: 'cover',
  },
  initials: {
    fontFamily: fontFamilies.bold,
    color: colors.textLight,
  },
});

export default Avatar;
