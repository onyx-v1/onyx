import { create } from 'zustand';

interface PresenceState {
  onlineUsers: Set<string>;
  setOnline:    (userId: string) => void;
  setOffline:   (userId: string) => void;
  initPresence: (userIds: string[]) => void;
}

export const usePresenceStore = create<PresenceState>((set) => ({
  onlineUsers: new Set(),

  initPresence: (userIds) => set({ onlineUsers: new Set(userIds) }),

  setOnline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.add(userId);
      return { onlineUsers: next };
    }),

  setOffline: (userId) =>
    set((s) => {
      const next = new Set(s.onlineUsers);
      next.delete(userId);
      return { onlineUsers: next };
    }),
}));

// Selector used outside the store — avoids storing a function in Zustand state
// which breaks equality checks and causes unnecessary re-renders.
export const selectIsOnline = (userId: string) =>
  (state: PresenceState) => state.onlineUsers.has(userId);
