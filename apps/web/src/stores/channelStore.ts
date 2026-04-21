import { create } from 'zustand';
import { Channel } from '@onyx/types';
import { apiClient } from '../api/client';

interface ChannelState {
  channels:          Channel[];
  activeChannelId:   string | null;
  communityName:     string;

  // ── Unread tracking ─────────────────────────────────────────────
  unreadCounts:      Record<string, number>;  // # new messages per channel
  mentionedChannels: Set<string>;             // channels with @mention for current user

  fetchCommunity:    () => Promise<void>;
  setActiveChannel:  (id: string) => void;
  setChannels:       (channels: Channel[]) => void;
  addChannel:        (channel: Channel) => void;
  removeChannel:     (id: string) => void;

  incrementUnread:   (channelId: string) => void;
  addMention:        (channelId: string) => void;
  markRead:          (channelId: string) => void; // clears BOTH count and mention
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  channels:          [],
  activeChannelId:   null,
  communityName:     'Onyx',
  unreadCounts:      {},
  mentionedChannels: new Set(),

  fetchCommunity: async () => {
    const { data } = await apiClient.get('/community');
    set({ channels: data.channels, communityName: data.name });
    if (!get().activeChannelId && data.channels.length > 0) {
      const firstText = data.channels.find((c: Channel) => c.type === 'TEXT');
      if (firstText) set({ activeChannelId: firstText.id });
    }
  },

  setActiveChannel: (id) => set({ activeChannelId: id }),
  setChannels:      (channels) => set({ channels }),

  addChannel: (channel) =>
    set((s) => ({ channels: [...s.channels, channel].sort((a, b) => a.position - b.position) })),

  removeChannel: (id) =>
    set((s) => ({ channels: s.channels.filter((c) => c.id !== id) })),

  incrementUnread: (channelId) =>
    set((s) => {
      if (s.activeChannelId === channelId) return s; // never count for active channel
      return {
        unreadCounts: {
          ...s.unreadCounts,
          [channelId]: (s.unreadCounts[channelId] ?? 0) + 1,
        },
      };
    }),

  addMention: (channelId) =>
    set((s) => {
      if (s.activeChannelId === channelId) return s;
      const next = new Set(s.mentionedChannels);
      next.add(channelId);
      return { mentionedChannels: next };
    }),

  markRead: (channelId) =>
    set((s) => {
      const { [channelId]: _removed, ...rest } = s.unreadCounts;
      const next = new Set(s.mentionedChannels);
      next.delete(channelId);
      return { unreadCounts: rest, mentionedChannels: next };
    }),
}));
