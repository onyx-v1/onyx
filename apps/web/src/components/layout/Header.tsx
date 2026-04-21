import { Pin, Bell } from 'lucide-react';
import { useChannelStore } from '../../stores/channelStore';
import { SearchPanel } from '../ui/SearchPanel';

export function Header() {
  const { channels, activeChannelId, communityName } = useChannelStore();
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <header className="app-header">
      {/* Server name */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 'var(--size-sidebar)' }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-bold text-base text-primary">{communityName}</span>
        </div>
      </div>

      {/* Channel name */}
      <div className="flex-1 flex items-center gap-2 pl-3">
        {activeChannel && (
          <>
            <span className="text-muted text-xl">
              {activeChannel.type === 'TEXT' ? '#' : '🔊'}
            </span>
            <span className="font-semibold text-base text-primary">{activeChannel.name}</span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <SearchPanel />
        <button className="btn-ghost p-2 rounded-lg" title="Pinned messages">
          <Pin size={16} className="text-muted" />
        </button>
        <button className="btn-ghost p-2 rounded-lg" title="Notifications">
          <Bell size={16} className="text-muted" />
        </button>
      </div>
    </header>
  );
}
