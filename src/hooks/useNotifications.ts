import { useCallback, useEffect } from 'react';
import { useNotificationsStore } from '@/stores/notificationsStore';
import {
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  requestNotificationPermissions,
  addNotificationReceivedListener,
} from '@/services/notificationService';
import { groupByDate } from '@/utils/formatters';

export function useNotifications() {
  const {
    notifications,
    isLoading,
    error,
    unreadCount,
    setNotifications,
    addNotification,
    markAsRead,
    markAllAsRead: storeMarkAllAsRead,
    setLoading,
    setError,
  } = useNotificationsStore();

  // Request permissions and setup listeners
  useEffect(() => {
    requestNotificationPermissions();

    const subscription = addNotificationReceivedListener((notification) => {
      const { title, body, data } = notification.request.content;
      addNotification({
        id: Date.now().toString(),
        type: (data?.type as 'achievement' | 'course' | 'message' | 'system' | 'miniapp') || 'system',
        title: title || '',
        message: body || '',
        miniAppId: data?.miniAppId as string | undefined,
        createdAt: new Date().toISOString(),
        data: data as Record<string, unknown> | undefined,
      });
    });

    return () => {
      subscription.remove();
    };
  }, [addNotification]);

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await fetchNotifications();
      setNotifications(data);
    } catch (err) {
      setError('Error al cargar notificaciones');
    } finally {
      setLoading(false);
    }
  }, [setNotifications, setLoading, setError]);

  const handleMarkAsRead = useCallback(
    async (id: string) => {
      const success = await markNotificationAsRead(id);
      if (success) {
        markAsRead(id);
      }
    },
    [markAsRead]
  );

  const handleMarkAllAsRead = useCallback(async () => {
    const success = await markAllNotificationsAsRead();
    if (success) {
      storeMarkAllAsRead();
    }
  }, [storeMarkAllAsRead]);

  // Group notifications by date
  const groupedNotifications = groupByDate(notifications);

  return {
    notifications,
    groupedNotifications,
    isLoading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead: handleMarkAsRead,
    markAllAsRead: handleMarkAllAsRead,
  };
}

export default useNotifications;
