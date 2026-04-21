import { useState, useEffect } from 'react';
import { Trash2, X, BellOff, Bell } from 'lucide-react';
import { useDeletePrefsStore } from '../../stores/deletePrefsStore';

export function DeleteConfirmModal() {
  const {
    pending,
    skipDeleteConfirm,
    showDeleteFeedback,
    skipBulkFeedbackPrompt,
    confirmDelete,
    cancelDelete,
  } = useDeletePrefsStore();

  const [dontAskAgain,    setDontAskAgain]    = useState(false);
  const [feedback,        setFeedback]        = useState(showDeleteFeedback);
  const [rememberFeedback, setRememberFeedback] = useState(false);

  // Reset toggles when modal opens with a new pending op
  useEffect(() => {
    if (pending) {
      setDontAskAgain(false);
      setFeedback(showDeleteFeedback);
      setRememberFeedback(false);
    }
  }, [pending]);

  if (!pending) return null;

  const { count } = pending;
  const isBulk = count > 3;
  const showConfirmSection   = !skipDeleteConfirm;
  const showFeedbackSection  = isBulk && !skipBulkFeedbackPrompt;

  const handleConfirm = () => {
    confirmDelete({ dontAskAgain, feedback, rememberFeedback });
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) cancelDelete();
  };

  return (
    <div
      onClick={handleBackdropClick}
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
          width: '100%', maxWidth: 420,
          background: 'var(--color-elevated)',
          border: '1px solid rgba(255,255,255,0.09)',
          borderRadius: 16,
          boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
          overflow: 'hidden',
          animation: 'slideUp 0.18s ease-out',
        }}
      >
        {/* ── Header ── */}
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

        {/* ── Body ── */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>

          {/* Bulk feedback section */}
          {showFeedbackSection && (
            <div style={{
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.07)',
              background: 'rgba(255,255,255,0.03)',
              overflow: 'hidden',
            }}>
              <div style={{
                padding: '10px 14px',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
              }}>
                <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  Bulk Delete Preference
                </p>
              </div>

              {/* Feedback toggle */}
              <button
                onClick={() => setFeedback((v) => !v)}
                style={{
                  width: '100%', padding: '12px 14px',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  background: feedback ? 'rgba(139,124,248,0.15)' : 'rgba(255,255,255,0.05)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.15s',
                }}>
                  {feedback
                    ? <Bell size={16} style={{ color: 'var(--color-accent)' }} />
                    : <BellOff size={16} style={{ color: 'var(--color-subtle)' }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                    Show "Messages deleted" notification
                  </p>
                  <p style={{ margin: '2px 0 0', fontSize: 11, color: 'var(--color-muted)' }}>
                    Brief toast after deleting {count} messages
                  </p>
                </div>
                {/* Toggle pill */}
                <div style={{
                  width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                  background: feedback ? 'var(--color-accent)' : 'rgba(255,255,255,0.12)',
                  position: 'relative', transition: 'background 0.2s',
                }}>
                  <div style={{
                    position: 'absolute',
                    top: 3, left: feedback ? 21 : 3,
                    width: 16, height: 16, borderRadius: '50%',
                    background: '#fff',
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.3)',
                  }} />
                </div>
              </button>

              {/* Remember choice */}
              <label style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 14px',
                borderTop: '1px solid rgba(255,255,255,0.05)',
                cursor: 'pointer',
              }}>
                <div style={{
                  width: 16, height: 16, borderRadius: 4, flexShrink: 0,
                  border: `2px solid ${rememberFeedback ? 'var(--color-accent)' : 'rgba(255,255,255,0.2)'}`,
                  background: rememberFeedback ? 'var(--color-accent)' : 'transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.12s', cursor: 'pointer',
                }}>
                  {rememberFeedback && (
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4l2.5 2.5L9 1" stroke="#fff" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )}
                </div>
                <input type="checkbox" checked={rememberFeedback} onChange={(e) => setRememberFeedback(e.target.checked)} style={{ display: 'none' }} />
                <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Remember my choice</span>
              </label>
            </div>
          )}

          {/* Don't ask again (only when confirmation section is visible) */}
          {showConfirmSection && (
            <label style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '4px 0', cursor: 'pointer',
            }}>
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
              <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>Don't ask again for deletions</span>
            </label>
          )}
        </div>

        {/* ── Footer ── */}
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
              transition: 'background 0.15s',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            style={{
              padding: '9px 20px', borderRadius: 10, border: 'none', cursor: 'pointer',
              background: 'var(--color-danger)',
              fontSize: 13, fontWeight: 600, color: '#fff',
              transition: 'opacity 0.15s',
            }}
          >
            Delete {count > 1 ? `${count} Messages` : 'Message'}
          </button>
        </div>
      </div>
    </div>
  );
}
