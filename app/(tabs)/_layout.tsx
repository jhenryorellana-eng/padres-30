import React, { useEffect } from 'react';
import { Tabs, useRouter } from 'expo-router';
import { useAuthStore } from '@/stores/authStore';
import { useNotificationsStore } from '@/stores/notificationsStore';
import { TabBar } from '@/components/navigation/TabBar';

export default function TabLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadStoredAuth } = useAuthStore();
  const { unreadCount } = useNotificationsStore();

  // Load stored auth on mount
  useEffect(() => {
    loadStoredAuth();
  }, [loadStoredAuth]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return null; // Show splash screen while loading
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => (
        <TabBar
          state={props.state}
          navigation={props.navigation}
          unreadCount={unreadCount}
        />
      )}
    >
      <Tabs.Screen name="index" />
      <Tabs.Screen name="novedades" />
      <Tabs.Screen name="cuenta" />
    </Tabs>
  );
}
