import { useSocketStore } from '../../stores/socketStore';
import { getSocket } from '../../hooks/useSocket';

export function ConnectionStatus() {
  // connectionId changes on every connect → component re-renders reactively
  const connectionId = useSocketStore((s) => s.connectionId);

  const socket = getSocket();
  const isConnected    = connectionId > 0 && socket?.connected === true;
  const isReconnecting = connectionId === 0 || socket?.disconnected === true;

  const status = isConnected ? 'connected' : isReconnecting ? 'reconnecting' : 'disconnected';

  const cfg = {
    connected:    { color: 'var(--color-online)',  label: 'Connected'    },
    reconnecting: { color: 'var(--color-warning)', label: 'Reconnecting…' },
    disconnected: { color: 'var(--color-danger)',  label: 'Disconnected' },
  }[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 8px' }}>
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: cfg.color,
          flexShrink: 0,
          boxShadow: status === 'connected' ? `0 0 5px ${cfg.color}` : 'none',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{cfg.label}</span>
    </div>
  );
}
