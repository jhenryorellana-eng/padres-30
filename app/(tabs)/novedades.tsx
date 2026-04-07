import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import { useResponsive } from '@/hooks/useResponsive';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { formatRelativeTime } from '@/utils/formatters';
import type { Notification } from '@/types';

type FilterType = 'all' | 'unread' | 'read';

const NOTIFICATION_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  achievement: 'emoji-events',
  course: 'school',
  message: 'message',
  system: 'info',
  miniapp: 'apps',
  child_registered: 'child-care',
  subscription_created: 'card-membership',
  subscription_renewed: 'autorenew',
  subscription_canceled: 'cancel',
  enrollment_completed: 'check-circle',
};

export default function NovedadesScreen() {
  const insets = useSafeAreaInsets();
  const { spacing } = useResponsive();
  const {
    notifications,
    isLoading,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  const [filter, setFilter] = useState<FilterType>('all');

  useFocusEffect(
    useCallback(() => {
      loadNotifications();
    }, [loadNotifications])
  );

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.readAt) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

  // Filter notifications based on selected filter + exclude invalid entries
  const filteredNotifications = notifications.filter((n) => {
    // Skip notifications with missing data
    if (!n.title && !n.message) return false;

    if (filter === 'unread') return !n.readAt;
    if (filter === 'read') return !!n.readAt;
    return true;
  });

  const renderNotification = useCallback(
    ({ item }: { item: Notification }) => {
      const isUnread = !item.readAt;
      const icon = NOTIFICATION_ICONS[item.type] || 'notifications';

      return (
        <Card
          style={[styles.notificationCard, isUnread && styles.unreadCard]}
          onPress={() => handleNotificationPress(item)}
          padding="md"
        >
          <View style={styles.notificationContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isUnread ? colors.primary : colors.lavender },
              ]}
            >
              <MaterialIcons
                name={icon}
                size={20}
                color={isUnread ? colors.textLight : colors.secondary}
              />
            </View>
            <View style={styles.textContainer}>
              <Text
                style={[
                  styles.notificationTitle,
                  isUnread && styles.unreadText,
                ]}
              >
                {item.title}
              </Text>
              <Text style={styles.notificationMessage} numberOfLines={2}>
                {item.message}
              </Text>
              <Text style={styles.notificationTime}>
                {formatRelativeTime(item.createdAt)}
              </Text>
            </View>
            {isUnread && <View style={styles.unreadDot} />}
          </View>
        </Card>
      );
    },
    [handleNotificationPress]
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="notifications-off"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>
          {filter === 'unread' ? 'Sin notificaciones nuevas' :
           filter === 'read' ? 'Sin notificaciones leidas' :
           'Sin novedades'}
        </Text>
        <Text style={styles.emptyText}>
          {filter === 'unread' ? 'Estas al dia con tus notificaciones' :
           'Aqui apareceran tus notificaciones'}
        </Text>
      </View>
    ),
    [filter]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={[styles.header, { paddingHorizontal: spacing.hp }]}>
        <Text style={styles.title}>Novedades</Text>
        {unreadCount > 0 && (
          <TouchableOpacity
            style={styles.markAllButton}
            onPress={markAllAsRead}
          >
            <Text style={styles.markAllText}>Marcar todo como leido</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Filter tabs */}
      <View style={[styles.filterRow, { paddingHorizontal: spacing.hp }]}>
        {(['all', 'unread', 'read'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Todas' : f === 'unread' ? 'No leidas' : 'Leidas'}
            </Text>
            {f === 'unread' && unreadCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{unreadCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredNotifications}
        keyExtractor={(item) => item.id}
        renderItem={renderNotification}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: spacing.hp }]}
        refreshControl={
          <RefreshControl
            refreshing={isLoading}
            onRefresh={loadNotifications}
            tintColor={colors.primary}
          />
        }
        ListEmptyComponent={renderEmpty}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  title: {
    fontFamily: fontFamilies.bold,
    fontSize: fontSizes['2xl'],
    color: colors.text,
  },
  markAllButton: {
    padding: 8,
  },
  markAllText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.sm,
    color: colors.primary,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  filterTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: colors.surface,
    gap: 6,
  },
  filterTabActive: {
    backgroundColor: colors.primary + '20',
  },
  filterText: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  filterTextActive: {
    color: colors.primary,
  },
  filterBadge: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontFamily: fontFamilies.semiBold,
    fontSize: 10,
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  notificationCard: {
    marginBottom: 8,
  },
  unreadCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.primary,
  },
  notificationContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontFamily: fontFamilies.medium,
    fontSize: fontSizes.base,
    color: colors.text,
    marginBottom: 2,
  },
  unreadText: {
    fontFamily: fontFamilies.semiBold,
  },
  notificationMessage: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginBottom: 4,
  },
  notificationTime: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.xs,
    color: colors.textMuted,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.primary,
    marginLeft: 8,
    marginTop: 6,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
  },
  emptyTitle: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.lg,
    color: colors.text,
    marginTop: 16,
  },
  emptyText: {
    fontFamily: fontFamilies.regular,
    fontSize: fontSizes.base,
    color: colors.textSecondary,
    marginTop: 4,
  },
});
