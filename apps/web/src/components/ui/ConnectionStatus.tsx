import { Wifi, WifiOff } from 'lucide-react';
import { useSocketStore } from '../../stores/socketStore';
import { getSocket } from '../../hooks/useSocket';

type Status = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

const STATUS_CFG: Record<Status, {
  icon: 'wifi' | 'off';
  color: string;
  label: string;
  pulse: boolean;
  opacity: number;
}> = {
  connecting:   { icon: 'wifi', color: '#f59e0b', label: 'Connecting…',   pulse: true,  opacity: 0.7 },
  connected:    { icon: 'wifi', color: '#3ecf8e', label: 'Connected',      pulse: false, opacity: 1   },
  reconnecting: { icon: 'wifi', color: '#f59e0b', label: 'Reconnecting…', pulse: true,  opacity: 0.7 },
  disconnected: { icon: 'off',  color: '#f04040', label: 'Disconnected',   pulse: false, opacity: 0.85 },
};

export function ConnectionStatus() {
  const connectionId = useSocketStore((s) => s.connectionId);
  const socket = getSocket();

  let status: Status;
  if (!socket || (connectionId === 0 && !socket.connected)) {
    status = 'connecting';
  } else if (socket.connected) {
    status = 'connected';
  } else if (connectionId > 0) {
    status = 'reconnecting';
  } else {
    status = 'disconnected';
  }

  const cfg = STATUS_CFG[status];
  const Icon = cfg.icon === 'off' ? WifiOff : Wifi;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 16px 8px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        width: 18, height: 18, flexShrink: 0,
      }}>
        <Icon
          size={15}
          style={{
            color: cfg.color,
            opacity: cfg.opacity,
            transform: 'rotate(45deg)',
            transition: 'color 0.3s, opacity 0.3s',
            animation: cfg.pulse ? 'wifi-pulse 1.4s ease-in-out infinite' : 'none',
          }}
        />
      </div>
      <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{cfg.label}</span>
    </div>
  );
}
