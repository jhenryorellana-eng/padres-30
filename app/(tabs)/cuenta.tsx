import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { calculateAge, getInitials } from '@/utils/formatters';
import { useResponsive } from '@/hooks/useResponsive';
import colors from '@/constants/colors';
import { fontFamilies } from '@/constants/typography';
import Constants from 'expo-constants';

interface MenuItemProps {
  label: string;
  onPress: () => void;
  destructive?: boolean;
}

function MenuItem({ label, onPress, destructive }: MenuItemProps) {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
      <Text style={[styles.menuLabel, destructive && styles.menuLabelDestructive]}>{label}</Text>
      <MaterialIcons name="chevron-right" size={24} color={destructive ? colors.error : colors.primary} />
    </TouchableOpacity>
  );
}

export default function CuentaScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { user, logout } = useAuthStore();
  const { spacing, fontScale, isTablet } = useResponsive();

  const fullName = user?.fullName || 'Usuario';
  const age = user?.dateOfBirth ? calculateAge(user.dateOfBirth) : null;
  const initials = getInitials(fullName);
  const appVersion = Constants.expoConfig?.version || '1.0.0';

  const handleLogout = () => {
    Alert.alert(
      'Cerrar sesión',
      '¿Estás seguro de que quieres cerrar sesión?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Cerrar sesión',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top }]}
      contentContainerStyle={[styles.content, { paddingHorizontal: spacing.hpLg }]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <Text style={[styles.title, { fontSize: 32 * fontScale }]}>Cuenta</Text>

      {/* Avatar con gradiente */}
      <View style={styles.avatarSection}>
        <LinearGradient
          colors={[colors.primary, '#a855f7']}
          style={[styles.avatarGradient, isTablet && { width: 160, height: 160, borderRadius: 80 }]}
        >
          <Text style={[styles.avatarInitials, isTablet && { fontSize: 54 }]}>{initials}</Text>
        </LinearGradient>

        <Text style={styles.userName}>{fullName}</Text>
        {age !== null && <Text style={styles.userAge}>{age} años</Text>}
      </View>

      {/* Menu Items */}
      <View style={styles.menuContainer}>
        <MenuItem
          label="Mi información"
          onPress={() => router.push('/perfil/informacion')}
        />
        <MenuItem
          label="Mis Hijos"
          onPress={() => router.push('/perfil/hijos')}
        />
        <MenuItem
          label="Mi Membresia"
          onPress={() => router.push('/perfil/membresia')}
        />
        <MenuItem
          label="Eliminar mi cuenta"
          onPress={() => router.push('/perfil/eliminar-cuenta')}
          destructive
        />
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
        <Text style={styles.versionText}>Versión {appVersion}</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 180,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: 32,
    color: colors.text,
    marginTop: 48,
    marginBottom: 8,
  },
  avatarSection: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  avatarGradient: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  avatarInitials: {
    fontFamily: fontFamilies.bold,
    fontSize: 44,
    color: '#FFFFFF',
  },
  userName: {
    fontFamily: fontFamilies.bold,
    fontSize: 24,
    color: colors.text,
    marginTop: 20,
    textAlign: 'center',
  },
  userAge: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    color: colors.textSecondary,
    marginTop: 4,
  },
  menuContainer: {
    gap: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.card,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 12,
  },
  menuLabel: {
    fontFamily: fontFamilies.medium,
    fontSize: 16,
    color: colors.text,
  },
  menuLabelDestructive: {
    color: colors.error,
  },
  footer: {
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: 64,
    gap: 12,
  },
  logoutText: {
    fontFamily: fontFamilies.bold,
    fontSize: 16,
    color: colors.primary,
  },
  versionText: {
    fontFamily: fontFamilies.medium,
    fontSize: 12,
    color: colors.textMuted,
  },
});
