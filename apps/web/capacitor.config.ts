import type { CapacitorConfig } from '@capacitor/cli';

/**
 * Capacitor configuration for the Onyx Android app.
 *
 * Strategy: server URL mode — the Android app loads the live hosted URL
 * instead of bundled static files. This means:
 *  - App always shows the latest version (no APK rebuild needed for web updates)
 *  - Smaller APK size (no bundled web assets)
 *  - Requires internet connection (expected for a chat app)
 *
 * To change the live URL, update server.url below and run:
 *   npx cap sync android
 */

const config: CapacitorConfig = {
  appId:   'com.onyx.app',
  appName: 'Onyx',
  webDir:  'dist',       // fallback web assets (used for local file loading if server.url is removed)

  server: {
    // ── Production URL — always points to the live Railway backend ────
    url:           'https://onyx-api0.up.railway.app',
    cleartext:     false,        // HTTPS enforced
    androidScheme: 'https',
  },

  android: {
    // Matches the OLED dark mode of the web app
    backgroundColor: '#181818',
  },

  plugins: {
    SplashScreen: {
      launchShowDuration:    2000,
      launchAutoHide:        true,
      backgroundColor:       '#181818',
      androidScaleType:      'CENTER_CROP',
      showSpinner:           false,
    },
    StatusBar: {
      style:           'DARK',
      backgroundColor: '#181818',
    },
  },
};

export default config;
