import { api } from './api';
import type {
  AuthResponse,
  LoginWithCodeRequest,
  RegisterData,
  BasicUser,
  PostPurchaseInfo,
  User,
} from '@/types';

const AUTH_ENDPOINTS = {
  parentLogin: '/api/auth/parent-login',
  parentLoginNoCode: '/api/auth/parent-login-no-code',
  mobileRegister: '/api/auth/mobile-register',
  postPurchaseInfo: '/api/auth/post-purchase-info',
  refresh: '/api/auth/refresh',
  logout: '/api/auth/logout',
  me: '/api/auth/me',
  deleteAccount: '/api/auth/delete-account',
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
  NEEDS_PURCHASE: 'MEM_003',
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
): Promise<
  | { success: true; data: AuthResponse }
  | { success: false; error: LoginError; partialAuth?: { accessToken: string; refreshToken: string; user: BasicUser } }
> {
  try {
    const response = await api.post<AuthResponse & { partialAuth?: { accessToken: string; refreshToken: string; user: BasicUser } }>(
      AUTH_ENDPOINTS.parentLogin,
      credentials,
      { requiresAuth: false }
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: response.errorCode || AUTH_ERRORS.INVALID_CREDENTIALS,
          message: response.error,
        },
        partialAuth: response.data?.partialAuth,
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

/**
 * Register a new parent account from the mobile app.
 * Returns tokens for immediate authentication.
 */
export async function registerMobile(
  data: RegisterData
): Promise<{ success: true; data: { accessToken: string; refreshToken: string; user: BasicUser } } | { success: false; error: LoginError }> {
  try {
    const response = await api.post<{ accessToken: string; refreshToken: string; user: BasicUser }>(
      AUTH_ENDPOINTS.mobileRegister,
      data,
      { requiresAuth: false }
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: response.errorCode || 'REGISTER_001',
          message: response.error,
        },
      };
    }

    return { success: true, data: response.data };
  } catch {
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
 * Login without a family code. Used after IAP purchase
 * when the user already has a membership but doesn't have their code handy.
 */
export async function loginWithoutCode(
  credentials: { email: string; password: string }
): Promise<{ success: true; data: AuthResponse } | { success: false; error: LoginError; needsPurchase?: boolean }> {
  try {
    const response = await api.post<AuthResponse & { needsPurchase?: boolean }>(
      AUTH_ENDPOINTS.parentLoginNoCode,
      credentials,
      { requiresAuth: false }
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: response.errorCode || AUTH_ERRORS.INVALID_CREDENTIALS,
          message: response.error,
        },
        needsPurchase: response.data?.needsPurchase,
      };
    }

    return { success: true, data: response.data };
  } catch {
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
 * Get family info after IAP purchase (codes, membership status).
 * The app polls this after purchase until familyId is returned.
 */
export async function getPostPurchaseInfo(): Promise<PostPurchaseInfo | null> {
  try {
    const response = await api.get<PostPurchaseInfo>(AUTH_ENDPOINTS.postPurchaseInfo);
    return response.data || null;
  } catch {
    return null;
  }
}

/**
 * Delete the current user's account permanently.
 * Required by Apple Guideline 5.1.1(v).
 */
export async function deleteAccount(): Promise<
  | { success: true }
  | { success: false; error: LoginError; platform?: string }
> {
  try {
    const response = await api.delete<{ success: boolean; error?: string; platform?: string }>(
      AUTH_ENDPOINTS.deleteAccount
    );

    if (response.error) {
      return {
        success: false,
        error: {
          code: response.errorCode || 'DELETE_001',
          message: response.error,
        },
        platform: response.data?.platform,
      };
    }

    return { success: true };
  } catch {
    return {
      success: false,
      error: {
        code: AUTH_ERRORS.NETWORK_ERROR,
        message: getErrorMessage(AUTH_ERRORS.NETWORK_ERROR),
      },
    };
  }
}

export default {
  loginWithCode,
  loginWithoutCode,
  registerMobile,
  getPostPurchaseInfo,
  getCurrentUser,
  logoutSession,
  deleteAccount,
  getErrorMessage,
  AUTH_ERRORS,
};
