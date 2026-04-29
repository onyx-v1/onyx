import { useEffect, useCallback } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSocket, getSocket } from '../../hooks/useSocket';
import { useSocketStore } from '../../stores/socketStore';
import { usePresence } from '../../hooks/usePresence';
import { useMentionNotifications } from '../../hooks/useMentionNotifications';
import { useUnreadTracker } from '../../hooks/useUnreadTracker';
import { useChannelStore } from '../../stores/channelStore';
import { useMembersStore } from '../../stores/membersStore';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileContext } from '../../context/MobileContext';
import { MentionToasts } from '../ui/MentionToasts';
import { DeleteConfirmModal } from '../ui/DeleteConfirmModal';
import { DeleteToast } from '../ui/DeleteToast';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { useThemeStore } from '../../stores/themeStore';

export function AppShell() {
  useSocket();
  usePresence();
  useMentionNotifications();
  useUnreadTracker();

  const isMobile     = useIsMobile();
  const navigate     = useNavigate();
  const connectionId = useSocketStore((s) => s.connectionId);
  const sidebarOpen  = useThemeStore((s) => s.sidebarOpen);
  const { fetchCommunity, activeChannelId, channels, setChannels } = useChannelStore();
  const fetchMembers = useMembersStore((s) => s.fetchMembers);

  // No-op on mobile — MobileContext still expected by Sidebar (desktop use)
  const noop = useCallback(() => {}, []);

  /* ── Load community + members on mount ───────────────────────── */
  useEffect(() => {
    fetchCommunity().catch(() => {});
    fetchMembers();
  }, []);

  /* ── Desktop only: navigate to first channel at root ─────────── */
  useEffect(() => {
    if (isMobile) return;                             // mobile has its own home screen
    if (!activeChannelId || !channels.length) return;
    if (window.location.pathname !== '/') return;
    const ch = channels.find((c) => c.id === activeChannelId);
    if (ch) navigate(`/${ch.type === 'VOICE' ? 'voice' : 'channel'}/${ch.id}`, { replace: true });
  }, [isMobile, activeChannelId, channels]);

  /* ── channels:updated ────────────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handle = ({ channels: updated }: { channels: any[] }) => setChannels(updated);
    socket.on('channels:updated', handle);
    return () => { socket.off('channels:updated', handle); };
  }, [connectionId]);

  return (
    <MobileContext.Provider value={{
      isMobile,
      drawerOpen:   false,
      openDrawer:   noop,
      closeDrawer:  noop,
      toggleDrawer: noop,
    }}>
      <div className="h-screen overflow-hidden">

        {/* ── Desktop only: header + sidebar ──────────────────────── */}
        {!isMobile && <Header />}
        {!isMobile && <Sidebar />}

        {/* ── Main content ─────────────────────────────────────────── */}
        <main
          style={isMobile ? {
            position: 'fixed', inset: 0,
            background: 'var(--color-base)',
            display: 'flex', flexDirection: 'column',
          } : {
            left:       sidebarOpen
              ? 'calc(var(--size-sidebar) + var(--card-inset-x, 0px))'
              : 'var(--card-inset-x, 0px)',
            top:        'calc(var(--size-header) + var(--card-inset-y, 0px))',
            right:      'var(--card-inset-x, 0px)',
            bottom:     'var(--card-inset-y, 0px)',
            transition: 'left 0.25s cubic-bezier(0.4,0,0.2,1)',
          }}
          className={isMobile ? undefined : 'app-main'}
        >
          <Outlet />
        </main>

        {/* ── Global overlays ──────────────────────────────────────── */}
        <MentionToasts />
        <DeleteConfirmModal />
        <DeleteToast />
      </div>
    </MobileContext.Provider>
  );
}
