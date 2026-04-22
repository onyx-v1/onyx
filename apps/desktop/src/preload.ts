/**
 * Preload script — runs in an isolated context between main and renderer.
 *
 * Rules:
 *  - Only expose the minimal API surface the web app actually needs
 *  - Never expose raw Node.js / Electron modules to the renderer
 *  - Use contextBridge to whitelist specific capabilities
 */

import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('__onyx', {
  /** Platform identifier */
  platform: 'electron' as const,

  /** App version — read from main process (reliable in packaged builds) */
  version: (() => {
    try {
      // sendSync is safe here — it's just reading a string
      return ipcRenderer.sendSync('get-version') as string;
    } catch {
      return '1.0.0';
    }
  })(),

  /** Trigger update check — main process runs electron-updater */
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
});
