/**
 * Platform Bridge — Capacitor (Android) implementation
 *
 * Only imported when window.Capacitor is detected at runtime.
 * The web app never directly imports @capacitor/* — all calls go through here.
 */

import type { PlatformAPI } from './index';

const nativePlatform: PlatformAPI = {
  isNative:  true,
  isDesktop: false,

  ready: async () => {
    // Dynamically import Capacitor App plugin — waits for native bridge to be ready
    const { App } = await import('@capacitor/app');
    // Handle Android back button
    App.addListener('backButton', ({ canGoBack }) => {
      if (!canGoBack) App.exitApp();
      else window.history.back();
    });
  },
};

export default nativePlatform;
