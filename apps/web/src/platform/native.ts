/**
 * Platform Bridge — Capacitor (Android) implementation
 */

import type { PlatformAPI } from './index';

const nativePlatform: PlatformAPI = {
  isNative:  true,
  isDesktop: false,

  ready: async () => {
    const { App } = await import('@capacitor/app');
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) App.exitApp();
      else window.history.back();
    });
  },

  // Android push notifications — Phase 2 (FCM integration)
  // For now the web app's mention toasts handle in-app alerts on Android
  showNotification: () => {},
  onNotificationClick: () => {},
};

export default nativePlatform;
