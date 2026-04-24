import { useState, memo, useCallback } from 'react';
import { Reply, Copy, Trash2, Check, Pin } from 'lucide-react';
import { formatTimestampIST, formatTimeOnlyIST } from '../../utils/time';
import { Message } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { useSelectionStore } from '../../stores/selectionStore';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';
import { getSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';

/* ── Layout constants ────────────────────────────────────────────────── */
const AVATAR_W    = 32;
const COL_GAP     = 14;
const CONNECTOR_W = AVATAR_W / 2 + COL_GAP; // 30px — aligns with avatar centre

/* ── Types ───────────────────────────────────────────────────────────── */
interface Props {
  message:       Message;
  compact:       boolean;
  onReply:       (msg: Message) => void;   // stable ref from MessageList
  isHighlighted?: boolean;
}


/** Splits message content on @mentions and highlights them. */
function renderContent(content: string, currentDisplayName?: string) {
  return content.split(/(@\w+)/g).map((part, i) => {
    if (!/@\w+/.test(part)) return <span key={i}>{part}</span>;
    const lower      = part.toLowerCase();
    const isMe       = !!currentDisplayName && lower === `@${currentDisplayName.toLowerCase()}`;
    const isEveryone = lower === '@everyone';
    return (
      <span
        key={i}
        style={{
          background:  (isMe || isEveryone) ? 'rgba(139,124,248,0.22)' : 'rgba(139,124,248,0.10)',
          color:       isEveryone ? '#f09f40' : 'var(--color-accent-hover)',
          borderRadius: 3,
          padding:     '0 4px',
          fontWeight:  600,
          fontSize:    14,
        }}
      >
        {part}
      </span>
    );
  });
}

/* ── Component ────────────────────────────────────────────────────────── */
export const MessageItem = memo(function MessageItem({
  message,
  compact,
  onReply,
  isHighlighted,
}: Props) {
  const { user }    = useAuthStore();
  const { active: selectionActive, selectedIds, enterSelection, toggleMessage } = useSelectionStore();
  const { openDeleteConfirm } = useDeletePrefsStore();

  const [hovered, setHovered] = useState(false);
  const [copied,  setCopied]  = useState(false);

  const isSelected = selectedIds.has(message.id);
  const isOwn      = user?.id === message.author.id;
  const isAdmin    = user?.role === 'ADMIN';
  const canDelete  = isOwn || isAdmin;
  const date       = new Date(message.createdAt);

  /* ── Handlers ──────────────────────────────────────────────────────── */
  const handleDelete = useCallback(() => {
    openDeleteConfirm(1, () => {
      getSocket()?.emit('message:delete', { messageId: message.id });
    });
  }, [message.id, openDeleteConfirm]);

  const handlePin = useCallback(() => {
    getSocket()?.emit('message:pin', { messageId: message.id });
  }, [message.id]);

  const handleCopy = useCallback(() => {
    if (!message.content) return;
    navigator.clipboard.writeText(message.content).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }, [message.content]);

  const handleEnterSelection = useCallback(() => {
    enterSelection(message.id);
  }, [message.id, enterSelection]);

  const handleRowClick = useCallback(() => {
    if (selectionActive) toggleMessage(message.id);
  }, [selectionActive, message.id, toggleMessage]);

  /* ── Render ────────────────────────────────────────────────────────── */
  return (
    <div
      id={`msg-${message.id}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={handleRowClick}
      className={isHighlighted ? 'msg-flash' : undefined}
      style={{
        position:    'relative',
        padding:     compact ? '1px 20px' : '6px 20px 2px',
        paddingLeft: selectionActive ? 8 : 20,
        borderRadius: 6,
        background:  isSelected
          ? 'rgba(139,124,248,0.10)'
          : hovered ? 'rgba(255,255,255,0.025)' : 'transparent',
        borderLeft:  isSelected
          ? '2px solid rgba(139,124,248,0.5)'
          : '2px solid transparent',
        transition:  'background 0.08s',
        cursor:      selectionActive ? 'pointer' : 'default',
        display:     'flex',
        alignItems:  'flex-start',
        gap:         selectionActive ? 8 : 0,
      }}
    >
      {/* ── Selection checkbox ───────────────────────────────────────── */}
      {selectionActive && (
        <div
          onClick={(e) => { e.stopPropagation(); toggleMessage(message.id); }}
          style={{
            width: 20, height: 20, borderRadius: 6, flexShrink: 0,
            marginTop: compact ? 2 : 8,
            border:     `2px solid ${isSelected ? 'var(--color-accent)' : 'rgba(255,255,255,0.25)'}`,
            background: isSelected ? 'var(--color-accent)' : 'transparent',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer', transition: 'all 0.12s',
          }}
        >
          {isSelected && <Check size={12} style={{ color: '#fff' }} />}
        </div>
      )}

      {/* ── Message body ─────────────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}>

        {/* Reply connector */}
        {message.replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 2, overflow: 'hidden' }}>
            {/* Spacer aligns the connector curve below the avatar centre */}
            <div style={{ width: AVATAR_W / 2, flexShrink: 0 }} />
            <div
              style={{
                width: CONNECTOR_W, height: 14, flexShrink: 0,
                alignSelf: 'flex-end',
                borderTop: '2px solid rgba(255,255,255,0.18)',
                borderLeft: '2px solid rgba(255,255,255,0.18)',
                borderTopLeftRadius: 8,
                marginBottom: 1, marginRight: 6,
              }}
            />
            <Avatar
              displayName={message.replyTo.author.displayName}
              avatarUrl={message.replyTo.author.avatarUrl}
              size="xs"
            />
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
                {message.replyTo.deleted
                  ? 'Original message was deleted'
                  : message.replyTo.content}
              </span>
            </span>
          </div>
        )}

        {/* Main avatar + content row */}
        <div style={{ display: 'flex', gap: COL_GAP }}>

          {/* Avatar column */}
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
                {formatTimeOnlyIST(date)}
              </span>
            )}
          </div>

          {/* Text content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Author + timestamp — only shown on first message in a group */}
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
                  {formatTimestampIST(date)}
                </span>
              </div>
            )}

            {/* Message body — italic placeholder for soft-deleted state */}
            {message.deleted ? (
              <p style={{ fontSize: 13, color: 'var(--color-subtle)', fontStyle: 'italic', margin: 0, lineHeight: 1.6 }}>
                Message deleted
              </p>
            ) : (
              <p style={{ fontSize: 15, color: 'var(--color-primary)', lineHeight: 1.6, wordBreak: 'break-word', margin: 0 }}>
                {renderContent(message.content, user?.displayName)}
              </p>
            )}
          </div>
        </div>

        {/* Pinned badge */}
        {message.pinned && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            marginLeft: AVATAR_W + COL_GAP, marginBottom: 2,
          }}>
            <Pin size={10} style={{ color: 'var(--color-accent)', transform: 'rotate(45deg)', flexShrink: 0 }} />
            <span style={{ fontSize: 10, color: 'var(--color-accent)', fontWeight: 600, letterSpacing: '0.04em' }}>
              Pinned
            </span>
          </div>
        )}
      </div>{/* end message body */}

      {/* ── Hover action toolbar (hidden during selection or for deleted rows) ── */}
      {hovered && !selectionActive && !message.deleted && (
        <div
          style={{
            position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)',
            background: 'var(--color-elevated)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: 8, padding: '2px 4px',
            display: 'flex', alignItems: 'center', gap: 2,
            boxShadow: '0 4px 20px rgba(0,0,0,0.35)',
            zIndex: 10,
          }}
        >
          <ActionBtn title="Select"  onClick={handleEnterSelection}><Check  size={14} /></ActionBtn>
          <ActionBtn title="Reply" onClick={() => onReply(message)}><Reply size={14} /></ActionBtn>
          <ActionBtn title={copied ? 'Copied!' : 'Copy'} onClick={handleCopy}>
            {copied
              ? <Check size={14} style={{ color: 'var(--color-online)' }} />
              : <Copy  size={14} />}
          </ActionBtn>
          {isAdmin && (
            <ActionBtn title={message.pinned ? 'Unpin' : 'Pin'} onClick={handlePin}>
              <Pin size={14} style={{ transform: 'rotate(45deg)', color: message.pinned ? 'var(--color-accent)' : undefined }} />
            </ActionBtn>
          )}
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

/* ── Tiny reusable icon button ───────────────────────────────────────── */
function ActionBtn({
  title, onClick, children, danger = false,
}: {
  title:    string;
  onClick:  () => void;
  children: React.ReactNode;
  danger?:  boolean;
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
        color:      hov && danger ? 'var(--color-danger)' : 'var(--color-muted)',
        transition: 'background 0.1s, color 0.1s',
      }}
    >
      {children}
    </button>
  );
}
