import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Pin, X, Clock } from 'lucide-react';
import { apiClient } from '../../api/client';
import { getSocket } from '../../hooks/useSocket';
import { Message } from '@onyx/types';
import { format, isToday, isYesterday } from 'date-fns';

function formatDate(date: Date) {
  if (isToday(date))     return format(date, 'HH:mm');
  if (isYesterday(date)) return `Yesterday ${format(date, 'HH:mm')}`;
  return format(date, 'MMM d, HH:mm');
}

interface Props {
  onClose: () => void;
}

export function PinnedPanel({ onClose }: Props) {
  const [pinned,  setPinned]  = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const channelId = location.pathname.match(/\/channel\/([^/]+)/)?.[1] ?? null;

  const fetchPinned = useCallback(async () => {
    if (!channelId) return;
    setLoading(true);
    try {
      const { data } = await apiClient.get<Message[]>(`/messages/channel/${channelId}/pinned`);
      setPinned(data);
    } catch {
      setPinned([]);
    } finally {
      setLoading(false);
    }
  }, [channelId]);

  // Initial load
  useEffect(() => { fetchPinned(); }, [fetchPinned]);

  // Live refresh when any pin toggle happens in this channel
  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;
    const refresh = ({ channelId: cId }: { channelId: string }) => {
      if (cId === channelId) fetchPinned();
    };
    socket.on('message:pinned',  refresh);
    socket.on('message:updated', refresh);
    return () => {
      socket.off('message:pinned',  refresh);
      socket.off('message:updated', refresh);
    };
  }, [channelId, fetchPinned]);

  /* ── Close on outside click ──────────────────────────────────────── */
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const goToMessage = (msg: Message) => {
    navigate(`/channel/${msg.channelId}?highlight=${msg.id}`);
    onClose();
  };

  return (
    <div
      ref={panelRef}
      style={{
        position: 'absolute', top: 'calc(100% + 8px)', right: 0,
        width: 400,
        background: 'var(--color-elevated)',
        border: '1px solid rgba(255,255,255,0.08)',
        borderRadius: 12, overflow: 'hidden',
        boxShadow: '0 16px 48px rgba(0,0,0,0.5)',
        zIndex: 1000,
        animation: 'slideDown 0.15s ease-out',
      }}
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 14px 10px',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Pin size={14} style={{ color: 'var(--color-accent)', transform: 'rotate(45deg)' }} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)' }}>
            Pinned Messages
          </span>
          {pinned.length > 0 && (
            <span style={{
              fontSize: 11, fontWeight: 600,
              background: 'rgba(139,124,248,0.18)',
              color: 'var(--color-accent)',
              borderRadius: 10, padding: '1px 7px',
            }}>
              {pinned.length}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: 'none', cursor: 'pointer',
            color: 'var(--color-muted)',
          }}
        >
          <X size={13} />
        </button>
      </div>

      {/* Body */}
      {loading ? (
        <div style={{ padding: '24px', textAlign: 'center', color: 'var(--color-muted)', fontSize: 13 }}>
          Loading…
        </div>
      ) : pinned.length === 0 ? (
        <div style={{ padding: '32px 16px', textAlign: 'center' }}>
          <Pin size={28} style={{ color: 'var(--color-subtle)', transform: 'rotate(45deg)', marginBottom: 10 }} />
          <p style={{ fontSize: 13, color: 'var(--color-muted)', margin: 0 }}>
            No pinned messages in this channel yet.
          </p>
          <p style={{ fontSize: 12, color: 'var(--color-subtle)', marginTop: 4 }}>
            Admins can pin important messages from the message toolbar.
          </p>
        </div>
      ) : (
        <div style={{ maxHeight: 420, overflowY: 'auto' }}>
          {pinned.map((msg, i) => (
            <div
              key={msg.id}
              onClick={() => goToMessage(msg)}
              style={{
                display: 'flex', flexDirection: 'column', gap: 4,
                padding: '11px 14px',
                cursor: 'pointer',
                borderBottom: i < pinned.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                borderLeft: '2px solid transparent',
                transition: 'background 0.08s, border-left-color 0.08s',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'var(--color-accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLDivElement).style.background = 'transparent';
                (e.currentTarget as HTMLDivElement).style.borderLeftColor = 'transparent';
              }}
            >
              {/* Author + time */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                  {msg.author.displayName}
                </span>
                <span style={{
                  marginLeft: 'auto', fontSize: 11, color: 'var(--color-subtle)',
                  display: 'flex', alignItems: 'center', gap: 3,
                }}>
                  <Clock size={10} />
                  {formatDate(new Date(msg.createdAt))}
                </span>
              </div>
              {/* Content */}
              <p style={{
                margin: 0, fontSize: 13, color: 'var(--color-muted)',
                lineHeight: 1.5,
                overflow: 'hidden', textOverflow: 'ellipsis',
                display: '-webkit-box', WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
              }}>
                {msg.content}
              </p>
              {/* Jump hint */}
              <span style={{ fontSize: 11, color: 'var(--color-accent)', marginTop: 2 }}>
                Jump to message →
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
