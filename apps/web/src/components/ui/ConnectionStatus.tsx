import { useSocketStore } from '../../stores/socketStore';
import { getSocket } from '../../hooks/useSocket';

type Status = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const STATUS_CFG: Record<Status, { color: string; label: string }> = {
  connecting:    { color: 'var(--color-warning)', label: 'Connecting…'   },
  connected:     { color: 'var(--color-online)',  label: 'Connected'     },
  reconnecting:  { color: 'var(--color-warning)', label: 'Reconnecting…' },
  disconnected:  { color: 'var(--color-danger)',  label: 'Disconnected'  },
};

export function ConnectionStatus() {
  const connectionId = useSocketStore((s) => s.connectionId);
  const socket = getSocket();

  let status: Status;
  if (!socket || (connectionId === 0 && !socket.connected)) {
    status = 'connecting';                           // never connected yet
  } else if (socket.connected) {
    status = 'connected';
  } else if (connectionId > 0) {
    status = 'reconnecting';                         // was connected before, now dropped
  } else {
    status = 'disconnected';
  }

  const cfg = STATUS_CFG[status];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 16px 8px' }}>
      <span
        style={{
          width: 6, height: 6, borderRadius: '50%',
          background: cfg.color, flexShrink: 0,
          boxShadow: status === 'connected' ? `0 0 5px ${cfg.color}` : 'none',
          transition: 'background 0.3s',
        }}
      />
      <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{cfg.label}</span>
    </div>
  );
}
