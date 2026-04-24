/**
 * Platform Bridge — Capacitor (Android) implementation
 */

import type { PlatformAPI } from './index';

const nativePlatform: PlatformAPI = {
  isNative:  true,
  isDesktop: false,

  ready: async () => {
    // ── Re-apply persisted theme immediately ──────────────────────
    try {
      const stored = localStorage.getItem('onyx-theme');
      const id = stored ? (JSON.parse(stored)?.state?.theme ?? 'dark') : 'dark';
      document.documentElement.setAttribute('data-theme', id);
    } catch {
      document.documentElement.setAttribute('data-theme', 'dark');
    }

    // ── Back button ───────────────────────────────────────────────
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) App.exitApp();
      else window.history.back();
    });

    // ── Edge-to-edge status bar ───────────────────────────────────
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });
      await StatusBar.setBackgroundColor({ color: '#00000000' });
    } catch {
      // StatusBar plugin may not be available in browser — safe to ignore
    }

    // ── Push Notifications (FCM) ──────────────────────────────────
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      // 1. Request permission
      const perm = await PushNotifications.requestPermissions();
      if (perm.receive !== 'granted') return;

      // 2. Register with FCM
      await PushNotifications.register();

      // 3. On token received — send to backend
      PushNotifications.addListener('registration', async (token) => {
        try {
          const authRaw = localStorage.getItem('onyx-auth');
          const accessToken = authRaw ? JSON.parse(authRaw)?.state?.accessToken : null;
          if (!accessToken) return;

          const apiBase = import.meta.env.VITE_API_URL ?? 'https://onyx-api0.up.railway.app/api';
          await fetch(`${apiBase}/devices/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ fcmToken: token.value }),
          });
        } catch {
          // Non-critical — pushes just won't work for this session
        }
      });

      // 4. Notification tap — navigate to the channel
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const channelId = action.notification.data?.channelId;
        if (channelId) {
          window.location.href = `/channel/${channelId}`;
        }
      });

      // 5. Foreground notification received — dismiss silently
      //    (user is already in the app, real-time socket handles it)
      PushNotifications.addListener('pushNotificationReceived', () => {
        // No-op: the live WebSocket message already appeared in chat
      });

    } catch {
      // Plugin unavailable (browser/dev build) — safe to ignore
    }
  },

  // Notifications — handled natively via FCM above
  showNotification:    () => {},
  onNotificationClick: () => {},

  // Updates not applicable on Android
  checkForUpdates: undefined,
  onUpdateStatus:  undefined,
  quitAndInstall:  undefined,
};

export default nativePlatform;
