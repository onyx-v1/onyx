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
    oneClick: true,   // silent install, no wizard screens
    perMachine: false,  // user-level install (no admin required)
    allowToChangeInstallationDirectory: false,
    deleteAppDataOnUninstall: false,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Onyx',
  },

  // ── Auto-update via GitHub Releases ────────────────────────────────
  publish: {
    provider: 'github',
    owner: 'onyx-v1',
    repo: 'onyx',
    private: false,
  },
};
