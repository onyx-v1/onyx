import { useState } from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';

// ── Layout constants (must match message-group CSS) ──────────────────────────
const AVATAR_W = 32; // w-8
const COL_GAP  = 14; // gap in .message-group
const BRIDGE   = AVATAR_W + COL_GAP; // 46px — distance from content-div back to avatar left edge
const ARC_LEFT = AVATAR_W / 2;       // 16px — connector starts at avatar centre

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
  const handleCopy   = () => {
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
    <div className={`message-group group relative ${compact ? 'pt-0' : 'pt-3'}`}>

      {/* ── Avatar / time-spacer column ─────────────────────────── */}
      <div className="w-8 flex-shrink-0 flex flex-col items-center">
        {!compact ? (
          <Avatar displayName={message.author.displayName} size="sm" />
        ) : (
          <span
            className="opacity-0 group-hover:opacity-100 transition-opacity select-none"
            style={{ fontSize: 11, color: 'var(--color-subtle)', paddingTop: 2 }}
          >
            {format(date, 'HH:mm')}
          </span>
        )}
      </div>

      {/* ── Content column ──────────────────────────────────────── */}
      <div className="flex-1 min-w-0">

        {/* ── Discord-style reply preview ─────────────────────── */}
        {message.replyTo && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginLeft: -BRIDGE,   // pull row back to avatar area
              marginBottom: 4,
              overflow: 'hidden',
              maxWidth: `calc(100% + ${BRIDGE}px)`,
            }}
          >
            {/* Left spacer: aligns connector start to avatar centre */}
            <div style={{ width: ARC_LEFT, flexShrink: 0 }} />

            {/* Curved connector — bridges from avatar centre to content edge */}
            <div
              style={{
                width: BRIDGE - ARC_LEFT,   // 30px
                height: 16,
                flexShrink: 0,
                alignSelf: 'flex-end',       // anchor to bottom so line "comes down" from above
                borderTop: '2px solid rgba(255,255,255,0.20)',
                borderLeft: '2px solid rgba(255,255,255,0.20)',
                borderTopLeftRadius: 8,
                marginBottom: 2,
                marginRight: 6,
              }}
            />

            {/* Mini avatar of replied-to user */}
            <Avatar displayName={message.replyTo.author.displayName} size="xs" />

            {/* @name + preview */}
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
                {message.replyTo.deleted ? 'Original message was deleted' : message.replyTo.content}
              </span>
            </span>
          </div>
        )}

        {/* ── Author name + timestamp ──────────────────────────── */}
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

        {/* ── Message text ─────────────────────────────────────── */}
        <p style={{ fontSize: 15, color: 'var(--color-primary)', lineHeight: 1.6, wordBreak: 'break-word' }}>
          {message.content}
        </p>
      </div>

      {/* ── Hover action buttons ─────────────────────────────────── */}
      <div
        className="message-actions absolute right-4 top-1/2 -translate-y-1/2 shadow-lg"
        style={{
          background: 'var(--color-elevated)',
          border: '1px solid rgba(255,255,255,0.07)',
          borderRadius: 8,
          padding: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
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
            <Trash2 size={14} style={{ color: 'var(--color-muted)' }} className="hover:text-danger" />
          </button>
        )}
      </div>
    </div>
  );
}
