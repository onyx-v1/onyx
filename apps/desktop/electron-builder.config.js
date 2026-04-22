/**
 * electron-builder configuration
 *
 * Docs: https://www.electron.build/configuration/configuration
 */

/** @type {import('electron-builder').Configuration} */
module.exports = {
  appId: 'com.onyx.desktop',
  electronVersion: '29.4.6',   // pinned — must match devDependencies
  productName: 'Onyx',

  // ── Directories ────────────────────────────────────────────────────
  extraMetadata: {
    onyxAppUrl: process.env.ONYX_APP_URL || 'https://onyx-api0.up.railway.app',
  },

  // ── Runtime resources (tray icon, notification icon) ───────────────
  // Copies resources/ → process.resourcesPath/resources/ in the packaged app
  // Access at runtime via: path.join(process.resourcesPath, 'resources', 'icon.ico')
  extraResources: [
    { from: 'resources/', to: 'resources/' },
  ],

  directories: {
    output: 'release',        // built installer lands here
    buildResources: 'resources', // icons etc.
  },
  files: [
    'dist/**/*',                 // compiled TS → JS
    '!dist/**/*.map',            // exclude source maps from installer
    'node_modules/**/*',
    'package.json',
  ],

  // ── Windows ────────────────────────────────────────────────────────
  win: {
    target: [
      {
        target: 'nsis',          // Standard Windows installer (.exe)
        arch: ['x64'],
      },
    ],
    icon: 'resources/icon.ico',
    requestedExecutionLevel: 'asInvoker',   // no UAC prompt
    artifactName: 'Onyx-Setup.exe',         // fixed name — no version/spaces
  },

  // ── NSIS installer options ──────────────────────────────────────────
  nsis: {
    oneClick:              true,
    perMachine:            false,
    allowElevation:        true,   // allows installer to elevate and kill processes
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName:          'Onyx',
    warningsAsErrors:      false,
    // Custom script: kills all Onyx processes before install/uninstall
    // Prevents "please close the app" prompts and ghost processes
    include: 'scripts/custom-nsis.nsi',
  },

  // ── Auto-update via GitHub Releases ────────────────────────────────
  publish: {
    provider: 'github',
    owner: 'onyx-v1',
    repo: 'onyx',
    private: false,
  },
};
