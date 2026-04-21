import { useEffect, useCallback, useState, useMemo } from 'react';
import { useMessageStore, isPinEvent } from '../stores/messageStore';
import { useSocketStore } from '../stores/socketStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function useMessages(channelId: string) {
  const messages   = useMessageStore((s) => s.messages);
  const pinEvents  = useMessageStore((s) => s.pinEvents);
  const hasMore    = useMessageStore((s) => s.hasMore);
  const loading    = useMessageStore((s) => s.loading);
  const { fetchHistory, removeMessage } = useMessageStore();
  const connectionId = useSocketStore((s) => s.connectionId);
  const [error, setError] = useState<string | null>(null);

  const channelMessages = messages.get(channelId) ?? [];
  const channelHasMore  = hasMore.get(channelId) ?? true;
  const isLoading       = loading.get(channelId) ?? false;

  // Merge messages + pin system rows, sorted by createdAt
  const merged = useMemo(() => {
    const msgs = messages.get(channelId) ?? [];
    const pins = pinEvents.get(channelId) ?? [];
    return [...msgs, ...pins].sort(
      (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    );
  }, [messages, pinEvents, channelId]);

  /* ── Initial history load ────────────────────────────────────────── */
  useEffect(() => {
    if (!channelId) return;
    setError(null);
    if (!messages.has(channelId)) {
      fetchHistory(channelId).catch(() => setError('Could not load messages.'));
    }
  }, [channelId]);

  /* ── Socket listeners ────────────────────────────────────────────── */
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('channel:join', { channelId });

    // Always physically remove — no "Message deleted" placeholder
    const handleDeleted = ({ messageId, channelId: cId }: WsEvents.MessageDeleted) => {
      if (cId === channelId) removeMessage(channelId, messageId);
    };

    socket.on('message:deleted', handleDeleted);
    return () => { socket.off('message:deleted', handleDeleted); };
  }, [channelId, connectionId]);

  /* ── Load more (older messages) ──────────────────────────────────── */
  const loadMore = useCallback(() => {
    if (!channelHasMore || isLoading) return;
    const oldest = channelMessages.find((m) => !isPinEvent(m));
    fetchHistory(channelId, oldest ? String(oldest.createdAt) : undefined)
      .catch(() => setError('Could not load older messages.'));
  }, [channelId, channelMessages, channelHasMore, isLoading]);

  return { messages: merged, hasMore: channelHasMore, isLoading, loadMore, error };
}
