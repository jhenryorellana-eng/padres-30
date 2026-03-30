// Linked child information
export interface LinkedChild {
  id: string;
  name: string;
  code: string; // E-XXXXXXXX del hijo
}

// User types for parents
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  avatarUrl?: string;
  code: string; // P-XXXXXXXX
  familyId: string;
  role: 'parent';
  linkedChildren: LinkedChild[]; // Hijos vinculados
  createdAt: string;
}

// Auth types
export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginWithCodeRequest {
  email: string;
  password: string;
  code: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

// Notification types
export interface Notification {
  id: string;
  type: 'achievement' | 'course' | 'message' | 'system' | 'miniapp';
  title: string;
  message: string;
  miniAppId?: string;
  readAt?: string;
  createdAt: string;
  data?: Record<string, unknown>;
}

// Mini App types
export interface MiniAppGradient {
  from: string;
  to: string;
}

export interface MiniApp {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  gradient: MiniAppGradient;
  url: string;
  enabled: boolean;
}

export interface MiniAppCode {
  code: string;
  expiresIn: number;
}

// App order types
export interface AppOrder {
  appId: string;
  position: number;
}

// User app preferences (for Supabase sync)
export interface UserAppPreferences {
  id: string;
  profileId: string;
  appOrder: string[];
  updatedAt: string;
}

// App stats for modal display (from Supabase)
export interface AppStats {
  totalRatings: number;
  averageRating: number;
  totalComments: number;
}

// App rating (user's own rating)
export interface AppRating {
  id: string;
  miniAppId: string;
  profileId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

// App review with user info
export interface AppReview {
  id: string;
  miniAppId: string;
  rating: number;
  comment: string | null;
  createdAt: string;
  userName: string;
}

// Basic user (pre-purchase, no family yet)
export interface BasicUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

// Registration data for mobile sign-up
export interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  whatsappNumber?: string;
  country?: string;
  city?: string;
}

// Info returned after IAP purchase is processed
export interface PostPurchaseInfo {
  familyId: string | null;
  pending?: boolean;
  parentCode: string | null;
  childCodes: string[];
  membership: {
    status: string;
    billingCycle: string;
    currentPeriodEnd: string;
    purchasePlatform: string;
    plan: {
      maxChildren: number;
    };
  } | null;
}

// Navigation types
export type RootStackParamList = {
  '(tabs)': undefined;
  login: undefined;
  onboarding: undefined;
  'miniapp/[id]': { id: string };
  'perfil/informacion': undefined;
  'perfil/hijos': undefined;
  'perfil/membresia': undefined;
};

// API Response types
export interface ApiResponse<T> {
  data: T;
  error?: string;
  errorCode?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// WebView Bridge types
export interface WebViewMessage {
  type: 'NOTIFICATION' | 'LOGOUT' | 'NAVIGATE' | 'CLOSE';
  payload?: Record<string, unknown>;
}
