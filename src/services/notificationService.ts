import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { api } from './api';
import type { Notification } from '@/types';

// Detectar si estamos en Expo Go Android (donde push notifications no funcionan desde SDK 53)
const isExpoGoAndroid = Constants.appOwnership === 'expo' && Platform.OS === 'android';

// Importar expo-notifications solo si NO es Expo Go Android
// Esto evita el error de auto-registro del módulo
let Notifications: typeof import('expo-notifications') | null = null;

if (!isExpoGoAndroid) {
  Notifications = require('expo-notifications');
}

const NOTIFICATION_ENDPOINTS = {
  list: '/api/junior/notifications',
  markRead: (id: string) => `/api/junior/notifications/${id}/read`,
  markAllRead: '/api/junior/notifications/read-all',
};

// Configure notification behavior (solo si Notifications está disponible)
if (Notifications) {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

/**
 * Request notification permissions
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Notifications) {
    console.log('[Notifications] Push notifications no disponibles en Expo Go Android');
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    console.log('Notification permissions not granted');
    return false;
  }

  // Get push token for the device
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#dd78a4',
    });
  }

  return true;
}

/**
 * Get push token for push notifications
 */
export async function getPushToken(): Promise<string | null> {
  if (!Notifications) {
    console.log('[Notifications] Push token no disponible en Expo Go Android');
    return null;
  }

  try {
    const token = await Notifications.getExpoPushTokenAsync({
      projectId: process.env.EXPO_PUBLIC_PROJECT_ID,
    });
    return token.data;
  } catch (error) {
    console.error('Error getting push token:', error);
    return null;
  }
}

/**
 * Fetch notifications from API
 */
export async function fetchNotifications(): Promise<Notification[]> {
  const response = await api.get<{ notifications: Notification[] }>(
    NOTIFICATION_ENDPOINTS.list
  );

  if (response.error) {
    console.error('Error fetching notifications:', response.error);
    return [];
  }

  return response.data?.notifications || [];
}

/**
 * Mark a notification as read
 */
export async function markNotificationAsRead(id: string): Promise<boolean> {
  const response = await api.post(NOTIFICATION_ENDPOINTS.markRead(id));
  return !response.error;
}

/**
 * Mark all notifications as read
 */
export async function markAllNotificationsAsRead(): Promise<boolean> {
  const response = await api.post(NOTIFICATION_ENDPOINTS.markAllRead);
  return !response.error;
}

/**
 * Schedule a local notification
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: Record<string, unknown>
): Promise<string | null> {
  if (!Notifications) {
    console.log('[Notifications] Local notifications no disponibles en Expo Go Android');
    return null;
  }

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
    },
    trigger: null, // Immediate
  });

  return id;
}

// Tipo para subscription mock
type MockSubscription = { remove: () => void };

/**
 * Add notification received listener
 */
export function addNotificationReceivedListener(
  callback: (notification: any) => void
): MockSubscription {
  if (!Notifications) {
    console.log('[Notifications] Listeners no disponibles en Expo Go Android');
    return { remove: () => {} };
  }
  return Notifications.addNotificationReceivedListener(callback);
}

/**
 * Add notification response listener (when user taps notification)
 */
export function addNotificationResponseListener(
  callback: (response: any) => void
): MockSubscription {
  if (!Notifications) {
    console.log('[Notifications] Listeners no disponibles en Expo Go Android');
    return { remove: () => {} };
  }
  return Notifications.addNotificationResponseReceivedListener(callback);
}

export default {
  requestNotificationPermissions,
  getPushToken,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  scheduleLocalNotification,
  addNotificationReceivedListener,
  addNotificationResponseListener,
};
