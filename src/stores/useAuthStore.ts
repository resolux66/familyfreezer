// 📘 React Native Note — Why store the user in Zustand?
// Once logged in, every screen needs to know the current user (to show their
// name, check if they're an admin, etc.). Without Zustand, each screen would
// call account.get() independently — that's a network round-trip per screen.
//
// Instead: call account.get() ONCE at app launch (checkSession), store the
// result in Zustand, and every screen reads it instantly from memory with
// no network overhead.
//
// Appwrite sessions: the Appwrite SDK stores the session cookie automatically
// in expo-secure-store (wired in Phase 1). On the next app launch,
// checkSession() calls account.get() which sends that cookie — if it's still
// valid, the user is silently re-authenticated without seeing a login screen.

import { create } from 'zustand';

import { account } from '@/lib/appwrite';

interface AuthUser {
  $id: string;
  email: string;
  name: string;
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  pendingRegistration: boolean;
  checkSession: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  setPendingRegistration: (v: boolean) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  pendingRegistration: false,
  setPendingRegistration: (v) => set({ pendingRegistration: v }),

  checkSession: async () => {
    try {
      const user = await account.get();
      set({ user: { $id: user.$id, email: user.email, name: user.name }, isLoading: false });
    } catch {
      set({ user: null, isLoading: false });
    }
  },

  login: async (email, password) => {
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    set({ user: { $id: user.$id, email: user.email, name: user.name } });
  },

  register: async (email, password, name) => {
    await account.create('unique()', email, password, name);
    await account.createEmailPasswordSession(email, password);
    const user = await account.get();
    set({ user: { $id: user.$id, email: user.email, name: user.name } });
  },

  logout: async () => {
    try {
      await account.deleteSession('current');
    } catch {
      // session may already be invalid
    }
    set({ user: null });
  },
}));
