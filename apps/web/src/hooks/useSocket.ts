import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '../stores/authStore';
import { useChannelStore } from '../stores/channelStore';
import { useSocketStore } from '../stores/socketStore';

// ── Singleton — survives re-renders ──────────────────────────────────────────
let socket: Socket | null = null;

export function getSocket(): Socket | null {
  return socket;
}

// ── Create / replace the socket instance ─────────────────────────────────────
function createSocket(token: string): Socket {
  // Tear down any previous dead instance cleanly
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

  const s = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    // ── Reconnection settings ───────────────────────────────
    reconnection: true,
    reconnectionDelay: 1000,       // 1s initial backoff
    reconnectionDelayMax: 15000,   // max 15s between retries
    reconnectionAttempts: Infinity, // NEVER give up
    timeout: 20000,                // 20s connection timeout
    // ── Keep-alive ─────────────────────────────────────────
    pingInterval: 25000,           // server ping every 25s
    pingTimeout: 20000,            // disconnect if no pong in 20s
  });

  s.on('connect', () => {
    console.log('[Socket] ✅ Connected:', s.id);
    // Notify all subscribers (useMessages, etc.) that socket is ready
    useSocketStore.getState().setConnected();
    // Re-join the active channel after every (re)connection
    const { activeChannelId } = useChannelStore.getState();
    if (activeChannelId) {
      s.emit('channel:join', { channelId: activeChannelId });
    }
  });

  s.on('disconnect', (reason) => {
    console.warn('[Socket] ⚠ Disconnected:', reason);
    // If the server forcefully closed it, Socket.IO won't auto-reconnect.
    // Kick off reconnection manually.
    if (reason === 'io server disconnect' || reason === 'transport close') {
      setTimeout(() => s.connect(), 1000);
    }
  });

  s.on('connect_error', (err) => {
    console.error('[Socket] ✗ Error:', err.message);
  });

  s.on('reconnect', (attempt) => {
    console.log(`[Socket] 🔄 Reconnected after ${attempt} attempt(s)`);
    // Re-join the active channel after reconnection
    const { activeChannelId } = useChannelStore.getState();
    if (activeChannelId) {
      s.emit('channel:join', { channelId: activeChannelId });
    }
  });

  s.on('reconnect_error', (err) => {
    console.warn('[Socket] Reconnect error:', err.message);
  });

  return s;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSocket(): Socket | null {
  const { isAuthenticated, accessToken } = useAuthStore();
  const socketRef = useRef<Socket | null>(null);

  // ── (Re)create socket when auth changes ────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
      socketRef.current = null;
      return;
    }

    // Already alive — reuse
    if (socket?.connected) {
      socketRef.current = socket;
      return;
    }

    socket = createSocket(accessToken);
    socketRef.current = socket;

    return () => {
      // Don't disconnect on unmount — socket is a singleton across routes
    };
  }, [isAuthenticated, accessToken]);

  // ── Page Visibility API — reconnect when user returns to tab ───────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      if (!socket) {
        // No socket at all — create one fresh
        const token = useAuthStore.getState().accessToken;
        if (token) { socket = createSocket(token); socketRef.current = socket; }
      } else if (!socket.connected) {
        // Socket exists but disconnected — just reconnect (preserves all listeners)
        console.log('[Socket] 👁 Tab visible — reconnecting existing socket...');
        socket.connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isAuthenticated]);

  // ── Online/offline events — reconnect when network returns ─────────────────
  useEffect(() => {
    if (!isAuthenticated) return;

    const handleOnline = () => {
      console.log('[Socket] 🌐 Network online');
      if (!socket) {
        const token = useAuthStore.getState().accessToken;
        if (token) { socket = createSocket(token); socketRef.current = socket; }
      } else if (!socket.connected) {
        // Reuse existing socket — all listeners stay intact
        socket.connect();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [isAuthenticated]);

  return socketRef.current;
}
