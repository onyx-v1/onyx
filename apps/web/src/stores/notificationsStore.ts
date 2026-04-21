import { create } from 'zustand';

export interface MentionAlert {
  id: string;
  channelId: string;
  fromUser: string;
  content: string;
  isEveryone: boolean;
  timestamp: number;
}

interface NotificationsState {
  alerts: MentionAlert[];
  addAlert: (alert: Omit<MentionAlert, 'id' | 'timestamp'>) => void;
  dismiss: (id: string) => void;
  dismissAll: () => void;
}

export const useNotificationsStore = create<NotificationsState>((set) => ({
  alerts: [],

  addAlert: (alert) =>
    set((s) => ({
      // Cap at 5 visible toasts
      alerts: [
        { ...alert, id: crypto.randomUUID(), timestamp: Date.now() },
        ...s.alerts,
      ].slice(0, 5),
    })),

  dismiss: (id) => set((s) => ({ alerts: s.alerts.filter((a) => a.id !== id) })),
  dismissAll: () => set({ alerts: [] }),
}));
