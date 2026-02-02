import { useCallback, useRef } from 'react';
import { WebView } from 'react-native-webview';
import {
  parseMiniAppMessage,
  buildInjectedJavaScript,
  type MiniAppMessage,
} from '@/services/miniAppService';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { useAuthStore } from '@/stores/authStore';
import { scheduleLocalNotification } from '@/services/notificationService';

// Mini app display names for push notifications
const MINI_APP_NAMES: Record<string, string> = {
  'stareduca_senior': 'StarEduca Senior',
  'starvoices': 'StarVoices',
  'child_dashboard': 'Dashboard Hijos',
};

interface UseMiniAppBridgeOptions {
  onClose?: () => void;
  onNavigate?: (path: string) => void;
}

export function useMiniAppBridge(options: UseMiniAppBridgeOptions = {}) {
  const webViewRef = useRef<WebView>(null);
  const { addNotification } = useNotificationsStore();
  const { logout } = useAuthStore();

  const handleMessage = useCallback(
    (event: { nativeEvent: { data: string } }) => {
      const message = parseMiniAppMessage(event.nativeEvent.data);
      if (!message) return;

      switch (message.type) {
        case 'NOTIFICATION':
          if (message.payload) {
            const miniAppId = message.payload.miniAppId as string | undefined;
            const title = (message.payload.title as string) || 'Notificación';
            const body = (message.payload.message as string) || '';

            // Add to notifications store
            addNotification({
              id: Date.now().toString(),
              type: 'miniapp',
              title,
              message: body,
              miniAppId,
              createdAt: new Date().toISOString(),
              data: message.payload,
            });

            // Show push notification with mini app name
            const appName = miniAppId ? MINI_APP_NAMES[miniAppId] : null;
            const pushTitle = appName ? `${appName}: ${title}` : title;

            scheduleLocalNotification(pushTitle, body, {
              miniAppId,
              ...message.payload,
            });
          }
          break;

        case 'LOGOUT':
          logout();
          options.onClose?.();
          break;

        case 'NAVIGATE':
          if (message.payload?.path) {
            options.onNavigate?.(message.payload.path as string);
          }
          break;

        case 'CLOSE':
          options.onClose?.();
          break;

        case 'REFRESH':
          webViewRef.current?.reload();
          break;

        case 'BRIDGE_READY':
          // Bridge is ready, no action needed
          break;

        default:
          console.log('Unknown message type:', message.type);
      }
    },
    [addNotification, logout, options]
  );

  const sendToWebView = useCallback((message: MiniAppMessage) => {
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        window.receiveFromApp(${JSON.stringify(message)});
        true;
      `);
    }
  }, []);

  const reload = useCallback(() => {
    webViewRef.current?.reload();
  }, []);

  const goBack = useCallback(() => {
    webViewRef.current?.goBack();
  }, []);

  return {
    webViewRef,
    handleMessage,
    sendToWebView,
    reload,
    goBack,
    injectedJavaScript: buildInjectedJavaScript(),
  };
}

export default useMiniAppBridge;
