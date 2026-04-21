import { useState, useEffect } from 'react';
import { getSocket } from '../../hooks/useSocket';

type Status = 'connected' | 'reconnecting' | 'disconnected';

export function ConnectionStatus() {
  const [status, setStatus] = useState<Status>('disconnected');

  useEffect(() => {
    const check = () => {
      const s = getSocket();
      if (!s) { setStatus('disconnected'); return; }
      if (s.connected) { setStatus('connected'); return; }
      setStatus('reconnecting');
    };

    // Poll every 2s for status changes
    check();
    const interval = setInterval(check, 2000);

    // Also react to socket events directly
    const socket = getSocket();
    if (socket) {
      socket.on('connect',    () => setStatus('connected'));
      socket.on('disconnect', () => setStatus('disconnected'));
      socket.on('reconnecting', () => setStatus('reconnecting'));
    }

    return () => {
      clearInterval(interval);
      const s = getSocket();
      if (s) {
        s.off('connect');
        s.off('disconnect');
        s.off('reconnecting');
      }
    };
  }, []);

  const config = {
    connected:    { color: 'var(--color-online)',  label: 'Connected',    animate: false },
    reconnecting: { color: 'var(--color-warning)', label: 'Reconnecting…', animate: true  },
    disconnected: { color: 'var(--color-danger)',  label: 'Disconnected', animate: false },
  }[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px 8px' }}>
      <span
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          background: config.color,
          flexShrink: 0,
          boxShadow: config.animate ? `0 0 6px ${config.color}` : 'none',
          animation: config.animate ? 'pulse-ring 1.2s ease-in-out infinite' : 'none',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
        {config.label}
      </span>
    </div>
  );
}
