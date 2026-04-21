import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, AtSign } from 'lucide-react';
import { useNotificationsStore } from '../../stores/notificationsStore';

export function MentionToasts() {
  const { alerts, dismiss } = useNotificationsStore();
  const navigate = useNavigate();

  // Auto-dismiss after 6 seconds
  useEffect(() => {
    if (!alerts.length) return;
    const oldest = alerts[alerts.length - 1];
    const age = Date.now() - oldest.timestamp;
    const remaining = Math.max(0, 6000 - age);
    const t = setTimeout(() => dismiss(oldest.id), remaining);
    return () => clearTimeout(t);
  }, [alerts]);

  if (!alerts.length) return null;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {[...alerts].reverse().map((alert) => (
        <div
          key={alert.id}
          style={{
            pointerEvents: 'all',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 10,
            padding: '10px 14px',
            background: 'var(--color-elevated)',
            border: '1px solid rgba(139,124,248,0.35)',
            borderRadius: 10,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            maxWidth: 320,
            cursor: 'pointer',
            animation: 'slide-in 0.2s ease-out',
          }}
          onClick={() => {
            navigate(`/channel/${alert.channelId}`);
            dismiss(alert.id);
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 28, height: 28, borderRadius: 8,
              background: alert.isEveryone ? 'rgba(240,159,64,0.15)' : 'rgba(139,124,248,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}
          >
            <AtSign
              size={14}
              style={{ color: alert.isEveryone ? '#f09f40' : 'var(--color-accent)' }}
            />
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-primary)', margin: 0 }}>
              {alert.isEveryone ? '@everyone' : `@you`}
              {' '}
              <span style={{ fontWeight: 400, color: 'var(--color-muted)' }}>
                from {alert.fromUser}
              </span>
            </p>
            <p
              style={{
                fontSize: 12, color: 'var(--color-muted)', margin: '2px 0 0',
                overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
              }}
            >
              {alert.content}
            </p>
          </div>

          {/* Dismiss */}
          <button
            onClick={(e) => { e.stopPropagation(); dismiss(alert.id); }}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'var(--color-subtle)', padding: 2, flexShrink: 0,
            }}
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  );
}
