import { create } from 'zustand';
import { Channel } from '@onyx/types';
import { apiClient } from '../api/client';

interface ChannelState {
  channels: Channel[];
  activeChannelId: string | null;
  communityName: string;
  unreadChannels: Set<string>;

  fetchCommunity: () => Promise<void>;
  setActiveChannel: (id: string) => void;
  setChannels: (channels: Channel[]) => void;
  addChannel: (channel: Channel) => void;
  removeChannel: (id: string) => void;
  markUnread: (channelId: string) => void;
  markRead: (channelId: string) => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels: [],
  activeChannelId: null,
  communityName: 'Onyx',
  unreadChannels: new Set(),

  fetchCommunity: async () => {
    const { data } = await apiClient.get('/community');
    set({ channels: data.channels, communityName: data.name });
    // Auto-navigate to first text channel if none active
    if (!get().activeChannelId && data.channels.length > 0) {
      const firstText = data.channels.find((c: Channel) => c.type === 'TEXT');
      if (firstText) set({ activeChannelId: firstText.id });
    }
  },

  setActiveChannel: (id) => set({ activeChannelId: id }),

  setChannels: (channels) => set({ channels }),

  addChannel: (channel) =>
    set((s) => ({ channels: [...s.channels, channel].sort((a, b) => a.position - b.position) })),

  removeChannel: (id) =>
    set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),

  markUnread: (channelId) =>
    set((s) => {
      if (s.activeChannelId === channelId) return s;
      const next = new Set(s.unreadChannels);
      next.add(channelId);
      return { unreadChannels: next };
    }),

  markRead: (channelId) =>
    set((s) => {
      const next = new Set(s.unreadChannels);
      next.delete(channelId);
      return { unreadChannels: next };
    }),
}));
