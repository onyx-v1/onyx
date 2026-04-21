import { useState } from 'react';
import { Reply, Copy, Trash2 } from 'lucide-react';
import { format, isToday, isYesterday } from 'date-fns';
import { Message } from '@onyx/types';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import { Avatar } from '../ui/Avatar';

interface Props {
  message: Message;
  compact: boolean;
  onReply: () => void;
}

function formatTime(date: Date): string {
  if (isToday(date)) return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

export function MessageItem({ message, compact, onReply }: Props) {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);

  const isOwn = user?.id === message.author.id;
  const isAdmin = user?.role === 'ADMIN';
  const canDelete = isOwn || isAdmin;
  const date = new Date(message.createdAt);

  const handleDelete = () => {
    const socket = getSocket();
    socket?.emit('message:delete', { messageId: message.id });
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (message.deleted) {
    return (
      <div className={`message-group ${compact ? 'pt-0' : 'pt-2'}`}>
        {!compact && <div className="w-8 flex-shrink-0" />}
        <span className="text-subtle text-xs italic">Message deleted</span>
      </div>
    );
  }

  return (
    <div className={`message-group group relative ${compact ? 'pt-0' : 'pt-3'}`}>
      {/* Avatar or spacer */}
      <div className="w-8 flex-shrink-0 flex flex-col items-center">
        {!compact ? (
          <Avatar displayName={message.author.displayName} size="sm" />
        ) : (
          <span className="text-xs text-subtle opacity-0 group-hover:opacity-100 transition-opacity pt-0.5 select-none">
            {format(date, 'HH:mm')}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* ── Discord-style reply preview ─────────────────── */}
        {message.replyTo && (
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4, position: 'relative' }}>
            {/* Curved connector line */}
            <div style={{
              width: 28,
              height: 14,
              marginRight: 6,
              flexShrink: 0,
              borderTop: '2px solid rgba(255,255,255,0.18)',
              borderLeft: '2px solid rgba(255,255,255,0.18)',
              borderTopLeftRadius: 8,
              marginTop: 2,
            }} />

            {/* Mini avatar */}
            <Avatar displayName={message.replyTo.author.displayName} size="xs" />

            {/* @name + preview */}
            <span style={{ marginLeft: 6, fontSize: 13, color: 'var(--color-muted)', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
              <span style={{ fontWeight: 600, color: 'var(--color-accent-hover)', marginRight: 4 }}>
                @{message.replyTo.author.displayName}
              </span>
              <span style={{ opacity: 0.7 }}>{message.replyTo.deleted ? 'Original message was deleted' : message.replyTo.content}</span>
            </span>
          </div>
        )}

        {/* Author + timestamp (non-compact) */}
        {!compact && (
          <div className="flex items-baseline gap-2 mb-0.5">
            <span
              className={`text-base font-semibold hover:underline cursor-pointer ${isOwn ? 'text-accent-hover' : 'text-primary'}`}
            >
              {message.author.displayName}
            </span>
            <span className="text-xs text-subtle">{formatTime(date)}</span>
          </div>
        )}

        {/* Message text */}
        <p className="text-base text-primary leading-relaxed break-words">{message.content}</p>
      </div>

      {/* Hover actions */}
      <div className="message-actions absolute right-4 top-1/2 -translate-y-1/2 bg-elevated border border-white/5 rounded-lg px-1 py-0.5 shadow-lg">
        <button onClick={onReply} className="btn-ghost p-1.5" title="Reply">
          <Reply size={13} />
        </button>
        <button onClick={handleCopy} className="btn-ghost p-1.5" title={copied ? 'Copied!' : 'Copy'}>
          <Copy size={13} className={copied ? 'text-online' : ''} />
        </button>
        {canDelete && (
          <button onClick={handleDelete} className="btn-ghost p-1.5 hover:text-danger" title="Delete">
            <Trash2 size={13} />
          </button>
        )}
      </div>
    </div>
  );
}
