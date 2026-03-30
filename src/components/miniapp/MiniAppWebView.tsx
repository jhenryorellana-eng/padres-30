import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ActivityIndicator,
  Text,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { MiniAppHeader } from './MiniAppHeader';
import { useMiniAppBridge } from '@/hooks/useMiniAppBridge';
import {
  generateMiniAppCode,
  buildMiniAppAuthUrl,
} from '@/services/miniAppService';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import type { MiniApp } from '@/constants/miniApps';

interface MiniAppWebViewProps {
  app: MiniApp;
  onClose: () => void;
}

export function MiniAppWebView({ app, onClose }: MiniAppWebViewProps) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [authUrl, setAuthUrl] = useState<string | null>(null);

  const scale = useSharedValue(0.9);
  const opacity = useSharedValue(0);

  const { webViewRef, handleMessage, injectedJavaScript } = useMiniAppBridge({
    onClose,
  });

  // Animate in
  useEffect(() => {
    scale.value = withSpring(1, { damping: 15 });
    opacity.value = withTiming(1, { duration: 200 });
  }, []);

  // Generate auth code and build URL
  useEffect(() => {
    async function initAuth() {
      try {
        // Para padres, no pasamos childId - el padre accede con su propio contexto
        const codeData = await generateMiniAppCode(app.id);
        if (codeData) {
          const url = buildMiniAppAuthUrl(app.url, codeData.code);
          setAuthUrl(url);
        } else {
          setError('No se pudo generar el código de acceso');
        }
      } catch (err) {
        setError('Error al conectar con la mini-app');
      }
    }

    initAuth();
  }, [app.id, app.url]);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setError('Error al cargar la mini-app');
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <MiniAppHeader
        app={app}
        onInfo={() => router.push(`/app-info/${app.id}`)}
        onClose={onClose}
      />

      <View style={[styles.webviewContainer, { paddingBottom: insets.bottom }]}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Cargando {app.name}...</Text>
          </View>
        )}

        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {authUrl && !error && (
          <WebView
            ref={webViewRef}
            source={{ uri: authUrl }}
            style={styles.webview}
            onLoadEnd={handleLoadEnd}
            onError={handleError}
            onMessage={handleMessage}
            injectedJavaScript={injectedJavaScript}
            javaScriptEnabled
            domStorageEnabled
            startInLoadingState={false}
            scalesPageToFit
            allowsInlineMediaPlayback
            mediaPlaybackRequiresUserAction={false}
            originWhitelist={['https://*.starbizacademy.com', 'https://starbizacademy.com']}
          />
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.starbizDark,
  },
  webviewContainer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.error,
    textAlign: 'center',
  },
});

export default MiniAppWebView;
