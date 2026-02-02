import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
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
      }
    } catch (err) {
      setError('Error al iniciar sesión. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [email, password, code, signIn, router, validateCode]);

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
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>Padres</Text>
            <Text style={styles.logoSubtext}>3.0</Text>
          </View>
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
  logoPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes.xl,
    color: colors.textLight,
  },
  logoSubtext: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.textLight,
    opacity: 0.9,
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
});
