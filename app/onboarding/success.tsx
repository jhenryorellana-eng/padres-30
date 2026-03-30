import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Clipboard from 'expo-clipboard';
import { Button, Card } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { MaterialIcons } from '@expo/vector-icons';
import type { PostPurchaseInfo } from '@/types';

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ childNames?: string }>();
  const { basicUser, upgradeToFullAuth } = useAuthStore();

  const [info, setInfo] = useState<PostPurchaseInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEntering, setIsEntering] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  // Parse child names from route params
  const childNames: string[] = params.childNames
    ? JSON.parse(params.childNames)
    : [];

  const fetchInfo = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Use fetch directly to avoid API client's auto-logout on 401
      const token = useAuthStore.getState().accessToken;
      const apiUrl = process.env.EXPO_PUBLIC_API_URL || '';

      const response = await fetch(`${apiUrl}/api/auth/post-purchase-info`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });

      if (response.ok) {
        const data = await response.json();
        if (data?.familyId) {
          setInfo(data);
        } else {
          setError('Tu compra se esta procesando. Espera un momento.');
        }
      } else {
        setError('No se pudieron obtener los codigos.');
      }
    } catch {
      setError('Error de conexion. Verifica tu internet.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInfo();
  }, [fetchInfo]);

  const handleCopy = useCallback(async (code: string) => {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }, []);

  const handleGoToApp = useCallback(async () => {
    if (!basicUser) {
      router.replace('/login');
      return;
    }

    setIsEntering(true);
    setError(null);

    try {
      if (info?.parentCode && info.familyId) {
        const fullUser = {
          id: basicUser.id,
          email: basicUser.email,
          firstName: basicUser.firstName,
          lastName: basicUser.lastName,
          fullName: `${basicUser.firstName} ${basicUser.lastName}`,
          code: info.parentCode,
          familyId: info.familyId,
          role: 'parent' as const,
          linkedChildren: info.childCodes.map((code, i) => ({
            id: `child-${i}`,
            name: childNames[i] || '',
            code,
          })),
          createdAt: new Date().toISOString(),
        };

        await upgradeToFullAuth(fullUser);
        router.replace('/(tabs)');
      } else {
        setError('Informacion incompleta. Intenta iniciar sesion desde la pantalla de login.');
      }
    } catch {
      setError('Error al ingresar. Intenta iniciar sesion desde la pantalla de login.');
    } finally {
      setIsEntering(false);
    }
  }, [basicUser, info, childNames, upgradeToFullAuth, router]);

  if (isLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + 48 }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={styles.loadingText}>Cargando tus codigos...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={[
        styles.scrollContent,
        { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Success icon */}
      <View style={styles.iconContainer}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="check" size={48} color="#ffffff" />
        </View>
      </View>

      <Text style={styles.title}>Registro completado</Text>
      <Text style={styles.subtitle}>
        Tu familia ya esta registrada en Starbiz Academy
      </Text>

      {error && (
        <Card style={styles.errorCard} padding="md">
          <Text style={styles.errorText}>{error}</Text>
          <Button
            title="Reintentar"
            onPress={fetchInfo}
            variant="ghost"
            size="sm"
            style={{ marginTop: 8 }}
          />
        </Card>
      )}

      {/* Parent code */}
      {info?.parentCode && (
        <Card style={styles.codeCard} padding="lg">
          <Text style={styles.codeLabel}>Tu codigo de padre</Text>
          <View style={styles.codeRow}>
            <Text style={styles.codeValue}>{info.parentCode}</Text>
            <Button
              title={copiedCode === info.parentCode ? 'Copiado' : 'Copiar'}
              onPress={() => handleCopy(info.parentCode!)}
              variant={copiedCode === info.parentCode ? 'ghost' : 'outline'}
              size="sm"
            />
          </View>
          <Text style={styles.codeHint}>
            Usalo para iniciar sesion en la app
          </Text>
        </Card>
      )}

      {/* Child codes */}
      {info?.childCodes && info.childCodes.length > 0 && (
        <Card style={styles.codeCard} padding="lg">
          <Text style={styles.codeLabel}>
            {info.childCodes.length === 1 ? 'Codigo de tu hijo' : 'Codigos de tus hijos'}
          </Text>
          {info.childCodes.map((code, index) => (
            <View key={code} style={styles.childCodeRow}>
              <View style={styles.childCodeInfo}>
                <Text style={styles.childCodeIndex}>
                  {childNames[index] || `Hijo ${index + 1}`}
                </Text>
                <Text style={styles.childCodeValue}>{code}</Text>
              </View>
              <Button
                title={copiedCode === code ? 'Copiado' : 'Copiar'}
                onPress={() => handleCopy(code)}
                variant={copiedCode === code ? 'ghost' : 'outline'}
                size="sm"
              />
            </View>
          ))}
          <Text style={styles.codeHint}>
            Tus hijos usaran estos codigos en la app CEO Junior
          </Text>
        </Card>
      )}

      {/* Important note */}
      <Card style={styles.noteCard} padding="md">
        <View style={styles.noteRow}>
          <MaterialIcons name="info" size={20} color={colors.info} />
          <Text style={styles.noteText}>
            Guarda estos codigos en un lugar seguro. Los necesitaras para iniciar sesion en las apps.
          </Text>
        </View>
      </Card>

      <Button
        title={isEntering ? 'Ingresando...' : 'Ir a la app'}
        onPress={handleGoToApp}
        loading={isEntering}
        disabled={isEntering || !info?.familyId}
        fullWidth
        style={styles.button}
      />

      <Button
        title="Ir al login"
        onPress={() => router.replace('/login')}
        variant="ghost"
        fullWidth
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['3xl'],
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  errorCard: {
    backgroundColor: colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 16,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  codeCard: {
    marginBottom: 16,
  },
  codeLabel: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 12,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  codeValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['2xl'],
    color: colors.primary,
    letterSpacing: 1,
  },
  codeHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textTertiary,
  },
  childCodeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  childCodeInfo: {
    flex: 1,
  },
  childCodeIndex: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    marginBottom: 2,
  },
  childCodeValue: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.lg,
    color: colors.primary,
    letterSpacing: 1,
  },
  noteCard: {
    backgroundColor: colors.info + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.info,
    marginBottom: 24,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  noteText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    flex: 1,
    lineHeight: fontSizes.sm * 1.5,
  },
  button: {
    marginBottom: 12,
  },
});
