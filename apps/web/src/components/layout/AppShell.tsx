import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSocket, getSocket } from '../../hooks/useSocket';
import { useSocketStore } from '../../stores/socketStore';
import { usePresence } from '../../hooks/usePresence';
import { useChannelStore } from '../../stores/channelStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  useSocket();
  usePresence();

  const navigate     = useNavigate();
  const connectionId = useSocketStore((s) => s.connectionId);
  const { fetchCommunity, activeChannelId, channels, setChannels } = useChannelStore();

  /* ── Load community on mount ─────────────────────────────────────── */
  useEffect(() => {
    fetchCommunity().catch(() => {
      // 401 interceptor will redirect to login; other errors are silent retries
    });
  }, []);

  /* ── Navigate to first channel once loaded ───────────────────────── */
  useEffect(() => {
    if (!activeChannelId || !channels.length) return;
    if (window.location.pathname !== '/') return;
    const ch = channels.find((c) => c.id === activeChannelId);
    if (ch) navigate(`/${ch.type === 'VOICE' ? 'voice' : 'channel'}/${ch.id}`, { replace: true });
  }, [activeChannelId, channels]);

  /* ── channels:updated — re-runs when socket is ready ────────────── */
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const handle = ({ channels: updated }: { channels: any[] }) => setChannels(updated);
    socket.on('channels:updated', handle);
    return () => { socket.off('channels:updated', handle); };
  }, [connectionId]);

  return (
    <div className="h-screen overflow-hidden">
      <Header />
      <Sidebar />
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  );
}
