import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// 📘 React Native Note — Zustand vs TanStack Query
// Zustand manages LOCAL UI state — things that exist only on this device
// and don't need to be synced with the server. Examples here:
//   activeHouseholdId  ← which household the user is viewing right now
//   searchQuery        ← what the user typed in the search box
//   bannerDismissed    ← did the user close the expiry warning today?
//
// TanStack Query (Phase 4) manages SERVER state — data that lives in Appwrite
// and must be fetched, cached, and synced. Don't put server data in Zustand.

interface AppState {
  activeHouseholdId: string | null;
  setActiveHousehold: (id: string | null) => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  // Used by ExpiryBanner (Phase 9) — reset on each new day
  bannerDismissedDate: string | null;
  dismissBanner: () => void;
}

export const useAppStore = create<AppState>()(
  // 📘 React Native Note — Zustand persist middleware
  // The 'persist' middleware serialises state to AsyncStorage automatically.
  // AsyncStorage is React Native's built-in key-value store (like localStorage
  // on the web, but async). Data survives app restarts.
  //
  // 'partialize' controls WHAT gets persisted. We persist activeHouseholdId
  // so the user doesn't have to re-select their household on every launch.
  // We do NOT persist searchQuery or bannerDismissedDate — those should reset.
  persist(
    (set) => ({
      activeHouseholdId: null,
      setActiveHousehold: (id) => set({ activeHouseholdId: id }),

      searchQuery: '',
      setSearchQuery: (q) => set({ searchQuery: q }),

      bannerDismissedDate: null,
      dismissBanner: () =>
        set({ bannerDismissedDate: new Date().toDateString() }),
    }),
    {
      name: 'app-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({ activeHouseholdId: state.activeHouseholdId }),
    },
  ),
);
