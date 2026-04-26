import { useEffect, useState } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { useSocketStore } from '../../stores/socketStore';
import { useAuthStore } from '../../stores/authStore';
import { WsEvents } from '@onyx/types';

interface Props { channelId: string; }

export function TypingIndicator({ channelId }: Props) {
  const [typers, setTypers] = useState<Array<{ id: string; displayName: string }>>([]);
  const connectionId = useSocketStore((s) => s.connectionId);
  const currentUserId = useAuthStore((s) => s.user?.id);

  useEffect(() => {
    setTypers([]);

    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channelId: cId, users }: WsEvents.TypingUpdate) => {
      if (cId !== channelId) return;
      // Filter out the current user — you don't see your own typing indicator
      setTypers(users.filter((u) => u.id !== currentUserId));
    };

    socket.on('typing:update', handle);
    return () => { socket.off('typing:update', handle); };
  }, [channelId, connectionId, currentUserId]);

  if (typers.length === 0) return <div style={{ height: 22 }} />;

  const text =
    typers.length === 1 ? `${typers[0].displayName} is typing` :
    typers.length === 2 ? `${typers[0].displayName} and ${typers[1].displayName} are typing` :
    `${typers[0].displayName} and ${typers.length - 1} others are typing`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '2px 20px', height: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            style={{
              display: 'inline-block',
              width: 5,
              height: 5,
              borderRadius: '50%',
              background: 'var(--color-accent)',
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
