import { Hash, Volume2 } from 'lucide-react';
import { Channel } from '@onyx/types';
import { useChannelStore } from '../../stores/channelStore';

interface Props {
  channel: Channel;
  isActive: boolean;
  onClick: () => void;
}

export function ChannelItem({ channel, isActive, onClick }: Props) {
  const unread = useChannelStore((s) => s.unreadChannels.has(channel.id));

  return (
    <button
      onClick={onClick}
      className={`channel-item w-full ${isActive ? 'active' : ''} ${unread && !isActive ? 'has-unread' : ''}`}
    >
      {/* Active indicator */}
      {isActive && (
        <div className="absolute left-0 w-0.5 h-4 bg-accent rounded-r" />
      )}

      {channel.type === 'TEXT' ? (
        <Hash size={14} className="flex-shrink-0" />
      ) : (
        <Volume2 size={14} className="flex-shrink-0" />
      )}

      <span className="truncate">{channel.name}</span>

      {unread && !isActive && (
        <div className="ml-auto w-2 h-2 rounded-full bg-accent flex-shrink-0" />
      )}
    </button>
  );
}
