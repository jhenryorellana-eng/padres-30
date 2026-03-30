import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { SystemBars } from 'react-native-edge-to-edge';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import colors from '@/constants/colors';
import { configureRevenueCat } from '@/lib/revenuecat';
import { prefetchOfferings } from '@/services/purchaseService';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    'Quicksand-Light': require('../assets/fonts/Quicksand-Light.ttf'),
    'Quicksand-Regular': require('../assets/fonts/Quicksand-Regular.ttf'),
    'Quicksand-Medium': require('../assets/fonts/Quicksand-Medium.ttf'),
    'Quicksand-SemiBold': require('../assets/fonts/Quicksand-SemiBold.ttf'),
    'Quicksand-Bold': require('../assets/fonts/Quicksand-Bold.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Initialize RevenueCat SDK and pre-fetch offerings so products
  // are ready by the time the user reaches the paywall
  useEffect(() => {
    configureRevenueCat()
      .then(() => prefetchOfferings())
      .catch(console.error);
  }, []);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <SystemBars style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: colors.background },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="login" options={{ animation: 'fade' }} />
          <Stack.Screen
            name="miniapp/[id]"
            options={{
              presentation: 'fullScreenModal',
              animation: 'fade',
            }}
          />
          <Stack.Screen
            name="app-info/[id]"
            options={{
              headerShown: true,
              animation: 'slide_from_right',
            }}
          />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="perfil/informacion" />
          <Stack.Screen name="perfil/hijos" />
          <Stack.Screen name="perfil/membresia" />
          <Stack.Screen name="perfil/eliminar-cuenta" />
        </Stack>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
