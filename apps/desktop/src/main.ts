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
  app, BrowserWindow, shell, Tray, Menu, nativeImage,
} from 'electron';
import path from 'path';
import { setupUpdater } from './updater';

// ── App URL ──────────────────────────────────────────────────────────────────
// Change ONYX_APP_URL env var at build time to point to your live deployment.
// Example: ONYX_APP_URL=https://onyx.up.railway.app npm run dist
const ONYX_APP_URL =
  process.env.ONYX_APP_URL ||
  'https://onyx.yourdomain.com'; // ← replace with your live URL

// ── State ────────────────────────────────────────────────────────────────────
let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;

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

// ── App lifecycle ────────────────────────────────────────────────────────────
app.whenReady().then(() => {
  mainWindow = createWindow();
  tray = createTray(mainWindow);

  // Minimise to tray on close (Windows behaviour)
  mainWindow.on('close', (event) => {
    if (!app.isQuitting) {
      event.preventDefault();
      mainWindow?.hide();
    }
  });

  // Setup auto-updater (checks on startup)
  setupUpdater(mainWindow);
});

// Mark quit flag so the close handler above allows it
app.on('before-quit', () => { (app as any).isQuitting = true; });

// macOS: re-create window when clicking dock icon (not needed for Win-only,
// kept for forward-compatibility)
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    mainWindow = createWindow();
  }
});
