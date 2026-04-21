import { create } from 'zustand';
import { Message } from '@onyx/types';
import { apiClient } from '../api/client';

interface MessageState {
  messages: Map<string, Message[]>;
  hasMore: Map<string, boolean>;
  loading: Map<string, boolean>;

  fetchHistory: (channelId: string, before?: string) => Promise<void>;
  addMessage: (channelId: string, message: Message) => void;
  deleteMessage: (channelId: string, messageId: string) => void;
  clearChannel: (channelId: string) => void;
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages: new Map(),
  hasMore: new Map(),
  loading: new Map(),

  fetchHistory: async (channelId: string, before?: string) => {
    const { loading } = get();
    if (loading.get(channelId)) return;

    set((s) => {
      const next = new Map(s.loading);
      next.set(channelId, true);
      return { loading: next };
    });

    try {
      const params: Record<string, string> = { limit: '50' };
      if (before) params.before = before;

      const { data } = await apiClient.get(`/messages/channel/${channelId}`, { params });
      const incoming: Message[] = data;

      set((s) => {
        const existing = s.messages.get(channelId) ?? [];
        const merged = before ? [...incoming, ...existing] : incoming;
        const nextMessages = new Map(s.messages);
        nextMessages.set(channelId, merged);

        const nextHasMore = new Map(s.hasMore);
        // Use >= 50: if exactly 50 returned, assume there may be more.
        // If a subsequent fetch returns 0, hasMore flips to false cleanly.
        nextHasMore.set(channelId, incoming.length >= 50);

        return { messages: nextMessages, hasMore: nextHasMore };
      });
    } finally {
      set((s) => {
        const next = new Map(s.loading);
        next.set(channelId, false);
        return { loading: next };
      });
    }
  },

  addMessage: (channelId, message) =>
    set((s) => {
      const existing = s.messages.get(channelId) ?? [];
      // Deduplicate
      if (existing.some((m) => m.id === message.id)) return s;
      // Cap at 200 messages — trim oldest 50 when we exceed 250
      // Keeps DOM small and memory bounded with 50+ active users
      const appended = [...existing, message];
      const capped = appended.length > 250 ? appended.slice(appended.length - 200) : appended;
      const nextMessages = new Map(s.messages);
      nextMessages.set(channelId, capped);
      return { messages: nextMessages };
    }),

  deleteMessage: (channelId, messageId) =>
    set((s) => {
      const existing = s.messages.get(channelId) ?? [];
      const nextMessages = new Map(s.messages);
      nextMessages.set(
        channelId,
        existing.map((m) => (m.id === messageId ? { ...m, deleted: true, content: '' } : m)),
      );
      return { messages: nextMessages };
    }),

  clearChannel: (channelId) =>
    set((s) => {
      const next = new Map(s.messages);
      next.delete(channelId);
      return { messages: next };
    }),
}));
