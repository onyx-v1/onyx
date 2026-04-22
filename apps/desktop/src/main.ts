/**
 * Onyx Desktop — Electron Main Process
 *
 * Responsibilities:
 *  - Create and manage the BrowserWindow
 *  - Enforce single-instance lock
 *  - System tray icon
 *  - Route app lifecycle events
 *  - Delegate auto-updates to updater.ts
 *
 * Security model:
 *  - contextIsolation: true  (preload runs in isolated context)
 *  - nodeIntegration: false  (renderer never gets Node.js access)
 *  - sandbox: true           (renderer process sandboxed)
 *  - Only loads trusted HTTPS URL — no local file loading
 */

import {
  app, BrowserWindow, shell, Tray, Menu, nativeImage, ipcMain,
} from 'electron';
import path from 'path';
import { setupUpdater } from './updater';

// ── App URL ──────────────────────────────────────────────────────────────────
// URL is embedded into package.json at build time by electron-builder
// via the `extraMetadata.onyxAppUrl` field in electron-builder.config.js.
// Falls back to the real production URL if somehow missing.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { onyxAppUrl?: string };
const ONYX_APP_URL = pkg.onyxAppUrl || 'https://onyx-api0.up.railway.app';

// ── State ────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;           // track intentional quit vs close-to-tray

// ── Single-instance lock ─────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  // Another instance already running — focus it and quit this one
  app.quit();
  process.exit(0);
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
});

// ── Create main window ───────────────────────────────────────────────────────
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width:    1280,
    height:   820,
    minWidth: 900,
    minHeight: 600,
    title: 'Onyx',
    backgroundColor: '#181818',     // matches --color-base, prevents white flash
    show: false,                     // show after ready-to-show for clean load

    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
      // Security: only allow navigation to the Onyx domain
      // Enforced via will-navigate below
    },
  });

  // Show window only once content is ready — eliminates white flash
  win.once('ready-to-show', () => win.show());

  // Load the live Onyx web app
  win.loadURL(ONYX_APP_URL);

  // Open DevTools in development
  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // ── Navigation security ────────────────────────────────────────────────────
  // Prevent the window from navigating to untrusted URLs
  win.webContents.on('will-navigate', (event, url) => {
    const allowed = new URL(ONYX_APP_URL);
    const destination = new URL(url);
    if (destination.hostname !== allowed.hostname) {
      event.preventDefault();
      // Open external links (e.g. OAuth) in the system browser
      shell.openExternal(url);
    }
  });

  // Open new windows (target="_blank") in system browser
  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Track window state
  win.on('closed', () => { mainWindow = null; });

  return win;
}

// ── Tray icon ────────────────────────────────────────────────────────────────
function createTray(win: BrowserWindow): Tray {
  const iconPath = path.join(__dirname, '..', 'resources', 'tray.ico');
  const icon = nativeImage.createFromPath(iconPath);
  const t = new Tray(icon.isEmpty() ? nativeImage.createEmpty() : icon);

  t.setToolTip('Onyx');
  t.setContextMenu(
    Menu.buildFromTemplate([
      { label: 'Open Onyx',  click: () => { win.show(); win.focus(); } },
      { type: 'separator' },
      { label: 'Quit',       click: () => app.quit() },
    ]),
  );

  // Click tray icon → toggle window
  t.on('click', () => {
    if (win.isVisible()) { win.hide(); } else { win.show(); win.focus(); }
  });

  return t;
}

// ── IPC handlers ─────────────────────────────────────────────────────────────
// Return app version to the renderer (preload reads this synchronously)
ipcMain.on('get-version', (event) => {
  event.returnValue = app.getVersion();
});

// Trigger manual update check from the renderer (Settings → Check for updates)
ipcMain.handle('check-for-updates', async () => {
  const { autoUpdater } = await import('electron-updater');
  try {
    await autoUpdater.checkForUpdatesAndNotify();
    return { checking: true };
  } catch (err: any) {
    return { error: err.message };
  }
});

// ── Native push notifications ─────────────────────────────────────────────────
// Called by the renderer whenever a mention/message arrives while unfocused.
// Uses Electron's built-in Notification (no extra deps, uses Windows Action Center).
ipcMain.handle('show-notification', (_event, opts: {
  title: string;
  body: string;
  channelId?: string;
}) => {
  const { Notification } = require('electron');
  if (!Notification.isSupported()) return;

  const notif = new Notification({
    title:  opts.title,
    body:   opts.body,
    icon:   path.join(__dirname, '..', 'resources', 'icon.ico'),
    silent: false,
  });

  notif.on('click', () => {
    // Bring window to front
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      // Tell the renderer to navigate to the channel that was mentioned
      if (opts.channelId) {
        mainWindow.webContents.send('notification-clicked', opts.channelId);
      }
    }
  });

  notif.show();
});

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  // Remove default menu bar (File / Edit / View / Window / Help)
  Menu.setApplicationMenu(null);

  mainWindow = createWindow();
  tray = createTray(mainWindow);

  // Minimise to tray on close — quit only when explicitly requested
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Setup auto-updater (checks on startup)
  setupUpdater(mainWindow);
});

// ── Quit & cleanup ────────────────────────────────────────────────────────────
// Step 1: mark quitting so the close handler lets the window close
app.on('before-quit', () => {
  isQuitting = true;
});

// Step 2: destroy tray icon + force-exit once all windows are closed
// This is the definitive cleanup — no ghost process can survive past here
app.on('will-quit', (event) => {
  event.preventDefault(); // hold the quit so we can clean up synchronously

  // Destroy system tray icon (removes it from the taskbar immediately)
  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }

  // Destroy all windows
  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.destroy();
  });

  // Force terminate — guarantees no ghost process
  app.exit(0);
});

// macOS: re-create window when clicking dock icon
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

// Handle OS-level kill signals (Task Manager, uninstaller, etc.)
// Ensures the process exits cleanly when terminated externally
process.on('SIGTERM', () => app.quit());
process.on('SIGINT',  () => app.quit());

