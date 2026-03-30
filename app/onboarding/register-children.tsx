import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Button, Input, Card } from '@/components/ui';
import { api } from '@/services/api';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';

interface ChildForm {
  firstName: string;
  lastName: string;
  birthDate: string;
  city: string;
  country: string;
}

const EMPTY_CHILD: ChildForm = {
  firstName: '',
  lastName: '',
  birthDate: '',
  city: '',
  country: '',
};

export default function RegisterChildrenScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ childrenCount: string }>();
  const childrenCount = parseInt(params.childrenCount || '1');

  const [children, setChildren] = useState<ChildForm[]>(
    Array.from({ length: childrenCount }, () => ({ ...EMPTY_CHILD }))
  );
  const [currentChild, setCurrentChild] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const child = children[currentChild];

  const updateChild = useCallback((field: keyof ChildForm, value: string) => {
    setChildren(prev => {
      const updated = [...prev];
      updated[currentChild] = { ...updated[currentChild], [field]: value };
      return updated;
    });
  }, [currentChild]);

  const validateCurrentChild = useCallback(() => {
    if (!child.firstName.trim()) return 'El nombre es requerido';
    if (!child.lastName.trim()) return 'El apellido es requerido';
    if (!child.birthDate.trim()) return 'La fecha de nacimiento es requerida';

    // Validate age (13-17)
    const birth = new Date(child.birthDate);
    if (isNaN(birth.getTime())) return 'Fecha de nacimiento invalida (formato: YYYY-MM-DD)';

    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    if (age < 13 || age > 17) return 'La edad debe ser entre 13 y 17 anos';

    if (!child.city.trim()) return 'La ciudad es requerida';
    if (!child.country.trim()) return 'El pais es requerido';

    return null;
  }, [child]);

  const handleNext = useCallback(() => {
    const validationError = validateCurrentChild();
    if (validationError) {
      setError(validationError);
      return;
    }
    setError(null);

    if (currentChild < childrenCount - 1) {
      setCurrentChild(currentChild + 1);
    } else {
      handleSubmit();
    }
  }, [currentChild, childrenCount, validateCurrentChild]);

  const handleSubmit = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await api.post('/api/children', {
        children: children.map(c => ({
          firstName: c.firstName.trim(),
          lastName: c.lastName.trim(),
          birthDate: c.birthDate.trim(),
          city: c.city.trim(),
          country: c.country.trim(),
        })),
      });

      if (response.error) {
        setError(response.error);
        return;
      }

      // Pass child names to success screen
      const childNames = children.map(c => `${c.firstName.trim()} ${c.lastName.trim()}`);
      router.replace({
        pathname: '/onboarding/success',
        params: { childNames: JSON.stringify(childNames) },
      });
    } catch {
      setError('Error al registrar los hijos. Intenta de nuevo.');
    } finally {
      setIsLoading(false);
    }
  }, [children, router]);

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
        <Text style={styles.step}>Paso 4 de 4</Text>
        <Text style={styles.title}>Registrar hijos</Text>
        <Text style={styles.subtitle}>
          {childrenCount > 1
            ? `Hijo ${currentChild + 1} de ${childrenCount}`
            : 'Datos de tu hijo'}
        </Text>

        {error && (
          <Card style={styles.errorCard} padding="md">
            <Text style={styles.errorText}>{error}</Text>
          </Card>
        )}

        <Input
          label="Nombre"
          value={child.firstName}
          onChangeText={(t) => updateChild('firstName', t)}
          placeholder="Nombre del hijo"
          autoCapitalize="words"
          icon="person"
        />

        <Input
          label="Apellido"
          value={child.lastName}
          onChangeText={(t) => updateChild('lastName', t)}
          placeholder="Apellido del hijo"
          autoCapitalize="words"
          icon="person"
        />

        <Input
          label="Fecha de nacimiento"
          value={child.birthDate}
          onChangeText={(t) => updateChild('birthDate', t)}
          placeholder="YYYY-MM-DD (13-17 anos)"
          keyboardType="numbers-and-punctuation"
          icon="cake"
        />

        <Input
          label="Ciudad"
          value={child.city}
          onChangeText={(t) => updateChild('city', t)}
          placeholder="Ciudad de residencia"
          autoCapitalize="words"
          icon="location-on"
        />

        <Input
          label="Pais"
          value={child.country}
          onChangeText={(t) => updateChild('country', t)}
          placeholder="Pais de residencia"
          autoCapitalize="words"
          icon="public"
        />

        <Button
          title={
            currentChild < childrenCount - 1
              ? 'Siguiente hijo'
              : isLoading
                ? 'Registrando...'
                : 'Finalizar registro'
          }
          onPress={handleNext}
          loading={isLoading}
          disabled={isLoading}
          fullWidth
          style={styles.button}
        />

        {currentChild > 0 && (
          <Button
            title="Hijo anterior"
            onPress={() => { setCurrentChild(currentChild - 1); setError(null); }}
            variant="ghost"
            fullWidth
          />
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
