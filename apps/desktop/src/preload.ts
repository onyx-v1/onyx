/**
 * Preload — minimal, typed bridge between main process and renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';
import type { UpdateState } from './updater';

contextBridge.exposeInMainWorld('__onyx', {
  platform: 'electron' as const,

  version: (() => {
    try { return ipcRenderer.sendSync('get-version') as string; }
    catch { return '1.1.0'; }
  })(),

  // Trigger a manual update check (Settings button)
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Subscribe to real-time update status events from main process
  onUpdateStatus: (cb: (status: UpdateState) => void) => {
    ipcRenderer.on('update-status', (_event, status: UpdateState) => cb(status));
  },

  // Quit and install downloaded update
  quitAndInstall: () => ipcRenderer.invoke('quit-and-install'),

  // Show a native Windows notification
  showNotification: (opts: { title: string; body: string; channelId?: string }) =>
    ipcRenderer.invoke('show-notification', opts),

  // Subscribe to notification clicks (user clicked a toast → navigate to channel)
  onNotificationClick: (cb: (channelId: string) => void) => {
    ipcRenderer.on('notification-clicked', (_event, channelId: string) => cb(channelId));
  },
});
