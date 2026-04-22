import { useEffect, useRef } from 'react';
import { X, LogOut, Monitor, Smartphone, User } from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from './Avatar';
import { platform } from '../../platform';

// ── Download URLs (GitHub Releases latest) ────────────────────────────────────
const GITHUB_REPO      = 'https://github.com/onyx-v1/onyx';
const DOWNLOAD_WINDOWS = `${GITHUB_REPO}/releases/latest/download/Onyx-Setup.exe`;
const DOWNLOAD_ANDROID = `${GITHUB_REPO}/releases/latest/download/Onyx.apk`;

interface Props {
  onClose: () => void;
}

export function SettingsModal({ onClose }: Props) {
  const { user, logout } = useAuthStore();
  const overlayRef       = useRef<HTMLDivElement>(null);

  // Close on backdrop click
  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleLogout = () => { logout(); onClose(); };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-end',        // anchors to bottom (sidebar style)
        justifyContent: 'flex-start',
        padding: '0 0 0 0',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Modal panel — floats above sidebar bottom-left */}
      <div
        style={{
          width: 'min(320px, 92vw)',
          background: 'var(--color-elevated)',
          borderRadius: 16,
          border: '1px solid rgba(255,255,255,0.08)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
          margin: '0 12px 80px 12px',   // sits just above the profile bar
          overflow: 'hidden',
          animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
        }}
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.02em' }}>
            Settings
          </span>
          <button
            onClick={onClose}
            style={{
              width: 24, height: 24, borderRadius: 6,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.06)', border: 'none',
              cursor: 'pointer', color: 'var(--color-subtle)',
            }}
          >
            <X size={13} />
          </button>
        </div>

        {/* ── Profile section ────────────────────────────────────────── */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar
              displayName={user?.displayName ?? ''}
              avatarUrl={user?.avatarUrl}
              size="md"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                margin: 0, fontSize: 15, fontWeight: 700,
                color: 'var(--color-primary)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                {user?.displayName}
              </p>
              <p style={{
                margin: 0, fontSize: 12,
                color: 'var(--color-muted)',
                overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
              }}>
                @{user?.username}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'rgba(139,124,248,0.18)',
                color: 'var(--color-accent)',
                borderRadius: 6, padding: '3px 7px',
                textTransform: 'uppercase', letterSpacing: '0.08em',
                flexShrink: 0,
              }}>
                Admin
              </span>
            )}
          </div>
        </div>

        {/* ── Download section (hidden if already on native app) ─────── */}
        {!platform.isNative && (
          <div style={{ padding: '0 16px 14px' }}>
            <p style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--color-subtle)',
              textTransform: 'uppercase', letterSpacing: '0.08em',
              margin: '0 0 8px',
            }}>
              Download App
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {/* Windows */}
              <a
                href={DOWNLOAD_WINDOWS}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                  transition: 'background 0.12s, border-color 0.12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(139,124,248,0.10)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,124,248,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(139,124,248,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Monitor size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                    Windows Desktop
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                    Onyx-Setup.exe
                  </p>
                </div>
              </a>

              {/* Android */}
              <a
                href={DOWNLOAD_ANDROID}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '10px 12px', borderRadius: 10,
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  textDecoration: 'none',
                  transition: 'background 0.12s, border-color 0.12s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(62,207,142,0.10)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62,207,142,0.3)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)';
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: 8,
                  background: 'rgba(62,207,142,0.12)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  <Smartphone size={16} style={{ color: 'var(--color-online)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>
                    Android
                  </p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>
                    Onyx.apk
                  </p>
                </div>
              </a>
            </div>
          </div>
        )}

        {/* ── Divider ────────────────────────────────────────────────── */}
        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* ── Logout ─────────────────────────────────────────────────── */}
        <div style={{ padding: '8px 8px' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 10,
              padding: '10px 10px', borderRadius: 8, border: 'none',
              background: 'transparent', cursor: 'pointer',
              color: 'var(--color-danger)',
              fontSize: 13, fontWeight: 600,
              transition: 'background 0.12s',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = 'rgba(240,64,64,0.10)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
          >
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
