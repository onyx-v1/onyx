import { useEffect, useState, useCallback } from 'react';
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

export function AppShell() {
  useSocket();
  usePresence();
  useMentionNotifications();
  useUnreadTracker();

  const isMobile      = useIsMobile();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const navigate      = useNavigate();
  const connectionId  = useSocketStore((s) => s.connectionId);
  const { fetchCommunity, activeChannelId, channels, setChannels } = useChannelStore();
  const fetchMembers  = useMembersStore((s) => s.fetchMembers);

  const openDrawer   = useCallback(() => setDrawerOpen(true),  []);
  const closeDrawer  = useCallback(() => setDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setDrawerOpen((v) => !v), []);

  // Close drawer automatically when navigating to a channel on mobile
  useEffect(() => { if (isMobile) closeDrawer(); }, [activeChannelId]);

  /* ── Load community + members on mount ─────────────────────────── */
  useEffect(() => {
    fetchCommunity().catch(() => {});
    fetchMembers();
  }, []);

  /* ── Navigate to first channel once loaded ──────────────────────── */
  useEffect(() => {
    if (!activeChannelId || !channels.length) return;
    if (window.location.pathname !== '/') return;
    const ch = channels.find((c) => c.id === activeChannelId);
    if (ch) navigate(`/${ch.type === 'VOICE' ? 'voice' : 'channel'}/${ch.id}`, { replace: true });
  }, [activeChannelId, channels]);

  /* ── channels:updated ───────────────────────────────────────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handle = ({ channels: updated }: { channels: any[] }) => setChannels(updated);
    socket.on('channels:updated', handle);
    return () => { socket.off('channels:updated', handle); };
  }, [connectionId]);

  return (
    <MobileContext.Provider value={{ isMobile, drawerOpen, openDrawer, closeDrawer, toggleDrawer }}>
      <div className="h-screen overflow-hidden">

        {/* ── Desktop: fixed header — hidden on mobile (ChannelPage has its own header) ── */}
        {!isMobile && <Header />}

        {/* ── Desktop: always-visible sidebar ─────────────────────────────────────────── */}
        {!isMobile && <Sidebar />}

        {/* ── Mobile: slide-in drawer overlay ─────────────────────────────────────────── */}
        {isMobile && (
          <>
            {/* Backdrop */}
            {drawerOpen && (
              <div
                onClick={closeDrawer}
                style={{
                  position: 'fixed', inset: 0, zIndex: 40,
                  background: 'rgba(0,0,0,0.55)',
                  backdropFilter: 'blur(4px)',
                  animation: 'fadeIn 0.18s ease-out',
                }}
              />
            )}
            {/* Drawer panel */}
            <div
              style={{
                position: 'fixed', top: 0, left: 0, bottom: 0,
                width: 'min(80vw, 300px)',
                background: 'var(--color-base)',
                borderRight: '1px solid var(--color-border)',
                zIndex: 50,
                transform: drawerOpen ? 'translateX(0)' : 'translateX(-100%)',
                transition: 'transform 0.25s cubic-bezier(0.4,0,0.2,1)',
                display: 'flex', flexDirection: 'column',
                overflowY: 'auto',
                // iOS safe area
                paddingTop: 'env(safe-area-inset-top)',
                paddingBottom: 'env(safe-area-inset-bottom)',
              }}
            >
              <Sidebar />
            </div>
          </>
        )}

        {/* ── Main content ─────────────────────────────────────────────────────────────── */}
        <main
          style={isMobile ? {
            // Mobile: full screen, no header offset
            position: 'fixed', inset: 0,
            background: 'var(--color-panel)',
            display: 'flex', flexDirection: 'column',
            paddingTop:    'env(safe-area-inset-top)',
            paddingBottom: 'env(safe-area-inset-bottom)',
          } : undefined}
          className={isMobile ? undefined : 'app-main'}
        >
          <Outlet />
        </main>

        {/* ── Global overlays ──────────────────────────────────────────────────────────── */}
        <MentionToasts />
        <DeleteConfirmModal />
        <DeleteToast />
      </div>
    </MobileContext.Provider>
  );
}
