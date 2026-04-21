import { useEffect, useState } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { useSocketStore } from '../../stores/socketStore';
import { WsEvents } from '@onyx/types';

interface Props { channelId: string; }

export function TypingIndicator({ channelId }: Props) {
  const [typers, setTypers] = useState<Array<{ id: string; displayName: string }>>([]);
  const connectionId = useSocketStore((s) => s.connectionId);

  useEffect(() => {
    // Reset typers on channel change or reconnect
    setTypers([]);

    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channelId: cId, users }: WsEvents.TypingUpdate) => {
      if (cId === channelId) setTypers(users);
    };

    socket.on('typing:update', handle);
    return () => { socket.off('typing:update', handle); };
  }, [channelId, connectionId]);

  if (typers.length === 0) return <div style={{ height: 22 }} />; // stable height placeholder

  const text =
    typers.length === 1 ? `${typers[0].displayName} is typing` :
    typers.length === 2 ? `${typers[0].displayName} and ${typers[1].displayName} are typing` :
    `${typers.length} people are typing`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 20px', height: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 4,
              height: 4,
              borderRadius: '50%',
              background: 'var(--color-muted)',
              animation: 'bounce-dot 1.2s ease-in-out infinite',
              animationDelay: `${i * 0.2}s`,
            }}
          />
        ))}
      </div>
      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{text}…</span>
    </div>
  );
}
