import { useEffect, useCallback, useState } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useSocketStore } from '../stores/socketStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function useMessages(channelId: string) {
  const { messages, hasMore, loading, fetchHistory, deleteMessage } = useMessageStore();
  const connectionId = useSocketStore((s) => s.connectionId);
  const [error, setError] = useState<string | null>(null);

  const channelMessages = messages.get(channelId) ?? [];
  const channelHasMore  = hasMore.get(channelId) ?? true;
  const isLoading       = loading.get(channelId) ?? false;

  /* ── Initial history load ────────────────────────────────────────── */
  useEffect(() => {
    if (!channelId) return;
    setError(null);
    if (!messages.has(channelId)) {
      fetchHistory(channelId).catch(() => setError('Could not load messages.'));
    }
  }, [channelId]);

  /* ── Socket listeners — re-runs on channelId change OR reconnect ── */
  useEffect(() => {
    if (!channelId) return;
    const socket = getSocket();
    if (!socket) return;

    socket.emit('channel:join', { channelId });

    // Note: message:new storage is handled globally by useUnreadTracker.
    // We only need to listen for deletes here (channel-scoped).
    const handleDeleted = ({ messageId, channelId: cId }: WsEvents.MessageDeleted) => {
      if (cId === channelId) deleteMessage(channelId, messageId);
    };

    socket.on('message:deleted', handleDeleted);

    return () => {
      socket.off('message:deleted', handleDeleted);
    };
  }, [channelId, connectionId]);

  /* ── Load more (older messages) ──────────────────────────────────── */
  const loadMore = useCallback(() => {
    if (!channelHasMore || isLoading) return;
    const oldest = channelMessages[0];
    fetchHistory(channelId, oldest ? String(oldest.createdAt) : undefined)
      .catch(() => setError('Could not load older messages.'));
  }, [channelId, channelMessages, channelHasMore, isLoading]);

  return { messages: channelMessages, hasMore: channelHasMore, isLoading, loadMore, error };
}
