import { useEffect, useCallback } from 'react';
import { useMessageStore } from '../stores/messageStore';
import { useChannelStore } from '../stores/channelStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function useMessages(channelId: string) {
  const { messages, hasMore, loading, fetchHistory, addMessage, deleteMessage } = useMessageStore();
  const { markUnread, activeChannelId } = useChannelStore();

  const channelMessages = messages.get(channelId) ?? [];
  const channelHasMore = hasMore.get(channelId) ?? true;
  const isLoading = loading.get(channelId) ?? false;

  // Initial load
  useEffect(() => {
    if (!channelId) return;
    if (!messages.has(channelId)) {
      fetchHistory(channelId);
    }
  }, [channelId]);

  // Subscribe to real-time events for this channel
  useEffect(() => {
    const socket = getSocket();
    if (!socket || !channelId) return;

    // Join the channel room (also done in useSocket on reconnect, but belt-and-braces)
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

    // Re-join the room after every reconnect — server clears rooms on disconnect
    const handleReconnect = () => {
      socket.emit('channel:join', { channelId });
    };

    socket.on('message:new', handleNewMessage);
    socket.on('message:deleted', handleDeleted);
    socket.on('connect', handleReconnect); // fires on initial connect AND every reconnect

    return () => {
      socket.emit('channel:leave', { channelId });
      socket.off('message:new', handleNewMessage);
      socket.off('message:deleted', handleDeleted);
      socket.off('connect', handleReconnect);
    };
  }, [channelId]);

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
