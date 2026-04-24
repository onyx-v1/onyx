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
      if (perm.receive !== 'granted') {
        console.warn('[FCM] Notification permission denied');
        return;
      }

      // 2. Create the Android notification channel FIRST
      //    (Android 8+ silently drops notifications if the channelId doesn't exist)
      try {
        await PushNotifications.createChannel({
          id:          'onyx-messages',
          name:        'Onyx Messages',
          description: 'New message and mention notifications',
          importance:  5,      // IMPORTANCE_HIGH — heads-up style
          sound:       'default',
          vibration:   true,
          visibility:  1,      // VISIBILITY_PUBLIC
          lights:      true,
          lightColor:  '#9d8fff',
        });
      } catch (e) {
        console.warn('[FCM] createChannel error (may be normal on iOS):', e);
      }

      // 3. Register with FCM
      await PushNotifications.register();

      // 4. On token received — send to backend
      PushNotifications.addListener('registration', async (token) => {
        console.log('[FCM] Got device token:', token.value.slice(0, 20) + '…');
        try {
          const authRaw = localStorage.getItem('onyx-auth');
          const accessToken = authRaw ? JSON.parse(authRaw)?.state?.accessToken : null;
          if (!accessToken) {
            console.warn('[FCM] No accessToken found — token not registered');
            return;
          }

          const apiBase = import.meta.env.VITE_API_URL ?? 'https://onyx-api0.up.railway.app/api';
          const res = await fetch(`${apiBase}/devices/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${accessToken}`,
            },
            body: JSON.stringify({ fcmToken: token.value }),
          });
          console.log('[FCM] Token registered with backend, status:', res.status);
        } catch (e) {
          console.error('[FCM] Failed to register token with backend:', e);
        }
      });

      // 5. Registration error
      PushNotifications.addListener('registrationError', (err) => {
        console.error('[FCM] Registration error:', err);
      });

      // 6. Notification tap — navigate to the channel
      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const channelId = action.notification.data?.channelId;
        if (channelId) {
          window.location.href = `/channel/${channelId}`;
        }
      });

      // 7. Foreground notification received — dismiss silently
      PushNotifications.addListener('pushNotificationReceived', () => {
        // No-op: live WebSocket already shows the message in chat
      });

    } catch (e) {
      console.error('[FCM] Push notification setup error:', e);
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
