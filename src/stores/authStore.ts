import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User, BasicUser, AuthState } from '@/types';
import { setSupabaseSession, clearSupabaseSession } from '@/lib/supabase';
import { registerPushToken, unregisterPushToken } from '@/services/pushTokenService';
import { loginRevenueCat, logoutRevenueCat } from '@/lib/revenuecat';
import { deleteAccount as deleteAccountApi } from '@/services/authService';

const ACCESS_TOKEN_KEY = 'padres_3_0_access_token';
const REFRESH_TOKEN_KEY = 'padres_3_0_refresh_token';
const USER_KEY = 'padres_3_0_user';

interface AuthStore extends AuthState {
  // Partial auth state (for onboarding flow before purchase)
  basicUser: BasicUser | null;
  isPartialAuth: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setLoading: (isLoading: boolean) => void;
  login: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  loginPartial: (basicUser: BasicUser, accessToken: string, refreshToken: string) => Promise<void>;
  upgradeToFullAuth: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<{ success: boolean; error?: string; platform?: string }>;
  loadStoredAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  basicUser: null,
  isPartialAuth: false,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
  isLoading: true,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken }),

  setLoading: (isLoading) => set({ isLoading }),

  login: async (user, accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      await setSupabaseSession(accessToken, refreshToken);

      set({
        user,
        basicUser: null,
        isPartialAuth: false,
        accessToken,
        refreshToken,
        isAuthenticated: true,
        isLoading: false,
      });

      // Identify user in RevenueCat for cross-platform sync
      loginRevenueCat(user.id).catch(console.error);
      registerPushToken(accessToken).catch(console.error);
    } catch (error) {
      console.error('Error storing auth data:', error);
      throw error;
    }
  },

  // Partial login: user registered but no family/membership yet (onboarding flow)
  loginPartial: async (basicUser, accessToken, refreshToken) => {
    try {
      await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
      await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);

      await setSupabaseSession(accessToken, refreshToken);

      set({
        basicUser,
        isPartialAuth: true,
        accessToken,
        refreshToken,
        isAuthenticated: false,
        isLoading: false,
      });

      loginRevenueCat(basicUser.id).catch(console.error);
    } catch (error) {
      console.error('Error storing partial auth data:', error);
      throw error;
    }
  },

  // Upgrade from partial to full auth after purchase completes
  upgradeToFullAuth: async (user) => {
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));

      const accessToken = get().accessToken;
      if (accessToken) {
        registerPushToken(accessToken).catch(() => {
          // Push token registration may fail in dev builds without Firebase
        });
      }

      set({
        user,
        basicUser: null,
        isPartialAuth: false,
        isAuthenticated: true,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error upgrading auth:', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      const currentToken = get().accessToken;
      if (currentToken) {
        await unregisterPushToken(currentToken).catch(console.error);
      }

      await clearSupabaseSession();
      logoutRevenueCat().catch(console.error);

      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);

      await AsyncStorage.multiRemove([
        'padres_3_0_apps_order',
        'padres_3_0_apps_order_timestamp',
      ]);

      set({
        user: null,
        basicUser: null,
        isPartialAuth: false,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error clearing auth data:', error);
      set({
        user: null,
        basicUser: null,
        isPartialAuth: false,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
        isLoading: false,
      });
    }
  },

  deleteAccount: async () => {
    const result = await deleteAccountApi();

    if (!result.success) {
      return {
        success: false,
        error: result.error.message,
        platform: result.platform,
      };
    }

    // Clean up local state (same as logout)
    try {
      await clearSupabaseSession();
      logoutRevenueCat().catch(console.error);
      await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
      await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
      await AsyncStorage.multiRemove([
        'padres_3_0_apps_order',
        'padres_3_0_apps_order_timestamp',
      ]);
    } catch {
      // Continue even if cleanup fails
    }

    set({
      user: null,
      basicUser: null,
      isPartialAuth: false,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,
    });

    return { success: true };
  },

  loadStoredAuth: async () => {
    try {
      set({ isLoading: true });

      const [accessToken, refreshToken, userJson] = await Promise.all([
        SecureStore.getItemAsync(ACCESS_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
        SecureStore.getItemAsync(USER_KEY),
      ]);

      if (accessToken && refreshToken && userJson) {
        const user = JSON.parse(userJson) as User;

        // Sync session with Supabase so RLS policies work on app restart
        await setSupabaseSession(accessToken, refreshToken);

        set({
          user,
          accessToken,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });

        // Re-register push token on app restart (token may have changed)
        registerPushToken(accessToken).catch(console.error);
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Error loading stored auth:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      set({ user: updatedUser });
      // Persist the update
      SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser)).catch(
        console.error
      );
    }
  },
}));

export default useAuthStore;
