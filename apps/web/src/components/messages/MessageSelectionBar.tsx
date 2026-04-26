import { useState, useCallback } from 'react';
import { Copy, Trash2, X, Check } from 'lucide-react';
import { useSelectionStore } from '../../stores/selectionStore';
import { useMessageStore, isPinEvent } from '../../stores/messageStore';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';
import { useAuthStore } from '../../stores/authStore';
import { getSocket } from '../../hooks/useSocket';

interface Props {
  channelId: string;
}

export function MessageSelectionBar({ channelId }: Props) {
  const { active, selectedIds, clearSelection } = useSelectionStore();
  const { user }  = useAuthStore();
  const isAdmin   = user?.role === 'ADMIN';
  const { openDeleteConfirm } = useDeletePrefsStore();

  const [copied, setCopied] = useState(false);

  // ── Handlers must be declared BEFORE any conditional return ────────────────
  // Violating this causes "Rendered more hooks than during the previous render"
  const handleCopy = useCallback(() => {
    const { messages } = useMessageStore.getState();
    const rows = (messages.get(channelId) ?? [])
      .filter((m) => !isPinEvent(m) && selectedIds.has(m.id) && !m.deleted && m.content)
      .map((m) => {
        const t = new Date(m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        return `[${t}] ${m.author.displayName}: ${m.content}`;
      })
      .join('\n');

    if (!rows) return;
    navigator.clipboard.writeText(rows).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
      clearSelection();
    });
  }, [channelId, selectedIds, clearSelection]);

  const handleDelete = useCallback(() => {
    const { messages } = useMessageStore.getState();

    const deletable = (messages.get(channelId) ?? []).filter((m) => {
      if (isPinEvent(m) || !selectedIds.has(m.id)) return false;
      return isAdmin || m.author.id === user?.id;
    });

    if (!deletable.length) return;

    openDeleteConfirm(deletable.length, () => {
      const socket = getSocket();
      deletable.forEach((m) => socket?.emit('message:delete', { messageId: m.id }));
      clearSelection();
    });
  }, [channelId, selectedIds, isAdmin, user?.id, openDeleteConfirm, clearSelection]);

  // Only render when selection mode is active and something is selected
  if (!active || selectedIds.size === 0) return null;

  const count = selectedIds.size;

  return (
    <div
      style={{
        position: 'absolute', bottom: '100%', left: 0, right: 0, zIndex: 50,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '10px 20px',
        background: 'var(--color-elevated)',
        borderTop: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 -4px 24px rgba(0,0,0,0.3)',
        animation: 'slideUp 0.15s ease-out',
      }}
    >
      {/* Left — count + cancel */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button
          onClick={clearSelection}
          title="Clear selection"
          style={{
            width: 28, height: 28, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)',
            border: 'none', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--color-muted)',
          }}
        >
          <X size={14} />
        </button>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
          {count} message{count !== 1 ? 's' : ''} selected
        </span>
      </div>

      {/* Right — actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ActionBtn
          onClick={handleCopy}
          style={{
            background: 'rgba(139,124,248,0.12)',
            border:     '1px solid rgba(139,124,248,0.25)',
            color:      'var(--color-accent)',
          }}
        >
          {copied ? <Check size={14} /> : <Copy size={14} />}
          {copied ? 'Copied!' : 'Copy'}
        </ActionBtn>

        <ActionBtn
          onClick={handleDelete}
          style={{
            background: 'rgba(240,64,64,0.10)',
            border:     '1px solid rgba(240,64,64,0.25)',
            color:      'var(--color-danger)',
          }}
        >
          <Trash2 size={14} />
          Delete
        </ActionBtn>
      </div>
    </div>
  );
}

/* ── Local action button ─────────────────────────────────────────────── */
function ActionBtn({
  onClick, children, style,
}: {
  onClick:  () => void;
  children: React.ReactNode;
  style:    React.CSSProperties;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: 6,
        padding: '6px 14px', borderRadius: 8,
        cursor: 'pointer', fontSize: 13, fontWeight: 600,
        transition: 'opacity 0.15s',
        ...style,
      }}
    >
      {children}
    </button>
  );
}
