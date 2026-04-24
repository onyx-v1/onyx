import { useEffect, useState, useCallback } from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

/**
 * NetworkOverlay — mid-session offline detection.
 *
 * Listens to the browser's online/offline events.
 * When the device goes offline while the app is running, shows a
 * full-screen overlay that auto-dismisses when the connection returns.
 *
 * This is SEPARATE from the cold-start offline page (offline.html / Capacitor errorPath).
 */
export function NetworkOverlay() {
  const [isOffline, setIsOffline]   = useState(!navigator.onLine);
  const [retrying,  setRetrying]    = useState(false);

  useEffect(() => {
    const goOffline = () => setIsOffline(true);
    const goOnline  = () => setIsOffline(false);

    window.addEventListener('offline', goOffline);
    window.addEventListener('online',  goOnline);
    return () => {
      window.removeEventListener('offline', goOffline);
      window.removeEventListener('online',  goOnline);
    };
  }, []);

  const handleRetry = useCallback(async () => {
    setRetrying(true);
    try {
      await fetch('https://onyx-api0.up.railway.app/health', {
        method: 'HEAD',
        cache: 'no-store',
        signal: AbortSignal.timeout(5000),
      });
      setIsOffline(false);
    } catch {
      /* still offline — keep showing overlay */
    } finally {
      setRetrying(false);
    }
  }, []);

  if (!isOffline) return null;

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.92)',
      backdropFilter: 'blur(12px)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      gap: 0,
      animation: 'fade-in 0.2s ease-out',
      paddingTop: 'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>

      {/* Icon */}
      <div style={{
        width: 68, height: 68, borderRadius: 22,
        background: 'rgba(240,64,64,0.10)',
        border: '1px solid rgba(240,64,64,0.2)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        marginBottom: 24,
      }}>
        <WifiOff size={28} style={{ color: '#f04040' }} />
      </div>

      {/* Text */}
      <h2 style={{
        fontSize: 20, fontWeight: 700,
        color: '#fff', margin: '0 0 8px',
        letterSpacing: '-0.02em',
      }}>
        No Connection
      </h2>
      <p style={{
        fontSize: 14, color: '#606060',
        margin: '0 0 36px',
        textAlign: 'center',
        maxWidth: 240,
        lineHeight: 1.6,
      }}>
        Check your internet and try again.
      </p>

      {/* Retry button */}
      <button
        onClick={handleRetry}
        disabled={retrying}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '13px 28px',
          background: retrying ? 'rgba(255,255,255,0.06)' : 'var(--color-accent)',
          color: '#fff',
          border: 'none', borderRadius: 14,
          fontSize: 15, fontWeight: 600,
          fontFamily: 'inherit',
          cursor: retrying ? 'default' : 'pointer',
          transition: 'background 0.15s, transform 0.1s',
          WebkitTapHighlightColor: 'transparent',
        } as React.CSSProperties}
      >
        <RefreshCw
          size={16}
          style={{ animation: retrying ? 'spin 1s linear infinite' : 'none' }}
        />
        {retrying ? 'Checking…' : 'Retry'}
      </button>
    </div>
  );
}
