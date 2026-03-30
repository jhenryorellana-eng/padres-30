import React from 'react';
import { Stack } from 'expo-router';
import colors from '@/constants/colors';

export default function OnboardingLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
        gestureEnabled: false,
      }}
    >
      <Stack.Screen name="register" />
      <Stack.Screen name="select-plan" />
      <Stack.Screen name="paywall" />
      <Stack.Screen name="register-children" />
      <Stack.Screen name="success" />
    </Stack>
  );
}
