import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { useSocket } from '../../hooks/useSocket';
import { usePresence } from '../../hooks/usePresence';
import { useChannelStore } from '../../stores/channelStore';
import { Header } from './Header';
import { Sidebar } from './Sidebar';

export function AppShell() {
  const socket = useSocket();
  const navigate = useNavigate();
  usePresence();

  const { fetchCommunity, activeChannelId, channels } = useChannelStore();

  // Fetch channels on mount
  useEffect(() => {
    fetchCommunity();
  }, []);

  // Navigate to first channel after load
  useEffect(() => {
    if (activeChannelId && window.location.pathname === '/') {
      const ch = channels.find((c) => c.id === activeChannelId);
      if (ch) navigate(`/${ch.type === 'VOICE' ? 'voice' : 'channel'}/${ch.id}`, { replace: true });
    }
  }, [activeChannelId, channels]);

  // Listen for server-pushed channel updates (after admin creates/deletes)
  useEffect(() => {
    if (!socket) return;
    const handleChannelsUpdated = ({ channels: updated }: { channels: any[] }) => {
      useChannelStore.getState().setChannels(updated);
    };
    socket.on('channels:updated', handleChannelsUpdated);
    return () => { socket.off('channels:updated', handleChannelsUpdated); };
  }, [socket]);

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
