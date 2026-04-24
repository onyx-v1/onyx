/**
 * Platform Bridge — Capacitor (Android) implementation
 */

import type { PlatformAPI } from './index';

const nativePlatform: PlatformAPI = {
  isNative:  true,
  isDesktop: false,

  ready: async () => {
    // ── Re-apply persisted theme immediately ──────────────────────
    // Belt-and-suspenders: initTheme() already ran in main.tsx but
    // calling it again after the bridge is ready guarantees the correct
    // data-theme attribute is on <html> before React renders anything.
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
  },

  // Notifications — Phase 2 (FCM)
  showNotification:    () => {},
  onNotificationClick: () => {},

  // Updates not applicable on Android
  checkForUpdates: undefined,
  onUpdateStatus:  undefined,
  quitAndInstall:  undefined,
};

export default nativePlatform;
