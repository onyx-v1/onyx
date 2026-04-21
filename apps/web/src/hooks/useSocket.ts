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

// ── Attempt to refresh the expired JWT using stored refresh token ─────────────
async function tryRefreshToken(): Promise<string | null> {
  try {
    const raw = localStorage.getItem('onyx-auth');
    const stored = raw ? JSON.parse(raw) : null;
    const refreshToken = stored?.state?.refreshToken;
    if (!refreshToken) return null;

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    if (!res.ok) return null;

    const { accessToken } = await res.json();
    // Patch localStorage + Zustand store
    stored.state.accessToken = accessToken;
    localStorage.setItem('onyx-auth', JSON.stringify(stored));
    useAuthStore.setState({ accessToken });
    return accessToken;
  } catch {
    return null;
  }
}

// ── Force logout and redirect ─────────────────────────────────────────────────
function forceLogout() {
  useAuthStore.getState().logout();
  window.location.href = '/login';
}

// ── Create / replace the socket instance ─────────────────────────────────────
function createSocket(token: string): Socket {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }

  const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

  const s = io(WS_URL, {
    auth: { token },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    reconnectionAttempts: Infinity,
    timeout: 20000,
  });

  // ── Connected ───────────────────────────────────────────────────────────────
  s.on('connect', () => {
    useSocketStore.getState().setConnected();
    const { activeChannelId } = useChannelStore.getState();
    if (activeChannelId) s.emit('channel:join', { channelId: activeChannelId });
  });

  // ── Auth error — attempt token refresh before giving up ─────────────────────
  s.on('connect_error', async (err) => {
    const isAuthError =
      err.message === 'Invalid token' ||
      err.message === 'Authentication required' ||
      err.message === 'jwt expired';

    if (!isAuthError) return; // network error — let socket.io retry normally

    // Stop retrying with the bad token
    s.io.opts.reconnection = false;

    // Check if HTTP interceptor already refreshed the token
    const storeToken = useAuthStore.getState().accessToken;
    if (storeToken && storeToken !== (s as any).auth?.token) {
      (s as any).auth = { token: storeToken };
      s.io.opts.reconnection = true;
      s.connect();
      return;
    }

    // Try refreshing ourselves
    const newToken = await tryRefreshToken();
    if (newToken) {
      (s as any).auth = { token: newToken };
      s.io.opts.reconnection = true;
      s.connect();
    } else {
      forceLogout();
    }
  });

  // ── Disconnected ─────────────────────────────────────────────────────────────
  s.on('disconnect', (reason) => {
    // 'io server disconnect' means server kicked us — reconnect manually
    if (reason === 'io server disconnect') {
      setTimeout(() => s.connect(), 1000);
    }
    // 'transport close' = proxy timeout — socket.io will auto-reconnect
  });

  return s;
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useSocket(): void {
  const { isAuthenticated, accessToken } = useAuthStore();
  const initialised = useRef(false);

  // (Re)create socket when auth changes
  useEffect(() => {
    if (!isAuthenticated || !accessToken) {
      if (socket) {
        socket.removeAllListeners();
        socket.disconnect();
        socket = null;
      }
      return;
    }

    if (socket?.connected && !initialised.current) {
      initialised.current = true;
      return;
    }

    if (!socket) {
      socket = createSocket(accessToken);
      initialised.current = true;
    }
  }, [isAuthenticated, accessToken]);

  // Page visible → reconnect if dropped
  useEffect(() => {
    if (!isAuthenticated) return;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (socket && !socket.connected) socket.connect();
      else if (!socket) {
        const t = useAuthStore.getState().accessToken;
        if (t) socket = createSocket(t);
      }
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => document.removeEventListener('visibilitychange', onVisible);
  }, [isAuthenticated]);

  // Network online → reconnect
  useEffect(() => {
    if (!isAuthenticated) return;
    const onOnline = () => {
      if (socket && !socket.connected) socket.connect();
      else if (!socket) {
        const t = useAuthStore.getState().accessToken;
        if (t) socket = createSocket(t);
      }
    };
    window.addEventListener('online', onOnline);
    return () => window.removeEventListener('online', onOnline);
  }, [isAuthenticated]);
}
