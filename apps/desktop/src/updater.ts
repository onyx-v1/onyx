/**
 * Auto-updater — checks GitHub Releases for new Electron shell versions.
 *
 * Status events are sent to the renderer via IPC so the Settings modal
 * can show accurate real-time update progress instead of guessing.
 *
 * Flow:
 *  1. App starts → checkForUpdates() (5s delay)
 *  2. User clicks "Check for updates" → triggers another checkForUpdates()
 *  3. Each state change → win.webContents.send('update-status', state)
 *  4. SettingsModal listens and renders correct UI for each state
 */

import { BrowserWindow } from 'electron';
import { autoUpdater }   from 'electron-updater';
import log               from 'electron-log';

export type UpdateState =
  | { state: 'checking' }
  | { state: 'available';     version: string }
  | { state: 'downloading';   percent: number; bytesPerSecond: number }
  | { state: 'ready';         version: string }
  | { state: 'not-available' }
  | { state: 'error';         message: string };

// Route auto-updater logs to the Electron log file
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';
autoUpdater.autoInstallOnAppQuit = true;
autoUpdater.autoDownload         = true;

function send(win: BrowserWindow, status: UpdateState): void {
  if (!win.isDestroyed()) {
    win.webContents.send('update-status', status);
  }
}

export function setupUpdater(win: BrowserWindow): void {
  autoUpdater.on('checking-for-update', () => {
    log.info('[updater] Checking…');
    send(win, { state: 'checking' });
  });

  autoUpdater.on('update-available', (info) => {
    log.info('[updater] Update available:', info.version);
    send(win, { state: 'available', version: info.version });
    // autoDownload=true means the download starts automatically after this
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[updater] Up to date.');
    send(win, { state: 'not-available' });
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    log.info(`[updater] Downloading… ${pct}%`);
    win.setProgressBar(pct / 100);
    send(win, {
      state:         'downloading',
      percent:       pct,
      bytesPerSecond: Math.round(progress.bytesPerSecond),
    });
  });

  autoUpdater.on('update-downloaded', (info) => {
    win.setProgressBar(-1);
    log.info('[updater] Downloaded:', info.version);
    send(win, { state: 'ready', version: info.version });
    // Renderer shows "Restart to update" — user clicks → IPC quit-and-install
  });

  autoUpdater.on('error', (err) => {
    log.error('[updater] Error:', err);
    win.setProgressBar(-1);

    // "Cannot find latest.yml" just means the current GitHub release has no
    // electron-builder artifacts — treat it the same as "up to date" rather
    // than surfacing a confusing error message to the user.
    if (err.message?.includes('latest.yml') || err.message?.includes('latest-mac.yml')) {
      log.info('[updater] No updater artifacts in latest release — treating as up to date.');
      send(win, { state: 'not-available' });
      return;
    }

    send(win, { state: 'error', message: err.message });
  });

  // Initial check on startup (5s delay to let window fully load)
  setTimeout(() => {
    autoUpdater.checkForUpdates().catch((err) => {
      log.warn('[updater] Could not check:', err.message);
    });
  }, 5000);
}
