/**
 * Platform Bridge — web/desktop implementation
 *
 * Runs in both the browser AND the Electron shell (which loads the live web app).
 * Detects Electron via window.__onyx and delegates to native IPC where available,
 * falling back to the browser Notification API otherwise.
 */

import type { PlatformAPI, NotificationOptions } from './index';

const electron = typeof window !== 'undefined'
  ? (window as any).__onyx as {
      platform: 'electron';
      version: string;
      checkForUpdates: () => Promise<unknown>;
      showNotification: (opts: NotificationOptions) => Promise<void>;
      onNotificationClick: (cb: (channelId: string) => void) => void;
    } | undefined
  : undefined;

const isDesktop = !!electron;

// ── Notification helpers ──────────────────────────────────────────────────────
async function requestBrowserPermission(): Promise<boolean> {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied') return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

const webPlatform: PlatformAPI = {
  isNative:  false,
  isDesktop,

  ready: () => Promise.resolve(),

  // Show a notification:
  //  • Electron  → native Windows Action Center toast via IPC
  //  • Browser   → Web Notifications API (requests permission on first call)
  showNotification: async (opts: NotificationOptions) => {
    if (electron?.showNotification) {
      // Electron path — zero-permission, always works when installed
      await electron.showNotification(opts);
      return;
    }
    // Browser fallback
    const permitted = await requestBrowserPermission();
    if (!permitted) return;
    const notif = new Notification(opts.title, { body: opts.body });
    // Browser notifications don't support channelId navigation (no IPC)
    notif.onclick = () => { window.focus(); };
  },

  // Called once at app startup to wire up the click→navigate handler.
  // Only meaningful in Electron; noop in browser.
  onNotificationClick: (cb: (channelId: string) => void) => {
    electron?.onNotificationClick?.(cb);
  },
};

export default webPlatform;
