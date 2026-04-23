/**
 * Platform Bridge — Capacitor (Android) implementation
 */

import type { PlatformAPI } from './index';

const nativePlatform: PlatformAPI = {
  isNative:  true,
  isDesktop: false,

  ready: async () => {
    // ── Back button ───────────────────────────────────────────────
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) App.exitApp();
      else window.history.back();
    });

    // ── Edge-to-edge status bar ───────────────────────────────────
    // Renders the WebView under the system status bar so the app
    // feels like a native full-screen Android app.
    // CSS uses env(safe-area-inset-top) to pad content away from the notch.
    try {
      const { StatusBar, Style } = await import('@capacitor/status-bar');
      await StatusBar.setOverlaysWebView({ overlay: true });
      await StatusBar.setStyle({ style: Style.Dark });         // white icons on dark bg
      await StatusBar.setBackgroundColor({ color: '#00000000' }); // transparent
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
