import { useEffect, useCallback, useRef, useState, useMemo } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useSocketStore } from '../stores/socketStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function useMessages(channelId: string) {
  const messages    = useMessageStore((s) => s.messages);
  const pinEvents   = useMessageStore((s) => s.pinEvents);
  const hasMore     = useMessageStore((s) => s.hasMore);
  const loading     = useMessageStore((s) => s.loading);
  const { fetchHistory, deleteMessage, removeMessage, updateReactions } = useMessageStore();
  const connectionId = useSocketStore((s) => s.connectionId);
  const [error, setError] = useState<string | null>(null);

  // Track pending cleanup timers so they can be cancelled on channel-switch / unmount
  const cleanupTimers = useRef<Set<ReturnType<typeof setTimeout>>>(new Set());

  const channelMessages = messages.get(channelId) ?? [];
  const channelHasMore  = hasMore.get(channelId) ?? true;
  const isLoading       = loading.get(channelId) ?? false;

  /** Messages + pin-system-rows merged and sorted by time */
  const merged = useMemo(() => {
    const msgs = messages.get(channelId) ?? [];
    const pins = pinEvents.get(channelId) ?? [];
    return [...msgs, ...pins].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messages, pinEvents, channelId]);

  /* ── Fetch history on channel mount ─────────────────────────────── */
  useEffect(() => {
    if (!channelId) return;
    setError(null);
    if (!messages.has(channelId)) {
      fetchHistory(channelId).catch(() => setError('Could not load messages.'));
    }
  }, [channelId]);

  /* ── Socket listeners — reconnect-safe ──────────────────────────── */
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('channel:join', { channelId });

    /**
     * Show italic "Message deleted" placeholder to ALL connected clients
     * for 3 seconds, then physically remove it from the list.
     */
    const handleDeleted = ({ messageId, channelId: cId }: WsEvents.MessageDeleted) => {
      if (cId !== channelId) return;

      deleteMessage(channelId, messageId);

      const timer = setTimeout(() => {
        removeMessage(channelId, messageId);
        cleanupTimers.current.delete(timer);
      }, 3000);

      cleanupTimers.current.add(timer);
    };

    socket.on('message:deleted', handleDeleted);

    const handleReactionUpdated = ({ messageId, channelId: cId, reactions }: WsEvents.ReactionUpdated) => {
      if (cId !== channelId) return;
      updateReactions(channelId, messageId, reactions);
    };
    socket.on('reaction:updated', handleReactionUpdated);

    return () => {
      socket.off('message:deleted', handleDeleted);
      socket.off('reaction:updated', handleReactionUpdated);
      // Cancel any pending auto-remove timers for this channel
      cleanupTimers.current.forEach(clearTimeout);
      cleanupTimers.current.clear();
    };
  }, [channelId, connectionId]);

  /* ── Load older messages ─────────────────────────────────────────── */
  const loadMore = useCallback(() => {
    if (!channelHasMore || isLoading) return;
    // channelMessages is Message[] (no PinEvents) — oldest is first item
    const oldest = channelMessages[0];
    fetchHistory(channelId, oldest ? String(oldest.createdAt) : undefined)
      .catch(() => setError('Could not load older messages.'));
  }, [channelId, channelMessages, channelHasMore, isLoading]);

  return { messages: merged, hasMore: channelHasMore, isLoading, loadMore, error };
}
