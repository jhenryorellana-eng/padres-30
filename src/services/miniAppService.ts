import { useAuthStore } from '@/stores/authStore';
import type { MiniAppCode } from '@/types';

// Hub Central handles mini-app authentication
const HUB_CENTRAL_URL = process.env.EXPO_PUBLIC_HUB_CENTRAL_URL || 'https://app.starbizacademy.com';

/**
 * Generate a temporary code for mini-app authentication
 * The code expires in 60 seconds
 */
export async function generateMiniAppCode(
  miniAppId: string,
  childId?: string
): Promise<MiniAppCode | null> {
  try {
    const accessToken = useAuthStore.getState().accessToken;
    if (!accessToken) {
      console.error('No access token available');
      return null;
    }

    const response = await fetch(`${HUB_CENTRAL_URL}/api/auth/mini-app-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        mini_app_id: miniAppId,
        child_id: childId,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      console.error('Error generating mini-app code:', error);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error generating mini-app code:', error);
    return null;
  }
}

/**
 * Build the authentication URL for a mini-app
 * @param miniAppUrl Base URL of the mini-app
 * @param code Temporary authentication code
 */
export function buildMiniAppAuthUrl(miniAppUrl: string, code: string): string {
  const url = new URL('/auth/callback', miniAppUrl);
  url.searchParams.append('code', code);
  return url.toString();
}

/**
 * Handle messages from mini-app WebView
 */
export interface MiniAppMessage {
  type: 'NOTIFICATION' | 'LOGOUT' | 'NAVIGATE' | 'CLOSE' | 'REFRESH' | 'BRIDGE_READY';
  payload?: Record<string, unknown>;
}

export function parseMiniAppMessage(data: string): MiniAppMessage | null {
  try {
    return JSON.parse(data) as MiniAppMessage;
  } catch {
    console.error('Invalid mini-app message:', data);
    return null;
  }
}

/**
 * Build JavaScript to inject into mini-app WebView
 * This enables communication from React Native to the PWA
 */
export function buildInjectedJavaScript(): string {
  return `
    (function() {
      // Store original postMessage
      const originalPostMessage = window.postMessage;

      // Function to receive messages from React Native
      window.receiveFromApp = function(data) {
        window.dispatchEvent(new CustomEvent('appMessage', { detail: data }));
      };

      // Notify that bridge is ready
      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'BRIDGE_READY' }));
      }

      true; // Required for iOS
    })();
  `;
}

export default {
  generateMiniAppCode,
  buildMiniAppAuthUrl,
  parseMiniAppMessage,
  buildInjectedJavaScript,
};
