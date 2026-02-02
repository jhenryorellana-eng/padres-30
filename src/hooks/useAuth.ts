import { useCallback } from 'react';
import { useAuthStore } from '@/stores/authStore';
import { loginWithCode, logoutSession, getErrorMessage } from '@/services/authService';
import type { LoginWithCodeRequest } from '@/types';

export function useAuth() {
  const {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout: storeLogout,
  } = useAuthStore();

  // Note: loadStoredAuth is called once in _layout.tsx, no need to call it here

  const signIn = useCallback(
    async (credentials: LoginWithCodeRequest) => {
      const result = await loginWithCode(credentials);

      if (result.success) {
        await login(
          result.data.user,
          result.data.accessToken,
          result.data.refreshToken
        );
        return { success: true as const };
      }

      return {
        success: false as const,
        error: getErrorMessage(result.error.code),
      };
    },
    [login]
  );

  const signOut = useCallback(async () => {
    try {
      // Call API to invalidate session
      await logoutSession();
    } catch (error) {
      console.error('Error during logout:', error);
    } finally {
      // Always clear local state
      await storeLogout();
    }
  }, [storeLogout]);

  return {
    user,
    isAuthenticated,
    isLoading,
    signIn,
    signOut,
  };
}

export default useAuth;
