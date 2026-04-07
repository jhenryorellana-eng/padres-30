import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button, Input, Card } from '@/components/ui';
import { api } from '@/services/api';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { MaterialIcons } from '@expo/vector-icons';

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
  const [showDatePicker, setShowDatePicker] = useState(false);

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

        <Text style={styles.inputLabel}>Fecha de nacimiento</Text>
        <TouchableOpacity
          style={styles.dateButton}
          onPress={() => setShowDatePicker(true)}
        >
          <MaterialIcons name="cake" size={20} color={colors.textSecondary} style={styles.dateIcon} />
          <Text style={[styles.dateText, !child.birthDate && styles.datePlaceholder]}>
            {child.birthDate
              ? new Date(child.birthDate + 'T12:00:00').toLocaleDateString('es', { year: 'numeric', month: 'long', day: 'numeric' })
              : 'Seleccionar fecha (13-17 anos)'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={child.birthDate ? new Date(child.birthDate + 'T12:00:00') : new Date(new Date().getFullYear() - 15, 0, 1)}
            mode="date"
            display={Platform.OS === 'ios' ? 'spinner' : 'default'}
            maximumDate={new Date(new Date().getFullYear() - 13, new Date().getMonth(), new Date().getDate())}
            minimumDate={new Date(new Date().getFullYear() - 17, new Date().getMonth(), new Date().getDate())}
            onChange={(_, selectedDate) => {
              setShowDatePicker(Platform.OS === 'ios');
              if (selectedDate) {
                const yyyy = selectedDate.getFullYear();
                const mm = String(selectedDate.getMonth() + 1).padStart(2, '0');
                const dd = String(selectedDate.getDate()).padStart(2, '0');
                updateChild('birthDate', `${yyyy}-${mm}-${dd}`);
              }
            }}
          />
        )}

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
  inputLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.text,
    marginBottom: 6,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginBottom: 16,
    backgroundColor: colors.surface,
  },
  dateIcon: {
    marginRight: 12,
  },
  dateText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.text,
    flex: 1,
  },
  datePlaceholder: {
    color: colors.textTertiary,
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
  },
});
