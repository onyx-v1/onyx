import { useState } from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';

// ── Layout constants — must match .message-group CSS ─────────────────────────
const AVATAR_W = 32; // w-8
const COL_GAP  = 14; // gap in message row
// Connector bridges from avatar centre (AVATAR_W/2 = 16) to content start (AVATAR_W + COL_GAP = 46)
// So connector width = (AVATAR_W/2 + COL_GAP) = 30px
const CONNECTOR_W = AVATAR_W / 2 + COL_GAP; // 30px

interface Props {
  message: Message;
  compact: boolean;
  onReply: () => void;
}

function formatTime(date: Date): string {
  if (isToday(date))     return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

export function MessageItem({ message, compact, onReply }: Props) {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const isOwn    = user?.id === message.author.id;
  const isAdmin  = user?.role === 'ADMIN';
  const canDelete = isOwn || isAdmin;
  const date     = new Date(message.createdAt);

  const handleDelete = () => getSocket()?.emit('message:delete', { messageId: message.id });

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.deleted) {
    return (
      <div className={`message-group ${compact ? 'pt-0' : 'pt-2'}`}>
        {!compact && <div className="w-8 flex-shrink-0" />}
        <span style={{ fontSize: 13, color: 'var(--color-subtle)', fontStyle: 'italic' }}>
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      className="group relative"
      style={{
        padding: compact ? '1px 20px' : '6px 20px 2px',
        borderRadius: 6,
        transition: 'background 0.08s',
      }}
    >

      {/* ━━━ Discord-style reply row ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
          Rendered as a SEPARATE ROW above the avatar+content row.
          This prevents any overlap with the main message avatar.
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      {message.replyTo && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: 2,
            overflow: 'hidden',
          }}
        >
          {/* Left spacer: positions connector at avatar centre */}
          <div style={{ width: AVATAR_W / 2, flexShrink: 0 }} />

          {/* Curved connector: from avatar centre → content column start */}
          <div
            style={{
              width: CONNECTOR_W,       // 30px — bridges exactly to content start
              height: 14,
              flexShrink: 0,
              alignSelf: 'flex-end',    // anchor bottom so arc "hangs down" toward avatar
              borderTop: '2px solid rgba(255,255,255,0.20)',
              borderLeft: '2px solid rgba(255,255,255,0.20)',
              borderTopLeftRadius: 8,
              marginBottom: 1,
              marginRight: 6,
            }}
          />

          {/* Mini avatar of replied-to author */}
          <Avatar displayName={message.replyTo.author.displayName} size="xs" />

          {/* @name + preview text */}
          <span
            style={{
              marginLeft: 6,
              fontSize: 13,
              color: 'var(--color-muted)',
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              cursor: 'pointer',
            }}
          >
            <span style={{ fontWeight: 600, color: 'var(--color-accent-hover)', marginRight: 4 }}>
              @{message.replyTo.author.displayName}
            </span>
            <span style={{ opacity: 0.65 }}>
              {message.replyTo.deleted
                ? 'Original message was deleted'
                : message.replyTo.content}
            </span>
          </span>
        </div>
      )}

      {/* ━━━ Main message row (avatar + content) ━━━━━━━━━━━━━━━━━━ */}
      <div style={{ display: 'flex', gap: COL_GAP }}>

        {/* Avatar / compact timestamp */}
        <div
          style={{
            width: AVATAR_W,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          {!compact ? (
            <Avatar displayName={message.author.displayName} size="sm" />
          ) : (
            <span
              className="opacity-0 group-hover:opacity-100 transition-opacity select-none"
              style={{ fontSize: 10, color: 'var(--color-subtle)', paddingTop: 3 }}
            >
              {format(date, 'HH:mm')}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>

          {/* Author name + timestamp */}
          {!compact && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 600,
                  color: isOwn ? 'var(--color-accent-hover)' : 'var(--color-primary)',
                  cursor: 'pointer',
                }}
                className="hover:underline"
              >
                {message.author.displayName}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
                {formatTime(date)}
              </span>
            </div>
          )}

          {/* Message body */}
          <p style={{ fontSize: 15, color: 'var(--color-primary)', lineHeight: 1.6, wordBreak: 'break-word', margin: 0 }}>
            {message.content}
          </p>
        </div>
      </div>

      {/* ━━━ Hover action toolbar ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
      <div
        className="message-actions absolute right-4 top-1/2 -translate-y-1/2"
        style={{
          background: 'var(--color-elevated)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          boxShadow: '0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        <button onClick={onReply} className="btn-ghost" style={{ padding: 6 }} title="Reply">
          <Reply size={14} style={{ color: 'var(--color-muted)' }} />
        </button>
        <button onClick={handleCopy} className="btn-ghost" style={{ padding: 6 }} title={copied ? 'Copied!' : 'Copy'}>
          <Copy size={14} style={{ color: copied ? 'var(--color-online)' : 'var(--color-muted)' }} />
        </button>
        {canDelete && (
          <button onClick={handleDelete} className="btn-ghost" style={{ padding: 6 }} title="Delete">
            <Trash2 size={14} style={{ color: 'var(--color-muted)' }} />
          </button>
        )}
      </div>

      {/* Hover background */}
      <style>{`.group:hover { background: rgba(255,255,255,0.02); }`}</style>
    </div>
  );
}
