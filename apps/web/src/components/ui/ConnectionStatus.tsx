import { useSocketStore } from '../../stores/socketStore';
import { getSocket } from '../../hooks/useSocket';

type Status = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

// WiFi SVG: 3 arcs + dot. Pass `bars` (0–3) to light up levels.
function WifiIcon({ bars, color, pulse }: { bars: number; color: string; pulse?: boolean }) {
  const baseOpacity = 0.18;

  return (
    <svg
      width="18"
      height="14"
      viewBox="0 0 24 18"
      fill="none"
      style={{
        flexShrink: 0,
        animation: pulse ? 'wifi-pulse 1.4s ease-in-out infinite' : 'none',
      }}
    >
      {/* Outer arc — bar 3 */}
      <path
        d="M1.5 7C5.5 2.5 18.5 2.5 22.5 7"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={bars >= 3 ? 1 : baseOpacity}
      />
      {/* Middle arc — bar 2 */}
      <path
        d="M5 10.5C7.8 7.2 16.2 7.2 19 10.5"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={bars >= 2 ? 1 : baseOpacity}
      />
      {/* Inner arc — bar 1 */}
      <path
        d="M8.5 14C9.8 12.2 14.2 12.2 15.5 14"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        opacity={bars >= 1 ? 1 : baseOpacity}
      />
      {/* Center dot */}
      <circle
        cx="12"
        cy="17"
        r="1.4"
        fill={color}
        opacity={bars >= 1 ? 1 : baseOpacity}
      />
    </svg>
  );
}

const STATUS_CFG: Record<Status, { bars: number; color: string; label: string; pulse: boolean }> = {
  connecting:   { bars: 1, color: '#f59e0b', label: 'Connecting…',  pulse: true  },
  connected:    { bars: 3, color: '#3ecf8e', label: 'Connected',    pulse: false },
  reconnecting: { bars: 1, color: '#f59e0b', label: 'Reconnecting…', pulse: true },
  disconnected: { bars: 0, color: '#f04040', label: 'Disconnected', pulse: false },
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

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '4px 16px 8px' }}>
      <WifiIcon bars={cfg.bars} color={cfg.color} pulse={cfg.pulse} />
      <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>{cfg.label}</span>
    </div>
  );
}
