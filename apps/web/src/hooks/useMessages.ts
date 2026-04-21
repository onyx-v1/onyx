import { useEffect, useCallback } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useChannelStore } from '../stores/channelStore';
import { useSocketStore } from '../stores/socketStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function useMessages(channelId: string) {
  const { messages, hasMore, loading, fetchHistory, addMessage, deleteMessage } = useMessageStore();
  const { markUnread, activeChannelId } = useChannelStore();

  // Re-run the socket effect every time the socket (re)connects
  const connectionId = useSocketStore((s) => s.connectionId);

  const channelMessages = messages.get(channelId) ?? [];
  const channelHasMore = hasMore.get(channelId) ?? true;
  const isLoading = loading.get(channelId) ?? false;

  // Initial history load
  useEffect(() => {
    if (!channelId) return;
    if (!messages.has(channelId)) {
      fetchHistory(channelId);
    }
  }, [channelId]);

  // Socket listeners — re-runs whenever channelId changes OR socket connects
  // connectionId changes every time the socket connects (initial + every reconnect)
  // This guarantees we never miss setting up listeners even if socket wasn't
  // ready when the component first mounted.
  useEffect(() => {
    if (!channelId) return;

    const socket = getSocket();
    if (!socket) return; // socket not created yet — will retry when connectionId changes

    // Join channel room on server
    socket.emit('channel:join', { channelId });

    const handleNewMessage = ({ message }: WsEvents.MessageNew) => {
      if (message.channelId === channelId) {
        addMessage(channelId, message);
        if (activeChannelId !== channelId) markUnread(channelId);
      }
    };

    const handleDeleted = ({ messageId, channelId: cId }: WsEvents.MessageDeleted) => {
      if (cId === channelId) deleteMessage(channelId, messageId);
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleDeleted);

    return () => {
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleDeleted);
      // Note: don't leave channel here — handled by channel switch
    };
  }, [channelId, connectionId]); // ← connectionId is the key dependency

  const loadMore = useCallback(() => {
    if (!channelHasMore || isLoading) return;
    const oldest = channelMessages[0];
    if (oldest) fetchHistory(channelId, String(oldest.createdAt));
  }, [channelId, channelMessages, channelHasMore, isLoading]);

  return {
    messages: channelMessages,
    hasMore: channelHasMore,
    isLoading,
    loadMore,
  };
}
