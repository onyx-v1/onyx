import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  Hash, Volume2, ChevronRight, Settings, Shield,
  Mic, MicOff,
} from 'lucide-react';
import { useChannelStore } from '../../stores/channelStore';
import { useAuthStore } from '../../stores/authStore';
import { usePresenceStore, selectIsOnline } from '../../stores/presenceStore';
import { useVoiceStore } from '../../stores/voiceStore';
import { useVoice } from '../../hooks/useVoice';
import { Avatar } from '../ui/Avatar';
import { AvatarUploadModal } from '../ui/AvatarUploadModal';
import { SettingsModal } from '../ui/SettingsModal';

/**
 * MobileChannelList — WhatsApp-style home screen for mobile.
 *
 * Shows the community name + all channels as a full-screen list.
 * Tapping a channel navigates into the chat view.
 */
export function MobileChannelList() {
  const navigate = useNavigate();
  const { channels, activeChannelId, setActiveChannel, communityName } = useChannelStore();
  const { user }        = useAuthStore();
  const isUserOnline    = usePresenceStore(selectIsOnline(user?.id ?? ''));
  const { isConnected: inVoice } = useVoiceStore();
  const { leaveVoice }  = useVoice();

  const [showAvatarModal,   setShowAvatarModal]   = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const textChannels  = channels.filter((c) => c.type === 'TEXT');
  const voiceChannels = channels.filter((c) => c.type === 'VOICE');

  const handleSelect = (channelId: string, type: 'TEXT' | 'VOICE') => {
    setActiveChannel(channelId);
    navigate(type === 'TEXT' ? `/channel/${channelId}` : `/voice/${channelId}`);
  };

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', flexDirection: 'column',
      background: '#0f0f0f',
      paddingTop:    'env(safe-area-inset-top)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>

      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '0 16px',
        height: 60,
        flexShrink: 0,
        background: '#0f0f0f',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        {/* Community logo */}
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
          overflow: 'hidden',
        }}>
          <img src="/onyx-logo.png" alt="Onyx Logo" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>

        {/* Community name */}
        <span style={{
          flex: 1,
          fontSize: 18, fontWeight: 700,
          color: '#f2f2f2',
          letterSpacing: '-0.01em',
        }}>
          {communityName || 'Onyx'}
        </span>
      </div>

      {/* ── Active voice banner ────────────────────────────────────── */}
      {inVoice && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '10px 16px',
          background: 'rgba(62,207,142,0.08)',
          borderBottom: '1px solid rgba(62,207,142,0.15)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Mic size={14} style={{ color: 'var(--color-online)' }} />
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-online)' }}>
              In Voice
            </span>
          </div>
          <button
            onClick={leaveVoice}
            style={{
              fontSize: 12, fontWeight: 600, color: 'var(--color-danger)',
              background: 'rgba(240,64,64,0.12)', padding: '4px 10px',
              borderRadius: 6, border: 'none', cursor: 'pointer',
            }}
          >
            Leave
          </button>
        </div>
      )}

      {/* ── Channel list ──────────────────────────────────────────── */}
      <div style={{ flex: 1, overflowY: 'auto', WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>

        {/* Text channels */}
        {textChannels.length > 0 && (
          <div>
            <div style={{
              padding: '16px 16px 6px',
              fontSize: 11, fontWeight: 700,
              color: '#606060',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Text Channels
            </div>
            {textChannels.map((ch) => (
              <ChannelRow
                key={ch.id}
                channelId={ch.id}
                name={ch.name}
                type="TEXT"
                isActive={ch.id === activeChannelId}
                onClick={() => handleSelect(ch.id, 'TEXT')}
              />
            ))}
          </div>
        )}

        {/* Voice channels */}
        {voiceChannels.length > 0 && (
          <div style={{ marginTop: textChannels.length ? 8 : 0 }}>
            <div style={{
              padding: '16px 16px 6px',
              fontSize: 11, fontWeight: 700,
              color: '#606060',
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}>
              Voice Channels
            </div>
            {voiceChannels.map((ch) => (
              <ChannelRow
                key={ch.id}
                channelId={ch.id}
                name={ch.name}
                type="VOICE"
                isActive={ch.id === activeChannelId}
                onClick={() => handleSelect(ch.id, 'VOICE')}
              />
            ))}
          </div>
        )}

        {channels.length === 0 && (
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            height: 200, gap: 8,
          }}>
            <p style={{ fontSize: 14, color: '#606060' }}>No channels yet</p>
          </div>
        )}
      </div>

      {/* ── Bottom profile bar ────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12,
        padding: '12px 16px',
        background: '#141414',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        flexShrink: 0,
      }}>
        <div
          onClick={() => setShowAvatarModal(true)}
          style={{ position: 'relative', cursor: 'pointer', flexShrink: 0 }}
        >
          <Avatar
            displayName={user?.displayName ?? ''}
            avatarUrl={user?.avatarUrl}
            size="sm"
          />
          <span style={{
            position: 'absolute', bottom: -1, right: -1,
            width: 10, height: 10, borderRadius: '50%',
            background: isUserOnline ? 'var(--color-online)' : '#606060',
            border: '2px solid #141414',
          }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            margin: 0, fontSize: 14, fontWeight: 700,
            color: '#f2f2f2',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            {user?.displayName}
          </p>
          <p style={{
            margin: 0, fontSize: 12, color: '#606060',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          }}>
            @{user?.username}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Admin button (if admin) */}
          {user?.role === 'ADMIN' && (
            <button
              onClick={() => navigate('/admin')}
              style={{
                width: 36, height: 36, borderRadius: 10,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'rgba(139,124,248,0.12)',
                border: 'none', cursor: 'pointer',
              }}
            >
              <Shield size={16} style={{ color: 'var(--color-accent)' }} />
            </button>
          )}

          {/* Settings button */}
          <button
            onClick={() => setShowSettingsModal(true)}
            style={{
              width: 36, height: 36, borderRadius: 10,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)',
              border: 'none', cursor: 'pointer',
            }}
          >
            <Settings size={16} style={{ color: '#a0a0a0' }} />
          </button>
        </div>
      </div>

      {/* ── Modals ────────────────────────────────────────────────── */}
      {showAvatarModal   && <AvatarUploadModal onClose={() => setShowAvatarModal(false)} />}
      {showSettingsModal && <SettingsModal     onClose={() => setShowSettingsModal(false)} />}
    </div>
  );
}

// ── Channel row item ──────────────────────────────────────────────────────────
interface RowProps {
  channelId: string;
  name:      string;
  type:      'TEXT' | 'VOICE';
  isActive:  boolean;
  onClick:   () => void;
}

function ChannelRow({ channelId, name, type, isActive, onClick }: RowProps) {
  const count      = useChannelStore((s) => s.unreadCounts[channelId] ?? 0);
  const hasMention = useChannelStore((s) => s.mentionedChannels.has(channelId));
  const hasUnread  = count > 0 || hasMention;
  const [pressed, setPressed] = useState(false);

  return (
    <button
      onClick={onClick}
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        width: '100%', display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        background: pressed
          ? 'rgba(255,255,255,0.06)'
          : isActive
          ? 'rgba(139,124,248,0.08)'
          : 'transparent',
        border: 'none', cursor: 'pointer',
        transition: 'background 0.1s',
        textAlign: 'left',
        borderBottom: '1px solid rgba(255,255,255,0.03)',
      }}
    >
      {/* Icon circle */}
      <div style={{
        width: 46, height: 46, borderRadius: 14, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: type === 'VOICE'
          ? 'rgba(62,207,142,0.12)'
          : isActive
          ? 'rgba(139,124,248,0.20)'
          : 'rgba(255,255,255,0.06)',
        border: isActive ? '1px solid rgba(139,124,248,0.3)' : '1px solid rgba(255,255,255,0.06)',
      }}>
        {type === 'TEXT' ? (
          <Hash
            size={18}
            style={{ color: isActive ? 'var(--color-accent)' : hasUnread ? '#f2f2f2' : '#a0a0a0' }}
          />
        ) : (
          <Volume2 size={18} style={{ color: 'var(--color-online)' }} />
        )}
      </div>

      {/* Name + subtitle */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          margin: 0,
          fontSize: 15,
          fontWeight: hasUnread && !isActive ? 700 : 600,
          color: isActive ? 'var(--color-accent)' : hasUnread ? '#f2f2f2' : '#c8c8c8',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name}
        </p>
        <p style={{
          margin: 0, fontSize: 12, color: '#606060',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {type === 'VOICE' ? 'Voice channel — tap to join' : 'Tap to open'}
        </p>
      </div>

      {/* Badges + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
        {hasMention && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 20, height: 20, borderRadius: '50%',
            background: '#f59e0b', color: '#000',
            fontSize: 10, fontWeight: 800,
          }}>@</span>
        )}
        {count > 0 && !hasMention && (
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            minWidth: 20, height: 20, padding: '0 5px',
            borderRadius: 10,
            background: 'var(--color-danger)', color: '#fff',
            fontSize: 11, fontWeight: 700,
          }}>
            {count > 99 ? '99+' : count}
          </span>
        )}
        <ChevronRight size={16} style={{ color: '#404040' }} />
      </div>
    </button>
  );
}
