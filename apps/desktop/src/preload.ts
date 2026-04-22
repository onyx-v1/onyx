/**
 * Preload script — runs in an isolated context between main and renderer.
 *
 * Rules:
 *  - Only expose the minimal API surface the web app actually needs
 *  - Never expose raw Node.js / Electron modules to the renderer
 *  - Use contextBridge to whitelist specific capabilities
 *
 * Current exposed API: window controls only.
 * Extend here if the web app needs native features (notifications, file paths, etc.)
 */

import { contextBridge, ipcRenderer } from 'electron';

// Expose a minimal, typed API to the renderer under window.__onyx
contextBridge.exposeInMainWorld('__onyx', {
  /** Platform identifier — lets the web app know it's running inside Electron */
  platform: 'electron' as const,

  /** App version — useful for displaying in settings */
  version: process.env.npm_package_version ?? '1.0.0',
});

// Type declaration for renderer consumption (copy to apps/web/src/types/electron.d.ts)
// declare global {
//   interface Window {
//     __onyx: {
//       platform: 'electron';
//       version: string;
//     };
//   }
// }
