import React, { useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { Card } from '@/components/ui';
import { useNotifications } from '@/hooks/useNotifications';
import colors from '@/constants/colors';
import { fontFamilies, fontSizes } from '@/constants/typography';
import { formatRelativeTime } from '@/utils/formatters';
import type { Notification } from '@/types';

const NOTIFICATION_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  achievement: 'emoji-events',
  course: 'school',
  message: 'message',
  system: 'info',
  miniapp: 'apps',
};

export default function NovedadesScreen() {
  const insets = useSafeAreaInsets();
  const {
    notifications,
    groupedNotifications,
    isLoading,
    unreadCount,
    loadNotifications,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleNotificationPress = useCallback(
    (notification: Notification) => {
      if (!notification.readAt) {
        markAsRead(notification.id);
      }
    },
    [markAsRead]
  );

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

  const renderSectionHeader = useCallback(
    (date: string) => (
      <Text style={styles.sectionHeader}>{date}</Text>
    ),
    []
  );

  const renderEmpty = useCallback(
    () => (
      <View style={styles.emptyContainer}>
        <MaterialIcons
          name="notifications-off"
          size={64}
          color={colors.textSecondary}
        />
        <Text style={styles.emptyTitle}>Sin novedades</Text>
        <Text style={styles.emptyText}>
          Aqui apareceran tus notificaciones
        </Text>
      </View>
    ),
    []
  );

  // Flatten grouped notifications for FlatList
  const flattenedData = Object.entries(groupedNotifications).flatMap(
    ([date, items]) => [
      { type: 'header' as const, date },
      ...items.map((item) => ({ type: 'item' as const, item })),
    ]
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
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

      <FlatList
        data={flattenedData}
        keyExtractor={(item, index) =>
          item.type === 'header' ? `header-${item.date}` : `item-${item.item.id}`
        }
        renderItem={({ item }) =>
          item.type === 'header'
            ? renderSectionHeader(item.date)
            : renderNotification({ item: item.item })
        }
        contentContainerStyle={styles.listContent}
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
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 200,
  },
  sectionHeader: {
    fontFamily: fontFamilies.semiBold,
    fontSize: fontSizes.sm,
    color: colors.textSecondary,
    marginTop: 16,
    marginBottom: 8,
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
