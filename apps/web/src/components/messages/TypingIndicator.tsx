import { useEffect, useState } from 'react';
import { getSocket } from '../../hooks/useSocket';
import { WsEvents } from '@onyx/types';

interface Props { channelId: string; }

export function TypingIndicator({ channelId }: Props) {
  const [typers, setTypers] = useState<Array<{ id: string; displayName: string }>>([]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channelId: cId, users }: WsEvents.TypingUpdate) => {
      if (cId === channelId) setTypers(users);
    };

    socket.on('typing:update', handle);
    return () => { socket.off('typing:update', handle); };
  }, [channelId]);

  if (typers.length === 0) return null;

  const text =
    typers.length === 1
      ? `${typers[0].displayName} is typing`
      : typers.length === 2
      ? `${typers[0].displayName} and ${typers[1].displayName} are typing`
      : `${typers.length} people are typing`;

  return (
    <div className="flex items-center gap-2 px-6 py-1 h-6">
      <div className="flex items-center gap-0.5">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1 h-1 rounded-full bg-muted animate-bounce-dot"
            style={{ animationDelay: `${i * 0.16}s` }}
          />
        ))}
      </div>
      <span className="text-xs text-muted">{text}...</span>
    </div>
  );
}
