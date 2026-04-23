import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Onyx Android app.
 *
 * Strategy: server URL mode — always loads the live Railway URL.
 *  - App reflects the latest version without rebuilding the APK
 *  - Smaller APK (no bundled web assets)
 *  - Requires internet connection (expected for a chat app)
 */

const config: CapacitorConfig = {
  appId:   'com.onyx.app',
  appName: 'Onyx',
  webDir:  'dist',

  server: {
    url:           'https://onyx-api0.up.railway.app',
    cleartext:     false,
    androidScheme: 'https',
  },

  android: {
    backgroundColor: '#0f0f0f',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration: 1800,
      launchAutoHide:     true,
      backgroundColor:    '#0f0f0f',
      androidScaleType:   'CENTER_CROP',
      showSpinner:        false,
    },

    // ── Status bar — overlay mode for edge-to-edge native feel ──────
    // The WebView renders UNDER the status bar.
    // Safe areas are respected via env(safe-area-inset-top) in CSS.
    StatusBar: {
      style:            'DARK',
      backgroundColor:  '#00000000',   // fully transparent
      overlaysWebView:  true,          // edge-to-edge: content renders behind status bar
    },
  },
};

export default config;
