import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@/components/ui';
import { isValidEmail } from '@/utils/validators';
import { registerMobile } from '@/services/authService';
import { useAuthStore } from '@/stores/authStore';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

export default function RegisterScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { loginPartial } = useAuthStore();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [country, setCountry] = useState('');
  const [city, setCity] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Field errors
  const [firstNameError, setFirstNameError] = useState<string | null>(null);
  const [lastNameError, setLastNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);

  const validate = useCallback(() => {
    let valid = true;
    setFirstNameError(null);
    setLastNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmError(null);

    if (!firstName.trim() || firstName.trim().length < 2) {
      setFirstNameError('Minimo 2 caracteres');
      valid = false;
    }
    if (!lastName.trim() || lastName.trim().length < 2) {
      setLastNameError('Minimo 2 caracteres');
      valid = false;
    }
    if (!email.trim() || !isValidEmail(email)) {
      setEmailError('Email invalido');
      valid = false;
    }
    if (!password || password.length < 8) {
      setPasswordError('Minimo 8 caracteres');
      valid = false;
    }
    if (password !== confirmPassword) {
      setConfirmError('Las contrasenas no coinciden');
      valid = false;
    }

    return valid;
  }, [firstName, lastName, email, password, confirmPassword]);

  const handleRegister = useCallback(async () => {
    setError(null);
    if (!validate()) return;

    setIsLoading(true);
    try {
      const result = await registerMobile({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        email: email.trim().toLowerCase(),
        password,
        whatsappNumber: whatsapp.trim() || undefined,
        country: country.trim() || undefined,
        city: city.trim() || undefined,
      });

      if (result.success) {
        await loginPartial(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
        router.push('/onboarding/select-plan');
      } else {
        setError(result.error.message);
      }
    } catch {
      setError('Error al registrarse. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [firstName, lastName, email, password, validate, loginPartial, router]);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.step}>Paso 1 de 4</Text>
        <Text style={styles.title}>Crear cuenta</Text>
        <Text style={styles.subtitle}>
          Registrate para comenzar tu suscripcion familiar
        </Text>

        {error && (
          <Card style={styles.errorCard} padding="md">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Input
          label="Nombre"
          value={firstName}
          onChangeText={(t) => { setFirstName(t); setFirstNameError(null); }}
          placeholder="Tu nombre"
          autoCapitalize="words"
          error={firstNameError || undefined}
          icon="person"
        />

        <Input
          label="Apellido"
          value={lastName}
          onChangeText={(t) => { setLastName(t); setLastNameError(null); }}
          placeholder="Tu apellido"
          autoCapitalize="words"
          error={lastNameError || undefined}
          icon="person"
        />

        <Input
          label="Email"
          value={email}
          onChangeText={(t) => { setEmail(t); setEmailError(null); }}
          placeholder="tu@email.com"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          error={emailError || undefined}
          icon="email"
        />

        <Input
          label="WhatsApp (opcional)"
          value={whatsapp}
          onChangeText={setWhatsapp}
          placeholder="+52 55 1234 5678"
          keyboardType="phone-pad"
          icon="phone"
        />

        <Input
          label="Pais"
          value={country}
          onChangeText={setCountry}
          placeholder="Selecciona tu pais"
          autoCapitalize="words"
          icon="public"
        />

        <Input
          label="Ciudad"
          value={city}
          onChangeText={setCity}
          placeholder="Tu ciudad"
          autoCapitalize="words"
          icon="location-city"
        />

        <Input
          label="Contrasena"
          value={password}
          onChangeText={(t) => { setPassword(t); setPasswordError(null); }}
          placeholder="Minimo 8 caracteres"
          secureTextEntry
          error={passwordError || undefined}
          icon="lock"
        />

        <Input
          label="Confirmar contrasena"
          value={confirmPassword}
          onChangeText={(t) => { setConfirmPassword(t); setConfirmError(null); }}
          placeholder="Repite tu contrasena"
          secureTextEntry
          error={confirmError || undefined}
          icon="lock"
        />

        <Button
          title="Continuar"
          onPress={handleRegister}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.button}
        />

        <Button
          title="Ya tengo cuenta"
          onPress={() => router.back()}
          variant="ghost"
          fullWidth
        />
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
  step: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: 8,
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
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
