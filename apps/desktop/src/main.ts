/**
 * Onyx Desktop — Electron Main Process
 *
 * Security model:
 *  - contextIsolation: true  (preload runs in isolated context)
 *  - nodeIntegration: false  (renderer never gets Node.js access)
 *  - sandbox: true           (renderer process sandboxed)
 *  - Only loads trusted HTTPS URL
 */

import {
  app, BrowserWindow, shell, Tray, Menu, nativeImage, ipcMain, Notification,
} from 'electron';
import path from 'path';
import { setupUpdater } from './updater';

// ── Set app identity BEFORE ready — fixes "electron.app.onyx" in notifications ──
app.setAppUserModelId('com.onyx.desktop');
if (!app.isPackaged) app.setName('Onyx');   // dev mode display name

// ── Resource path helper ──────────────────────────────────────────────────────
// In packaged builds, extraResources land at process.resourcesPath/resources/
// In dev, they're relative to the project root
function resourcePath(file: string): string {
  return app.isPackaged
    ? path.join(process.resourcesPath, 'resources', file)
    : path.join(__dirname, '..', 'resources', file);
}

// ── App URL ───────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pkg = require('../package.json') as { onyxAppUrl?: string };
const ONYX_APP_URL = pkg.onyxAppUrl || 'https://onyx-api0.up.railway.app';

// ── State ─────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let isQuitting = false;

// ── Single-instance lock ──────────────────────────────────────────────────────
const gotLock = app.requestSingleInstanceLock();
if (!gotLock) { app.quit(); process.exit(0); }

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.show();
    mainWindow.focus();
  }
});

// ── Create main window ────────────────────────────────────────────────────────
function createWindow(): BrowserWindow {
  const win = new BrowserWindow({
    width:     1280,
    height:    820,
    minWidth:  900,
    minHeight: 600,
    title:     'Onyx',
    icon:      resourcePath('icon.ico'),
    backgroundColor: '#181818',
    show: false,

    webPreferences: {
      preload:          path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration:  false,
      sandbox:          true,
    },
  });

  win.once('ready-to-show', () => win.show());
  win.loadURL(ONYX_APP_URL);

  if (process.env.NODE_ENV === 'development') {
    win.webContents.openDevTools();
  }

  // Navigation security
  win.webContents.on('will-navigate', (event, url) => {
    const allowed     = new URL(ONYX_APP_URL);
    const destination = new URL(url);
    if (destination.hostname !== allowed.hostname) {
      event.preventDefault();
      shell.openExternal(url);
    }
  });

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  win.on('closed', () => { mainWindow = null; });

  return win;
}

// ── System Tray ───────────────────────────────────────────────────────────────
function createTray(win: BrowserWindow): Tray {
  const iconFile = resourcePath('tray.ico');
  let icon = nativeImage.createFromPath(iconFile);

  // Fallback: if tray.ico is missing, use the app icon
  if (icon.isEmpty()) {
    icon = nativeImage.createFromPath(resourcePath('icon.ico'));
  }

  const t = new Tray(icon);
  t.setToolTip('Onyx');

  const buildMenu = () => Menu.buildFromTemplate([
    {
      label: 'Open Onyx',
      click: () => { win.show(); win.focus(); },
    },
    { type: 'separator' },
    {
      label: 'Quit Onyx',
      click: () => { isQuitting = true; app.quit(); },
    },
  ]);

  t.setContextMenu(buildMenu());

  // Single click → toggle window
  t.on('click', () => {
    if (win.isVisible() && win.isFocused()) {
      win.hide();
    } else {
      win.show();
      win.focus();
    }
  });

  // Double click → always open
  t.on('double-click', () => { win.show(); win.focus(); });

  return t;
}

// ── IPC: version ──────────────────────────────────────────────────────────────
ipcMain.on('get-version', (event) => {
  event.returnValue = app.getVersion();
});

// ── IPC: update check (manual from Settings) ─────────────────────────────────
// The real update status events are pushed from updater.ts via win.webContents.send
ipcMain.handle('check-for-updates', async () => {
  const { autoUpdater } = await import('electron-updater');
  try {
    await autoUpdater.checkForUpdates();
    return { triggered: true };
  } catch (err: any) {
    return { error: err.message };
  }
});

// ── IPC: quit and install update ─────────────────────────────────────────────
ipcMain.handle('quit-and-install', () => {
  const { autoUpdater } = require('electron-updater');
  autoUpdater.quitAndInstall();
});

// ── IPC: native push notification ─────────────────────────────────────────────
// Uses Electron's built-in Notification — appears in Windows Action Center.
// setAppUserModelId above ensures it shows "Onyx" not "electron.app.onyx".
ipcMain.handle('show-notification', (_event, opts: {
  title:     string;
  body:      string;
  channelId?: string;
}) => {
  if (!Notification.isSupported()) return;

  const notif = new Notification({
    title:  opts.title,
    body:   opts.body,
    icon:   resourcePath('icon.ico'),
    silent: false,
  });

  notif.on('click', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
      if (opts.channelId) {
        mainWindow.webContents.send('notification-clicked', opts.channelId);
      }
    }
  });

  notif.show();
});

// ── App lifecycle ─────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);

  mainWindow = createWindow();
  tray       = createTray(mainWindow);

  // Minimise to tray on close
  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow?.hide();

      // First time: notify user the app is still running
      if (tray && Notification.isSupported()) {
        const hint = new Notification({
          title: 'Onyx is still running',
          body:  'The app is minimised to the tray. Right-click the tray icon to quit.',
          icon:  resourcePath('icon.ico'),
          silent: true,
        });
        hint.show();
        // Only show this hint once
        mainWindow?.once('close', () => {});
      }
    }
  });

  setupUpdater(mainWindow);
});

// ── Quit & cleanup ────────────────────────────────────────────────────────────
app.on('before-quit', () => { isQuitting = true; });

app.on('will-quit', (event) => {
  event.preventDefault();

  if (tray && !tray.isDestroyed()) {
    tray.destroy();
    tray = null;
  }

  BrowserWindow.getAllWindows().forEach((win) => {
    if (!win.isDestroyed()) win.destroy();
  });

  app.exit(0);
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});

process.on('SIGTERM', () => app.quit());
process.on('SIGINT',  () => app.quit());
