import { useEffect } from 'react';
import { usePresenceStore } from '../stores/presenceStore';
import { useSocketStore } from '../stores/socketStore';
import { getSocket } from './useSocket';
import { WsEvents } from '@onyx/types';

export function usePresence() {
  const { initPresence, setOnline, setOffline } = usePresenceStore();
  const connectionId = useSocketStore((s) => s.connectionId);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleInit   = ({ onlineUserIds }: WsEvents.PresenceInit)  => initPresence(onlineUserIds);
    const handleUpdate = ({ userId, online }: WsEvents.PresenceUpdate) =>
      online ? setOnline(userId) : setOffline(userId);

    socket.on('presence:init',   handleInit);
    socket.on('presence:update', handleUpdate);

    // Re-request presence snapshot after every reconnect
    // (server sends presence:init on connection, so just re-listen — no emit needed)

    return () => {
      socket.off('presence:init',   handleInit);
      socket.off('presence:update', handleUpdate);
    };
  }, [connectionId]); // re-runs on every socket connect
}
