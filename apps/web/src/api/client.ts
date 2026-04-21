import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  withCredentials: true,
});

// ─── Request Interceptor: inject token ───────────────────────────────────────
apiClient.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem('onyx-auth');
    const stored = raw ? JSON.parse(raw) : null;
    const token = stored?.state?.accessToken;
    if (token) config.headers.Authorization = `Bearer ${token}`;
  } catch {}
  return config;
});

// ─── Response Interceptor: handle token refresh ───────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = [];

function processQueue(error: any, token: string | null = null) {
  failedQueue.forEach((prom) => (error ? prom.reject(error) : prom.resolve(token!)));
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({
            resolve: (token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              resolve(apiClient(originalRequest));
            },
            reject,
          });
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const raw = localStorage.getItem('onyx-auth');
        const stored = raw ? JSON.parse(raw) : null;
        const refreshToken = stored?.state?.refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(`${API_URL}/auth/refresh`, { refreshToken });

        // Patch localStorage directly to avoid import cycle
        if (stored) {
          stored.state.accessToken = data.accessToken;
          localStorage.setItem('onyx-auth', JSON.stringify(stored));
        }

        processQueue(null, data.accessToken);
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (err) {
        processQueue(err, null);
        localStorage.removeItem('onyx-auth');
        window.location.href = '/login';
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);
