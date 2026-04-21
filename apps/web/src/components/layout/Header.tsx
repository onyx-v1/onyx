import { Search, Pin, Bell } from 'lucide-react';
import { useChannelStore } from '../../stores/channelStore';

export function Header() {
  const { channels, activeChannelId, communityName } = useChannelStore();
  const activeChannel = channels.find((c) => c.id === activeChannelId);

  return (
    <header className="app-header">
      {/* Server name — matches sidebar width exactly */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ width: 220 }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-accent flex items-center justify-center">
            <span className="text-white text-xs font-bold">O</span>
          </div>
          <span className="font-bold text-sm text-primary">{communityName}</span>
        </div>
      </div>

      {/* Channel name — in main panel area */}
      <div className="flex-1 flex items-center gap-2 pl-3">
        {activeChannel && (
          <>
            <span className="text-muted text-lg">
              {activeChannel.type === 'TEXT' ? '#' : '🔊'}
            </span>
            <span className="font-semibold text-sm text-primary">{activeChannel.name}</span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="flex items-center gap-2 bg-input px-3 py-2 rounded-lg border border-transparent focus-within:border-accent/30 transition-colors">
          <Search size={14} className="text-muted flex-shrink-0" />
          <input
            type="text"
            placeholder="Search..."
            className="bg-transparent outline-none text-primary text-sm w-32 placeholder:text-muted"
          />
        </div>

        {/* Icons */}
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
