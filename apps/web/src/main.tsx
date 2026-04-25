import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { platform } from './platform';
import { initTheme } from './stores/themeStore';

// Apply the persisted theme before React mounts — prevents flash-of-wrong-theme
initTheme();

// Wait for the native bridge (Capacitor) to be ready before mounting.
// On web/Electron this resolves immediately.
platform.ready()
  .catch((err) => console.error('[Platform] ready() failed:', err))
  .finally(() => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    );
  });
