import { api } from './api';
import type { AuthResponse, LoginWithCodeRequest, User } from '@/types';

const AUTH_ENDPOINTS = {
  parentLogin: '/api/auth/parent-login',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
};

export interface LoginError {
  code: string;
  message: string;
}

// Error codes
export const AUTH_ERRORS = {
  INVALID_CREDENTIALS: 'AUTH_001',
  INVALID_CODE: 'CODE_001',
  CODE_NOT_FOUND: 'CODE_002',
  CODE_WRONG_TYPE: 'CODE_003',
  CODE_REVOKED: 'CODE_004',
  USER_CODE_MISMATCH: 'CODE_005',
  MEMBERSHIP_EXPIRED: 'MEM_001',
  MEMBERSHIP_INACTIVE: 'MEM_002',
  NETWORK_ERROR: 'NETWORK_001',
};

// Error messages in Spanish
export const AUTH_ERROR_MESSAGES: Record<string, string> = {
  [AUTH_ERRORS.INVALID_CREDENTIALS]: 'Email o contraseña incorrectos',
  [AUTH_ERRORS.INVALID_CODE]: 'Formato de código inválido',
  [AUTH_ERRORS.CODE_NOT_FOUND]: 'Código no encontrado',
  [AUTH_ERRORS.CODE_WRONG_TYPE]: 'Este código no es de padre',
  [AUTH_ERRORS.CODE_REVOKED]: 'Este código ha sido revocado',
  [AUTH_ERRORS.USER_CODE_MISMATCH]: 'Este código no te pertenece',
  [AUTH_ERRORS.MEMBERSHIP_EXPIRED]: 'La membresia familiar ha expirado',
  [AUTH_ERRORS.MEMBERSHIP_INACTIVE]: 'La membresia familiar no esta activa',
  [AUTH_ERRORS.NETWORK_ERROR]: 'Error de conexion. Verifica tu internet',
};

export const getErrorMessage = (code: string): string => {
  return AUTH_ERROR_MESSAGES[code] || 'Ha ocurrido un error inesperado';
};

/**
 * Login with triple verification: email + password + parent code
 * The backend will:
 * 1. Authenticate email/password with Supabase Auth
 * 2. Validate the parent code (P-XXXXXXXX format)
 * 3. Verify the code belongs to the authenticated user
 * 4. Verify active family membership
 */
export async function loginWithCode(
  credentials: LoginWithCodeRequest
): Promise<{ success: true; data: AuthResponse } | { success: false; error: LoginError }> {
  try {
    const response = await api.post<AuthResponse>(
      AUTH_ENDPOINTS.parentLogin,
      credentials,
      { requiresAuth: false }
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: AUTH_ERRORS.INVALID_CREDENTIALS,
          message: response.error,
        },
      };
    }

    return { success: true, data: response.data };
  } catch (error) {
    return {
      success: false,
      error: {
        code: AUTH_ERRORS.NETWORK_ERROR,
        message: getErrorMessage(AUTH_ERRORS.NETWORK_ERROR),
      },
    };
  }
}

/**
 * Get current user information
 */
export async function getCurrentUser(): Promise<User | null> {
  const response = await api.get<{ user: User }>(AUTH_ENDPOINTS.me);
  return response.data?.user || null;
}

/**
 * Logout from the current session
 */
export async function logoutSession(): Promise<void> {
  await api.post(AUTH_ENDPOINTS.logout);
}

export default {
  loginWithCode,
  getCurrentUser,
  logoutSession,
  getErrorMessage,
  AUTH_ERRORS,
};
