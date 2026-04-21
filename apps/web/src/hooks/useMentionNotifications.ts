import { useEffect } from 'react';
import { getSocket } from './useSocket';
import { useSocketStore } from '../stores/socketStore';
import { useNotificationsStore } from '../stores/notificationsStore';
import { useChannelStore } from '../stores/channelStore';
import { WsEvents } from '@onyx/types';

/** Listens for mention:notification events and queues toasts. */
export function useMentionNotifications() {
  const connectionId = useSocketStore((s) => s.connectionId);
  const addAlert = useNotificationsStore((s) => s.addAlert);
  const activeChannelId = useChannelStore((s) => s.activeChannelId);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channelId, fromUser, content, isEveryone }: WsEvents.MentionNotification) => {
      // Don't show toast if already viewing that channel
      if (channelId === activeChannelId) return;
      addAlert({ channelId, fromUser: fromUser.displayName, content, isEveryone });
    };

    socket.on('mention:notification', handle);
    return () => { socket.off('mention:notification', handle); };
  }, [connectionId]);
}
