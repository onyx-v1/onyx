import { useState } from 'react';
import { Pin, Bell, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useChannelStore } from '../../stores/channelStore';
import { useThemeStore } from '../../stores/themeStore';
import { SearchPanel } from '../ui/SearchPanel';
import { PinnedPanel } from '../ui/PinnedPanel';

export function Header() {
  const { channels, activeChannelId, communityName } = useChannelStore();
  const { sidebarOpen, toggleSidebar } = useThemeStore();
  const activeChannel = channels.find((c) => c.id === activeChannelId);
  const location = useLocation();
  const [pinnedOpen, setPinnedOpen] = useState(false);

  // Only show the pin button when viewing a text channel
  const inTextChannel = /\/channel\//.test(location.pathname);

  return (
    <header className="app-header">
      {/* Server name area — collapses width with sidebar */}
      <div
        style={{
          width: sidebarOpen ? 'var(--size-sidebar)' : '0px',
          overflow: 'hidden',
          flexShrink: 0,
          transition: 'width 0.25s cubic-bezier(0.4,0,0.2,1)',
        }}
      >
        <div className="flex items-center gap-2" style={{ width: 'var(--size-sidebar)', paddingRight: '1rem' }}>
          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center bg-transparent">
            <img src="/onyx-logo.png" alt="Onyx" className="w-full h-full object-cover" />
          </div>
          <span className="font-bold text-base text-primary">{communityName}</span>
        </div>
      </div>

      {/* Channel name row — starts with toggle button */}
      <div className="flex-1 flex items-center gap-2 pl-3">
        {/* Sidebar toggle */}
        <button
          onClick={toggleSidebar}
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
          className="btn-ghost p-1.5 rounded-lg"
          style={{ flexShrink: 0, color: 'var(--color-muted)', transition: 'color 0.15s' }}
          onMouseEnter={e => (e.currentTarget.style.color = 'var(--color-primary)')}
          onMouseLeave={e => (e.currentTarget.style.color = 'var(--color-muted)')}
        >
          {sidebarOpen
            ? <PanelLeftClose size={17} />
            : <PanelLeftOpen  size={17} />
          }
        </button>

        {activeChannel && (
          <>
            <span className="text-muted text-xl" style={{ marginLeft: 2 }}>
              {activeChannel.type === 'TEXT' ? '#' : '🔊'}
            </span>
            <span className="font-semibold text-base text-primary">{activeChannel.name}</span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div className="flex items-center gap-3">
        <SearchPanel />

        {/* Pin button — only for text channels, opens PinnedPanel */}
        {inTextChannel && (
          <div style={{ position: 'relative' }}>
            <button
              className="btn-ghost p-2 rounded-lg"
              title="Pinned messages"
              onClick={() => setPinnedOpen((v) => !v)}
              style={{
                color: pinnedOpen ? 'var(--color-accent)' : undefined,
                background: pinnedOpen ? 'rgba(139,124,248,0.12)' : undefined,
              }}
            >
              <Pin
                size={16}
                style={{
                  color: pinnedOpen ? 'var(--color-accent)' : 'var(--color-muted)',
                  transform: 'rotate(45deg)',
                  transition: 'color 0.15s',
                }}
              />
            </button>

            {pinnedOpen && (
              <PinnedPanel onClose={() => setPinnedOpen(false)} />
            )}
          </div>
        )}

        <button className="btn-ghost p-2 rounded-lg" title="Notifications">
          <Bell size={16} className="text-muted" />
        </button>
      </div>
    </header>
  );
}
