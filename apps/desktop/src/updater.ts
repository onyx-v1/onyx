/**
 * Auto-updater — checks GitHub Releases for new Electron versions.
 *
 * The web app itself never needs updating (it loads from the live server).
 * This only updates the Electron shell when a new version is released.
 *
 * Flow:
 *  1. App starts → checkForUpdatesAndNotify()
 *  2. If update available → downloads silently in background
 *  3. On next app restart → installs update automatically
 */

import { BrowserWindow, dialog } from 'electron';
import { autoUpdater }           from 'electron-updater';
import log                       from 'electron-log';

// Route auto-updater logs to the Electron log file
autoUpdater.logger = log;
(autoUpdater.logger as any).transports.file.level = 'info';

// Do not auto-install — let user decide when to restart
autoUpdater.autoInstallOnAppQuit = true;

export function setupUpdater(win: BrowserWindow): void {
  // ── Events ──────────────────────────────────────────────────────────
  autoUpdater.on('checking-for-update', () => {
    log.info('[updater] Checking for update…');
  });

  autoUpdater.on('update-available', (info) => {
    log.info('[updater] Update available:', info.version);
    // Silently download — no user prompt needed
  });

  autoUpdater.on('update-not-available', () => {
    log.info('[updater] Already on latest version.');
  });

  autoUpdater.on('download-progress', (progress) => {
    const pct = Math.round(progress.percent);
    log.info(`[updater] Downloading… ${pct}%`);
    win.setProgressBar(pct / 100);
  });

  autoUpdater.on('update-downloaded', (info) => {
    win.setProgressBar(-1); // clear progress bar
    log.info('[updater] Update downloaded:', info.version);

    // Prompt user: restart now or later
    dialog.showMessageBox(win, {
      type:    'info',
      title:   'Update Ready',
      message: `Onyx ${info.version} is ready to install.`,
      detail:  'Restart now to apply the update, or it will install automatically on next launch.',
      buttons: ['Restart Now', 'Later'],
      defaultId: 0,
    }).then(({ response }) => {
      if (response === 0) autoUpdater.quitAndInstall();
    });
  });

  autoUpdater.on('error', (err) => {
    log.error('[updater] Error:', err);
  });

  // ── Trigger check ────────────────────────────────────────────────────
  // Delay slightly to let the window fully load before checking
  setTimeout(() => {
    autoUpdater.checkForUpdatesAndNotify().catch((err) => {
      log.warn('[updater] Could not check for updates:', err.message);
    });
  }, 5000);
}
