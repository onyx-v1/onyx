import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ── Request: inject access token ──────────────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('onyx-auth');
    const token = raw ? JSON.parse(raw)?.state?.accessToken : null;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// ── Response: handle 401 → refresh → retry once ───────────────────────────────
let isRefreshing = false;
let waitQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function flushQueue(error: any, token: string | null = null) {
  waitQueue.forEach((p) => (error ? p.reject(error) : p.resolve(token!)));
  waitQueue = [];
}

function forceLogout() {
  localStorage.removeItem('onyx-auth');
  // Clear Zustand auth state without importing authStore (avoids potential circular dep)
  // The page reload from window.location will do a full reset
  window.location.href = '/login';
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;

    if (error.response?.status !== 401 || original._retry) {
      return Promise.reject(error);
    }

    // Queue concurrent requests while refreshing
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        waitQueue.push({
          resolve: (token) => {
            original.headers.Authorization = `Bearer ${token}`;
            resolve(apiClient(original));
          },
          reject,
        });
      });
    }

    original._retry = true;
    isRefreshing = true;

    try {
      const raw = localStorage.getItem('onyx-auth');
      const stored = raw ? JSON.parse(raw) : null;
      const refreshToken = stored?.state?.refreshToken;
      if (!refreshToken) throw new Error('No refresh token');

      const { data } = await axios.post<{ accessToken: string; refreshToken?: string }>(
        `${API_URL}/auth/refresh`,
        { refreshToken },
      );

      // Persist new access token (and rotated refresh token if returned)
      stored.state.accessToken = data.accessToken;
      if (data.refreshToken) stored.state.refreshToken = data.refreshToken;
      localStorage.setItem('onyx-auth', JSON.stringify(stored));

      // Update Zustand store in-place (no import needed — use the persisted storage)
      // The request interceptor reads from localStorage so future requests are fine.

      flushQueue(null, data.accessToken);
      original.headers.Authorization = `Bearer ${data.accessToken}`;
      return apiClient(original);
    } catch (err) {
      flushQueue(err, null);
      forceLogout();
      return Promise.reject(err);
    } finally {
      isRefreshing = false;
    }
  },
);
