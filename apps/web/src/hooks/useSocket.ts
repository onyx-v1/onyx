import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';

// Singleton socket instance — persists across component renders
let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

export function useSocket(): Socket | null {
  const { isAuthenticated, accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (socket?.connected) {
      socketRef.current = socket;
      return;
    }

    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

    socket = io(WS_URL, {
      auth: { token: accessToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => console.log('[Socket] Connected:', socket?.id));
    socket.on('disconnect', (reason) => console.log('[Socket] Disconnected:', reason));
    socket.on('connect_error', (err) => console.error('[Socket] Error:', err.message));

    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — socket is a singleton
    };
  }, [isAuthenticated, accessToken]);

  return socketRef.current;
}
