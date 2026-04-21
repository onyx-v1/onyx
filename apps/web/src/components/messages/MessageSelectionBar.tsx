import { useState } from 'react';
import { Copy, Trash2, X, Check } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useMessageStore } from '../../stores/messageStore';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';
import { isPinEvent } from '../../stores/messageStore';

interface Props {
  channelId: string;
}

export function MessageSelectionBar({ channelId }: Props) {
  const { active, selectedIds, clearSelection } = useSelectionStore();
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'ADMIN';
  const { openDeleteConfirm, showToast } = useDeletePrefsStore();

  const [copied, setCopied] = useState(false);

  if (!active || selectedIds.size === 0) return null;

  const count = selectedIds.size;

  const handleCopy = () => {
    const { messages } = useMessageStore.getState();
    const channelMsgs = messages.get(channelId) ?? [];
    const selected = channelMsgs
      .filter((m) => !isPinEvent(m) && selectedIds.has(m.id) && !m.deleted)
      .map((m) => {
        const time = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `[${time}] ${m.author.displayName}: ${m.content}`;
      })
      .join('\n');

    if (!selected) return;
    navigator.clipboard.writeText(selected).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      clearSelection();
    });
  };

  const handleDelete = () => {
    const { messages } = useMessageStore.getState();
    const channelMsgs = messages.get(channelId) ?? [];

    const deletable = channelMsgs.filter((m) => {
      if (isPinEvent(m)) return false;
      if (!selectedIds.has(m.id)) return false;
      if (m.deleted) return false;
      return isAdmin || m.author.id === user?.id;
    });

    if (!deletable.length) return;

    // Use the unified confirm modal (handles don't-ask-again + bulk feedback in one pass)
    openDeleteConfirm(deletable.length, (showFeedback) => {
      const socket = getSocket();
      for (const m of deletable) {
        socket?.emit('message:delete', { messageId: m.id });
      }
      clearSelection();
      if (showFeedback) {
        showToast(`${deletable.length} message${deletable.length > 1 ? 's' : ''} deleted`);
      }
    });
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        zIndex: 50,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'var(--color-elevated)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.15s ease-out',
      }}
    >
      {/* Left — count + deselect */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={clearSelection}
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-muted)',
          }}
        >
          <X size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
          {count} message{count > 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <button
          onClick={handleCopy}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(139,124,248,0.12)',
            border: '1px solid rgba(139,124,248,0.25)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: 'var(--color-accent)',
            transition: 'background 0.15s',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </button>

        <button
          onClick={handleDelete}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '6px 14px', borderRadius: 8,
            background: 'rgba(240,64,64,0.10)',
            border: '1px solid rgba(240,64,64,0.25)',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
            color: 'var(--color-danger)',
            transition: 'background 0.15s',
          }}
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}
