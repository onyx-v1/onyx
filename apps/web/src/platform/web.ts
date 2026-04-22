/**
 * Platform Bridge — web/desktop implementation
 */

import type { PlatformAPI, NotificationOptions } from './index';

type UpdateState =
  | { state: 'checking' }
  | { state: 'available';    version: string }
  | { state: 'downloading';  percent: number; bytesPerSecond: number }
  | { state: 'ready';        version: string }
  | { state: 'not-available' }
  | { state: 'error';        message: string };

const electron = typeof window !== 'undefined'
  ? (window as any).__onyx as {
      platform:           'electron';
      version:            string;
      checkForUpdates:    () => Promise<unknown>;
      onUpdateStatus:     (cb: (s: UpdateState) => void) => void;
      quitAndInstall:     () => void;
      showNotification:   (opts: NotificationOptions) => Promise<void>;
      onNotificationClick:(cb: (channelId: string) => void) => void;
    } | undefined
  : undefined;

const isDesktop = !!electron;

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

  showNotification: async (opts: NotificationOptions) => {
    if (electron?.showNotification) {
      await electron.showNotification(opts);
      return;
    }
    const permitted = await requestBrowserPermission();
    if (!permitted) return;
    const notif = new Notification(opts.title, { body: opts.body });
    notif.onclick = () => window.focus();
  },

  onNotificationClick: (cb: (channelId: string) => void) => {
    electron?.onNotificationClick?.(cb);
  },

  // Update methods — only meaningful in Electron
  checkForUpdates:  () => electron?.checkForUpdates?.(),
  onUpdateStatus:   (cb) => electron?.onUpdateStatus?.(cb),
  quitAndInstall:   () => electron?.quitAndInstall?.(),
};

export default webPlatform;
