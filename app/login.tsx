import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { loginWithoutCode, AUTH_ERRORS } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import {
  isValidEmail,
  isValidParentCode,
  formatParentCode,
} from '@/utils/validators';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

type Step = 'credentials' | 'code';

export default function LoginScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { signIn } = useAuth();

  const [step, setStep] = useState<Step>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPurchaseOption, setShowPurchaseOption] = useState(false);

  // Validation errors
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [codeError, setCodeError] = useState<string | null>(null);

  const validateCredentials = useCallback(() => {
    let valid = true;
    setEmailError(null);
    setPasswordError(null);

    if (!email.trim()) {
      setEmailError('El email es requerido');
      valid = false;
    } else if (!isValidEmail(email)) {
      setEmailError('Email inválido');
      valid = false;
    }

    if (!password) {
      setPasswordError('La contraseña es requerida');
      valid = false;
    } else if (password.length < 8) {
      setPasswordError('Minimo 8 caracteres');
      valid = false;
    }

    return valid;
  }, [email, password]);

  const validateCode = useCallback(() => {
    setCodeError(null);

    if (!code.trim()) {
      setCodeError('El código es requerido');
      return false;
    }

    const formattedCode = code.toUpperCase();
    if (!isValidParentCode(formattedCode)) {
      setCodeError('Formato inválido. Ejemplo: P-12345678');
      return false;
    }

    return true;
  }, [code]);

  const handleContinue = useCallback(() => {
    setError(null);

    if (validateCredentials()) {
      setStep('code');
    }
  }, [validateCredentials]);

  const handleBack = useCallback(() => {
    setStep('credentials');
    setCode('');
    setCodeError(null);
    setError(null);
    setShowPurchaseOption(false);
  }, []);

  const handleLogin = useCallback(async () => {
    setError(null);

    if (!validateCode()) return;

    setIsLoading(true);

    try {
      const formattedCode = code.toUpperCase();
      const result = await signIn({
        email: email.trim().toLowerCase(),
        password,
        code: formattedCode,
      });

      if (result.success) {
        router.replace('/(tabs)');
      } else {
        setError(result.error);
        const memErrors = [AUTH_ERRORS.MEMBERSHIP_EXPIRED, AUTH_ERRORS.MEMBERSHIP_INACTIVE];
        if (result.errorCode && memErrors.includes(result.errorCode)) {
          setShowPurchaseOption(true);
          // If partialAuth returned, identify user in RevenueCat so IAP purchase
          // will be linked to their account (not anonymous)
          if (result.partialAuth) {
            const { loginPartial } = useAuthStore.getState();
            await loginPartial(
              result.partialAuth.user,
              result.partialAuth.accessToken,
              result.partialAuth.refreshToken
            );
          }
        }
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, code, signIn, router, validateCode]);

  const handleNoCode = useCallback(async () => {
    if (!email.trim() || !password) {
      setError('Ingresa tu email y contrasena primero');
      setStep('credentials');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const result = await loginWithoutCode({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.success) {
        const { login } = useAuthStore.getState();
        await login(result.data.user, result.data.accessToken, result.data.refreshToken);
        router.replace('/(tabs)');
      } else {
        if (result.needsPurchase || result.error.code === AUTH_ERRORS.NEEDS_PURCHASE) {
          setError('No tienes una membresia activa. Puedes comprar una desde aqui.');
          setShowPurchaseOption(true);
        } else if (
          result.error.code === AUTH_ERRORS.MEMBERSHIP_EXPIRED ||
          result.error.code === AUTH_ERRORS.MEMBERSHIP_INACTIVE
        ) {
          setError(result.error.message);
          setShowPurchaseOption(true);
        } else {
          setError(result.error.message);
        }
      }
    } catch {
      setError('Error al iniciar sesion. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, router]);

  const handleCodeChange = useCallback((text: string) => {
    setCode(formatParentCode(text));
    setCodeError(null);
  }, []);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../assets/images/icon.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <Text style={styles.title}>
          {step === 'credentials' ? 'Bienvenido' : 'Código de Padre'}
        </Text>
        <Text style={styles.subtitle}>
          {step === 'credentials'
            ? 'Ingresa tus credenciales para continuar'
            : 'Ingresa tu código de acceso'}
        </Text>

        {error && (
          <Card style={styles.errorCard} padding="md">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        {showPurchaseOption && (
          <Card style={styles.purchaseCard} padding="md">
            <Text style={styles.purchaseText}>
              Compra una membresia familiar para acceder a todas las mini-apps educativas.
            </Text>
            <Button
              title="Comprar membresia"
              onPress={() => router.push('/onboarding/select-plan')}
              fullWidth
              size="sm"
              style={styles.purchaseButton}
            />
          </Card>
        )}

        {step === 'credentials' ? (
          <>
            <Input
              label="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                setEmailError(null);
              }}
              placeholder="tu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              error={emailError || undefined}
              icon="email"
            />

            <Input
              label="Contraseña"
              value={password}
              onChangeText={(text) => {
                setPassword(text);
                setPasswordError(null);
              }}
              placeholder="Tu contraseña"
              secureTextEntry
              autoComplete="password"
              error={passwordError || undefined}
              icon="lock"
            />

            <Button
              title="Continuar"
              onPress={handleContinue}
              fullWidth
              style={styles.button}
            />

            <TouchableOpacity
              onPress={() => router.push('/onboarding/register')}
              style={styles.linkContainer}
            >
              <Text style={styles.linkText}>No tengo cuenta. </Text>
              <Text style={[styles.linkText, styles.linkTextBold]}>Registrarme</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <Input
              label="Código de Padre"
              value={code}
              onChangeText={handleCodeChange}
              placeholder="P-12345678"
              autoCapitalize="characters"
              maxLength={10}
              error={codeError || undefined}
              icon="vpn-key"
            />

            <Text style={styles.codeHint}>
              Este código lo recibiste al activar tu membresía familiar en
              Starbiz Academy.
            </Text>

            <Button
              title="Iniciar Sesión"
              onPress={handleLogin}
              loading={isLoading}
              disabled={isLoading}
              fullWidth
              style={styles.button}
            />

            <Button
              title="Volver"
              onPress={handleBack}
              variant="ghost"
              fullWidth
            />

            <TouchableOpacity
              onPress={handleNoCode}
              style={styles.linkContainer}
              disabled={isLoading}
            >
              <Text style={styles.linkText}>Ya tengo cuenta pero </Text>
              <Text style={[styles.linkText, styles.linkTextBold]}>no tengo codigo</Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoImage: {
    width: 120,
    height: 120,
    borderRadius: 28,
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
    marginBottom: 32,
  },
  errorCard: {
    backgroundColor: colors.error + '15',
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 24,
  },
  errorText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.error,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
  codeHint: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: fontSizes.sm * 1.5,
  },
  linkContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  linkText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
  },
  linkTextBold: {
    fontFamily: fontFamilies.semiBold,
    color: colors.primary,
  },
  purchaseCard: {
    backgroundColor: colors.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginBottom: 24,
  },
  purchaseText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: 12,
    lineHeight: fontSizes.sm * 1.5,
  },
  purchaseButton: {
    marginTop: 0,
    marginBottom: 0,
  },
});
