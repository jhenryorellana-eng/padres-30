import { useCallback, useEffect } from 'react';
import { useAppsStore } from '@/stores/appsStore';
import { useAuthStore } from '@/stores/authStore';
import type { MiniApp } from '@/constants/miniApps';

export function useApps() {
  const {
    isLoading,
    selectedApp,
    loadAppsOrder,
    setSelectedApp,
    getOrderedApps,
    setProfileId,
    syncWithSupabase,
  } = useAppsStore();

  const { user } = useAuthStore();

  // Set profile ID when user changes
  useEffect(() => {
    setProfileId(user?.id || null);
  }, [user?.id, setProfileId]);

  // Load stored order and sync on mount
  useEffect(() => {
    loadAppsOrder();
  }, [loadAppsOrder]);

  const orderedApps = getOrderedApps();

  const selectApp = useCallback(
    (app: MiniApp | null) => {
      setSelectedApp(app);
    },
    [setSelectedApp]
  );

  return {
    apps: orderedApps,
    isLoading,
    selectedApp,
    selectApp,
    syncWithSupabase,
  };
}

export default useApps;
