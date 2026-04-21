import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useSocketStore } from '../stores/socketStore';
import { useChannelStore } from '../stores/channelStore';
import { WsEvents } from '@onyx/types';

/**
 * Listens for incoming messages and mentions then updates
 * the per-channel unread counts in channelStore.
 * Call once from AppShell.
 */
export function useUnreadTracker() {
  const connectionId = useSocketStore((s) => s.connectionId);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    // New message → increment unread count (skips active channel)
    const onMessage = ({ message }: WsEvents.MessageNew) => {
      useChannelStore.getState().incrementUnread(message.channelId);
    };

    // Mention → mark that channel has a pending @mention
    const onMention = ({ channelId }: WsEvents.MentionNotification) => {
      useChannelStore.getState().addMention(channelId);
    };

    socket.on('message:new',         onMessage);
    socket.on('mention:notification', onMention);

    return () => {
      socket.off('message:new',          onMessage);
      socket.off('mention:notification', onMention);
    };
  }, [connectionId]);
}
