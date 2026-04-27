import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Settings, Shield } from 'lucide-react';
import { useChannelStore } from '../../stores/channelStore';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore, selectIsOnline } from '../../stores/presenceStore';
import { useVoiceStore } from '../../stores/voiceStore';
import { useVoice } from '../../hooks/useVoice';
import { useMobileCtx } from '../../context/MobileContext';
import { ChannelSection } from '../channels/ChannelSection';
import { Avatar } from '../ui/Avatar';
import { ConnectionStatus } from '../ui/ConnectionStatus';
import { AvatarUploadModal } from '../ui/AvatarUploadModal';

export function Sidebar() {
  const navigate     = useNavigate();
  const location     = useLocation();
  const { isMobile, closeDrawer } = useMobileCtx();

  const [showAvatarModal, setShowAvatarModal] = useState(false);

  const { channels, activeChannelId, setActiveChannel, communityName } = useChannelStore();
  const { user }     = useAuthStore();
  const isUserOnline = usePresenceStore(selectIsOnline(user?.id ?? ''));
  const { isConnected: inVoice } = useVoiceStore();
  const { leaveVoice } = useVoice();

  const textChannels  = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  const activeId = (() => {
    const match = location.pathname.match(/\/(channel|voice)\/([\w-]+)/);
    return match ? match[2] : activeChannelId;
  })();

  const handleChannelClick = (channelId: string, type: 'TEXT' | 'VOICE') => {
    setActiveChannel(channelId);
    navigate(type === 'TEXT' ? `/channel/${channelId}` : `/voice/${channelId}`);
    if (isMobile) closeDrawer();
  };

  return (
    <>
      <aside
        style={isMobile ? {
          display: 'flex', flexDirection: 'column',
          flex: 1, minHeight: 0, width: '100%',
        } : undefined}
        className={isMobile ? undefined : 'app-sidebar'}
      >
        {/* ── Community name ───────────────────────────────────────── */}
        <div className="px-4 py-4 border-b border-white/5">
          <span className="text-xs font-semibold text-muted uppercase tracking-widest">
            {communityName}
          </span>
        </div>

        {/* ── Channels ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto py-2 px-2">
          <ChannelSection
            label="Text Channels"
            channels={textChannels}
            activeId={activeId}
            onChannelClick={(id) => handleChannelClick(id, 'TEXT')}
          />
          <ChannelSection
            label="Voice Channels"
            channels={voiceChannels}
            activeId={activeId}
            onChannelClick={(id) => handleChannelClick(id, 'VOICE')}
          />
        </div>

        {/* ── Active voice indicator ────────────────────────────────── */}
        {inVoice && (
          <div className="mx-2 mb-1 px-3 py-2 bg-online/10 rounded-lg flex items-center justify-between text-xs">
            <span className="text-online font-medium">🎙 In Voice</span>
            <button onClick={leaveVoice} className="text-danger hover:text-danger/80 transition-colors">
              Leave
            </button>
          </div>
        )}

        {/* ── Connection status ─────────────────────────────────────── */}
        <ConnectionStatus />

        {/* ── User profile bar ──────────────────────────────────────── */}
        <div className="user-profile-bar">
          {/* Avatar — click to change */}
          <div
            className="relative flex-shrink-0"
            title="Click to change avatar"
            style={{ cursor: 'pointer' }}
            onClick={() => setShowAvatarModal(true)}
          >
            <Avatar
              displayName={user?.displayName ?? ''}
              avatarUrl={user?.avatarUrl}
              size="sm"
            />
            <span
              className={`online-dot absolute -bottom-0.5 -right-0.5 ${isUserOnline ? 'is-online' : 'is-offline'}`}
            />
          </div>

          {/* Name + username */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-primary truncate">{user?.displayName}</p>
            <p className="text-xs text-muted truncate">@{user?.username}</p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1">
            {/* Admin panel shortcut (admin only) */}
            {user?.role === 'ADMIN' && (
              <button
                onClick={() => { navigate('/admin'); if (isMobile) closeDrawer(); }}
                className="btn-ghost p-1 rounded"
                title="Admin Panel"
              >
                <Shield size={14} className="text-accent" />
              </button>
            )}

            {/* Settings — opens full settings page */}
            <button
              onClick={() => { navigate('/settings'); if (isMobile) closeDrawer(); }}
              className="btn-ghost p-1 rounded"
              title="Settings"
            >
              <Settings size={14} className="text-muted" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Modals (outside aside to avoid stacking context issues) ── */}
      {showAvatarModal && <AvatarUploadModal onClose={() => setShowAvatarModal(false)} />}
    </>
  );
}
