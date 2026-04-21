import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSocket, getSocket } from '../../hooks/useSocket';
import { useSocketStore } from '../../stores/socketStore';
import { usePresence } from '../../hooks/usePresence';
import { useChannelStore } from '../../stores/channelStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  useSocket();      // initializes the singleton socket
  usePresence();    // presence updates

  const navigate   = useNavigate();
  const connectionId = useSocketStore((s) => s.connectionId);
  const { fetchCommunity, activeChannelId, channels, setChannels } = useChannelStore();

  /* ── Load community + channels on mount ─────────────────────────── */
  useEffect(() => {
    fetchCommunity();
  }, []);

  /* ── Navigate to first channel after initial load ───────────────── */
  useEffect(() => {
    if (!activeChannelId || !channels.length) return;
    if (window.location.pathname !== '/') return;
    const ch = channels.find((c) => c.id === activeChannelId);
    if (ch) navigate(`/${ch.type === 'VOICE' ? 'voice' : 'channel'}/${ch.id}`, { replace: true });
  }, [activeChannelId, channels]);

  /* ── channels:updated — re-runs when socket is ready ────────────── */
  // Uses connectionId so this effect re-runs every time the socket connects,
  // preventing the listener from being lost when the socket was null on mount.
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handle = ({ channels: updated }: { channels: any[] }) => {
      setChannels(updated);
    };
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
