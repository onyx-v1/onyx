import { useState, useEffect } from 'react';
import { Trash2, X } from 'lucide-react';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';

export function DeleteConfirmModal() {
  const { pending, confirmDelete, cancelDelete } = useDeletePrefsStore();
  const [dontAskAgain, setDontAskAgain] = useState(false);

  useEffect(() => {
    if (pending) setDontAskAgain(false);
  }, [pending]);

  if (!pending) return null;

  const { count } = pending;

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) cancelDelete(); }}
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(0,0,0,0.55)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 20,
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div
        style={{
          width: '100%', maxWidth: 400,
          background: 'var(--color-elevated)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'slideUp 0.18s ease-out',
        }}
      >
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 24px 0',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(240,64,64,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Trash2 size={18} style={{ color: 'var(--color-danger)' }} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--color-primary)' }}>
                Delete {count === 1 ? 'Message' : `${count} Messages`}
              </h3>
              <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--color-muted)' }}>
                This action cannot be undone.
              </p>
            </div>
          </div>
          <button
            onClick={cancelDelete}
            style={{
              width: 28, height: 28, borderRadius: '50%', border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.06)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--color-muted)', flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Body — don't ask again */}
        <div style={{ padding: '16px 24px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
            <div
              onClick={() => setDontAskAgain((v) => !v)}
              style={{
                width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                border: `2px solid ${dontAskAgain ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
                background: dontAskAgain ? 'var(--color-accent)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.12s', cursor: 'pointer',
              }}
            >
              {dontAskAgain && (
                <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                  <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </div>
            <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Don't ask again</span>
          </label>
        </div>

        {/* Footer */}
        <div style={{
          display: 'flex', gap: 10, justifyContent: 'flex-end',
          padding: '0 24px 20px',
        }}>
          <button
            onClick={cancelDelete}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'rgba(255,255,255,0.07)',
              fontSize: 13, fontWeight: 600, color: 'var(--color-primary)',
            }}
          >
            Cancel
          </button>
          <button
            onClick={() => confirmDelete(dontAskAgain)}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--color-danger)',
              fontSize: 13, fontWeight: 600, color: '#fff',
            }}
          >
            Delete {count > 1 ? `${count} Messages` : 'Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
