import { Plus } from 'lucide-react';
import { Channel } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { ChannelItem } from './ChannelItem';

interface Props {
  label: string;
  channels: Channel[];
  activeId: string | null;
  onChannelClick: (id: string) => void;
  onAddChannel?: () => void;
}

export function ChannelSection({ label, channels, activeId, onChannelClick, onAddChannel }: Props) {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="mb-4">
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[10px] font-semibold text-subtle uppercase tracking-wider">{label}</span>
        {user?.role === 'ADMIN' && (
          <button
            onClick={onAddChannel}
            className="text-subtle hover:text-primary transition-colors rounded p-0.5"
            title={`Add ${label}`}
          >
            <Plus size={12} />
          </button>
        )}
      </div>

      {channels.length === 0 && (
        <p className="px-2 text-xs text-subtle italic">No channels yet</p>
      )}

      {channels.map((channel) => (
        <ChannelItem
          key={channel.id}
          channel={channel}
          isActive={channel.id === activeId}
          onClick={() => onChannelClick(channel.id)}
        />
      ))}
    </div>
  );
}
