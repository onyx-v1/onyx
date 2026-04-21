import { useState, memo } from 'react';
import { Reply, Copy, Trash2, Check } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';

const AVATAR_W    = 32;
const COL_GAP     = 14;
const CONNECTOR_W = AVATAR_W / 2 + COL_GAP; // 30px

interface Props {
  message: Message;
  compact: boolean;
  onReply: () => void;
  isHighlighted?: boolean;
}

function formatTime(date: Date): string {
  if (isToday(date))     return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

/** Split content on @mentions and render them as highlighted chips. */
function renderContent(content: string, currentDisplayName?: string) {
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (!/@\w+/.test(part)) return <span key={i}>{part}</span>;
    const lower = part.toLowerCase();
    const isMe       = !!currentDisplayName && lower === `@${currentDisplayName.toLowerCase()}`;
    const isEveryone = lower === '@everyone';
    const highlight  = isMe || isEveryone;
    return (
      <span
        key={i}
        style={{
          background: highlight ? 'rgba(139,124,248,0.22)' : 'rgba(139,124,248,0.10)',
          color: isEveryone ? '#f09f40' : 'var(--color-accent-hover)',
          borderRadius: 3,
          padding: '0 4px',
          fontWeight: 600,
          fontSize: 14,
        }}
      >
        {part}
      </span>
    );
  });
}

export const MessageItem = memo(function MessageItem({ message, compact, onReply, isHighlighted }: Props) {
  const { user } = useAuthStore();
  const [hovered, setHovered] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const isOwn     = user?.id === message.author.id;
  const isAdmin   = user?.role === 'ADMIN';
  const canDelete = isOwn || isAdmin;
  const date      = new Date(message.createdAt);

  // Does this message mention me or @everyone?
  const mentionsMe = !!user?.displayName && (
    message.content.toLowerCase().includes('@everyone') ||
    message.content.toLowerCase().includes(`@${user.displayName.toLowerCase()}`)
  );

  const handleDelete = () => {
    if (!window.confirm('Delete this message?')) return;
    getSocket()?.emit('message:delete', { messageId: message.id });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  const handleReply = () => {
    onReply();
  };

  /* ── Deleted state ───────────────────────────────────────────────── */
  if (message.deleted) {
    return (
      <div style={{ padding: compact ? '1px 20px' : '6px 20px 2px', display: 'flex', gap: COL_GAP }}>
        {!compact && <div style={{ width: AVATAR_W, flexShrink: 0 }} />}
        <span style={{ fontSize: 13, color: 'var(--color-subtle)', fontStyle: 'italic' }}>
          Message deleted
        </span>
      </div>
    );
  }

  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={isHighlighted ? 'msg-flash' : undefined}
      style={{
        position: 'relative',
        padding: compact ? '1px 20px' : '6px 20px 2px',
        borderRadius: 6,
        background: mentionsMe
          ? 'rgba(139,124,248,0.06)'
          : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderLeft: mentionsMe ? '2px solid rgba(139,124,248,0.5)' : '2px solid transparent',
        transition: 'background 0.08s',
      }}
    >

      {/* ── Reply connector row ─────────────────────────────────────── */}
      {message.replyTo && (
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2, overflow: 'hidden' }}>
          <div style={{ width: AVATAR_W / 2, flexShrink: 0 }} />
          <div
            style={{
              width: CONNECTOR_W,
              height: 14,
              flexShrink: 0,
              alignSelf: 'flex-end',
              borderTop: '2px solid rgba(255,255,255,0.18)',
              borderLeft: '2px solid rgba(255,255,255,0.18)',
              borderTopLeftRadius: 8,
              marginBottom: 1,
              marginRight: 6,
            }}
          />
          <Avatar displayName={message.replyTo.author.displayName} size="xs" />
          <span
            style={{
              marginLeft: 6, fontSize: 13,
              color: 'var(--color-muted)',
              overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
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

      {/* ── Main row ────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: COL_GAP }}>

        {/* Avatar / compact timestamp */}
        <div style={{ width: AVATAR_W, flexShrink: 0, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {!compact ? (
            <Avatar
              displayName={message.author.displayName}
              avatarUrl={isOwn ? (user?.avatarUrl ?? message.author.avatarUrl) : message.author.avatarUrl}
              size="sm"
            />
          ) : (
            <span
              style={{
                fontSize: 10, color: 'var(--color-subtle)',
                paddingTop: 3, userSelect: 'none',
                opacity: hovered ? 1 : 0, transition: 'opacity 0.1s',
              }}
            >
              {format(date, 'HH:mm')}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {!compact && (
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 2 }}>
              <span
                style={{
                  fontSize: 15, fontWeight: 600, cursor: 'pointer',
                  color: isOwn ? 'var(--color-accent-hover)' : 'var(--color-primary)',
                }}
              >
                {message.author.displayName}
              </span>
              <span style={{ fontSize: 11, color: 'var(--color-subtle)' }}>
                {formatTime(date)}
              </span>
            </div>
          )}
          <p style={{ fontSize: 15, color: 'var(--color-primary)', lineHeight: 1.6, wordBreak: 'break-word', margin: 0 }}>
            {renderContent(message.content, user?.displayName)}
          </p>
        </div>
      </div>

      {/* ── Action toolbar — visible on hover ───────────────────────── */}
      {hovered && (
        <div
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'var(--color-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8,
            padding: '2px 4px',
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            zIndex: 10,
          }}
        >
          {/* Reply */}
          <ActionBtn title="Reply" onClick={handleReply}>
            <Reply size={14} />
          </ActionBtn>

          {/* Copy */}
          <ActionBtn title={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
            {copied
              ? <Check size={14} style={{ color: 'var(--color-online)' }} />
              : <Copy size={14} />}
          </ActionBtn>

          {/* Delete (own or admin) */}
          {canDelete && (
            <ActionBtn title="Delete" onClick={handleDelete} danger>
              <Trash2 size={14} />
            </ActionBtn>
          )}
        </div>
      )}
    </div>
  );
});

/* ── Tiny reusable action button ─────────────────────────────────────── */
function ActionBtn({
  title, onClick, children, danger,
}: {
  title: string;
  onClick: () => void;
  children: React.ReactNode;
  danger?: boolean;
}) {
  const [hov, setHov] = useState(false);
  return (
    <button
      title={title}
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        width: 30, height: 30,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        borderRadius: 6, border: 'none', cursor: 'pointer',
        background: hov
          ? (danger ? 'rgba(240,64,64,0.15)' : 'rgba(255,255,255,0.08)')
          : 'transparent',
        color: hov && danger ? 'var(--color-danger)' : 'var(--color-muted)',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {children}
    </button>
  );
}
