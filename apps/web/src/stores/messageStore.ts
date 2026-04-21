import { create } from 'zustand';
import { Message } from '@onyx/types';
import { apiClient } from '../api/client';

// ── Pin system rows ──────────────────────────────────────────────────────────
// These are ephemeral in-memory entries shown in the message list
// (session-only — not persisted to DB).
export interface PinEvent {
  _pinEvent: true;
  id: string;          // unique per event
  channelId: string;
  messageId: string;
  pinnedByName: string;
  createdAt: Date;
}

export type MessageOrPin = Message | PinEvent;
export function isPinEvent(m: MessageOrPin): m is PinEvent {
  return (m as PinEvent)._pinEvent === true;
}

interface MessageState {
  messages:    Map<string, Message[]>;
  pinEvents:   Map<string, PinEvent[]>;
  hasMore:     Map<string, boolean>;
  loading:     Map<string, boolean>;

  fetchHistory:    (channelId: string, before?: string) => Promise<void>;
  addMessage:      (channelId: string, message: Message) => void;
  updateMessage:   (channelId: string, messageId: string, patch: Partial<Message>) => void;
  deleteMessage:   (channelId: string, messageId: string) => void;
  removeMessage:   (channelId: string, messageId: string) => void;
  addPinEvent:     (channelId: string, event: PinEvent) => void;
  clearChannel:    (channelId: string) => void;

  /** Merge messages + pinEvents for a channel, sorted by createdAt */
  getMerged:       (channelId: string) => MessageOrPin[];
}

export const useMessageStore = create<MessageState>((set, get) => ({
  messages:  new Map(),
  pinEvents: new Map(),
  hasMore:   new Map(),
  loading:   new Map(),

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
      const incoming: Message[] = (data as Message[]).filter((m) => !m.deleted);

      set((s) => {
        const existing = s.messages.get(channelId) ?? [];
        const merged = before ? [...incoming, ...existing] : incoming;
        const nextMessages = new Map(s.messages);
        nextMessages.set(channelId, merged);

        const nextHasMore = new Map(s.hasMore);
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
      if (existing.some((m) => m.id === message.id)) return s;
      const appended = [...existing, message];
      const capped = appended.length > 250 ? appended.slice(appended.length - 200) : appended;
      const nextMessages = new Map(s.messages);
      nextMessages.set(channelId, capped);
      return { messages: nextMessages };
    }),

  updateMessage: (channelId, messageId, patch) =>
    set((s) => {
      const existing = s.messages.get(channelId) ?? [];
      const nextMessages = new Map(s.messages);
      nextMessages.set(channelId, existing.map((m) => m.id === messageId ? { ...m, ...patch } : m));
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

  /** Physically removes a message with no trace — used when feedback is off */
  removeMessage: (channelId: string, messageId: string) =>
    set((s) => {
      const existing = s.messages.get(channelId) ?? [];
      const nextMessages = new Map(s.messages);
      nextMessages.set(channelId, existing.filter((m) => m.id !== messageId));
      return { messages: nextMessages };
    }),

  addPinEvent: (channelId, event) =>
    set((s) => {
      const existing = s.pinEvents.get(channelId) ?? [];
      const next = new Map(s.pinEvents);
      next.set(channelId, [...existing, event]);
      return { pinEvents: next };
    }),

  clearChannel: (channelId) =>
    set((s) => {
      const nextMsg = new Map(s.messages);
      const nextPin = new Map(s.pinEvents);
      nextMsg.delete(channelId);
      nextPin.delete(channelId);
      return { messages: nextMsg, pinEvents: nextPin };
    }),

  getMerged: (channelId) => {
    const { messages, pinEvents } = get();
    const msgs: MessageOrPin[] = messages.get(channelId) ?? [];
    const pins: MessageOrPin[] = pinEvents.get(channelId) ?? [];
    return [...msgs, ...pins].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  },
}));
