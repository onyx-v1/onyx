/**
 * Preload — minimal, typed bridge between main process and renderer.
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('__onyx', {
  platform: 'electron' as const,

  // App version from main process (reliable in packaged builds)
  version: (() => {
    try { return ipcRenderer.sendSync('get-version') as string; }
    catch { return '1.1.0'; }
  })(),

  // Trigger update check
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),

  // Show a native Windows notification from the renderer
  // Returns a promise — resolves once shown, rejects on error
  showNotification: (opts: { title: string; body: string; channelId?: string }) =>
    ipcRenderer.invoke('show-notification', opts),

  // Subscribe to notification-click events (user clicks a toast → navigate to channel)
  onNotificationClick: (cb: (channelId: string) => void) => {
    ipcRenderer.on('notification-clicked', (_event, channelId: string) => cb(channelId));
  },
});
