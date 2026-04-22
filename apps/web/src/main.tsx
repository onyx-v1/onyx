import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import { platform } from './platform';

// Wait for the native bridge (Capacitor) to be ready before mounting.
// On web/Electron this resolves immediately.
platform.ready().then(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );
});
