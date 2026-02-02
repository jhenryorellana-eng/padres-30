import { create } from 'zustand';
import { MINI_APPS, type MiniApp } from '@/constants/miniApps';
import {
  syncAppPreferences,
  saveAppPreferences,
} from '@/services/appPreferencesService';

interface AppsStore {
  apps: MiniApp[];
  appOrder: string[];
  isLoading: boolean;
  selectedApp: MiniApp | null;
  profileId: string | null;

  // Actions
  loadAppsOrder: () => Promise<void>;
  setAppOrder: (order: string[]) => Promise<void>;
  setSelectedApp: (app: MiniApp | null) => void;
  getOrderedApps: () => MiniApp[];
  setProfileId: (profileId: string | null) => void;
  syncWithSupabase: () => Promise<void>;
}

const defaultAppOrder = MINI_APPS.map((app) => app.id);

export const useAppsStore = create<AppsStore>((set, get) => ({
  apps: MINI_APPS,
  appOrder: defaultAppOrder,
  isLoading: true,
  selectedApp: null,
  profileId: null,

  loadAppsOrder: async () => {
    try {
      set({ isLoading: true });
      const { profileId } = get();

      // Sync with Supabase and local storage
      const syncedOrder = await syncAppPreferences(profileId, defaultAppOrder);

      // Validate that all stored app IDs still exist
      const validOrder = syncedOrder.filter((id) =>
        MINI_APPS.some((app) => app.id === id)
      );
      // Add any new apps that weren't in the stored order
      const newApps = MINI_APPS.filter(
        (app) => !validOrder.includes(app.id)
      ).map((app) => app.id);

      const finalOrder = [...validOrder, ...newApps];

      set({
        appOrder: finalOrder,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error loading apps order:', error);
      set({ isLoading: false });
    }
  },

  setAppOrder: async (order) => {
    const { profileId } = get();
    try {
      await saveAppPreferences(profileId, order);
      set({ appOrder: order });
    } catch (error) {
      console.error('Error saving apps order:', error);
    }
  },

  setSelectedApp: (app) => set({ selectedApp: app }),

  getOrderedApps: () => {
    const { apps, appOrder } = get();
    return appOrder
      .map((id) => apps.find((app) => app.id === id))
      .filter((app): app is MiniApp => app !== undefined && app.enabled);
  },

  setProfileId: (profileId) => set({ profileId }),

  syncWithSupabase: async () => {
    const { profileId, loadAppsOrder } = get();
    if (profileId) {
      await loadAppsOrder();
    }
  },
}));

export default useAppsStore;
