import { useEffect } from 'react';
import { usePresenceStore } from '../stores/presenceStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function usePresence() {
  const { initPresence, setOnline, setOffline, onlineUsers } = usePresenceStore();

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleInit = ({ onlineUserIds }: WsEvents.PresenceInit) => {
      initPresence(onlineUserIds);
    };

    const handleUpdate = ({ userId, online }: WsEvents.PresenceUpdate) => {
      online ? setOnline(userId) : setOffline(userId);
    };

    socket.on('presence:init', handleInit);
    socket.on('presence:update', handleUpdate);

    return () => {
      socket.off('presence:init', handleInit);
      socket.off('presence:update', handleUpdate);
    };
  }, []);

  return { onlineUsers };
}
