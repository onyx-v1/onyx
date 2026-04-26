import { Hash, Volume2 } from 'lucide-react';
import { Channel } from '@onyx/types';
import { useChannelStore } from '../../stores/channelStore';

interface Props {
  channel:  Channel;
  isActive: boolean;
  onClick:  () => void;
}

export function ChannelItem({ channel, isActive, onClick }: Props) {
  const count      = useChannelStore((s) => s.unreadCounts[channel.id] ?? 0);
  const hasMention = useChannelStore((s) => s.mentionedChannels.has(channel.id));
  const hasUnread  = count > 0 || hasMention;

  return (
    <button
      onClick={onClick}
      className={`channel-item w-full ${isActive ? 'active' : ''}`}
      style={{ fontWeight: hasUnread && !isActive ? 600 : undefined }}
    >
      {/* Active bar */}
      {isActive && <div className="absolute left-0 w-0.5 h-4 bg-accent rounded-r" />}

      {/* Channel type icon */}
      {channel.type === 'TEXT' ? (
        <Hash size={14} className="flex-shrink-0" style={{ opacity: hasUnread && !isActive ? 1 : undefined }} />
      ) : (
        <Volume2 size={14} className="flex-shrink-0" />
      )}

      {/* Channel name */}
      <span className="truncate flex-1 text-left">{channel.name}</span>

      {/* Private indicator */}
      {channel.private && (
        <span style={{ fontSize: 10, opacity: 0.5, flexShrink: 0 }} title="Private channel">🔒</span>
      )}

      {/* ── Badges (right side) — only when not active ─────────────── */}
      {!isActive && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>

          {/* @mention badge — amber pill */}
          {hasMention && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                width: 18, height: 18, borderRadius: '50%',
                background: '#f59e0b',
                color: '#000',
                fontSize: 10, fontWeight: 700, lineHeight: 1,
              }}
            >
              @
            </span>
          )}

          {/* Unread count badge — accent pill, max 99 */}
          {count > 0 && (
            <span
              style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 18, height: 18,
                padding: count > 9 ? '0 5px' : 0,
                borderRadius: 9,
                background: 'var(--color-danger)',
                color: '#fff',
                fontSize: 10, fontWeight: 700, lineHeight: 1,
              }}
            >
              {count > 99 ? '99+' : count}
            </span>
          )}
        </div>
      )}
    </button>
  );
}
