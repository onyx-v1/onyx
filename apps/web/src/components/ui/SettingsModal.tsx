import { useEffect, useRef, useState } from 'react';
import {
  X, LogOut, Monitor, Smartphone,
  RefreshCw, CheckCircle, AlertCircle, Download, Zap, Palette,
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { Avatar } from './Avatar';
import { platform } from '../../platform';
import type { UpdateState } from '../../platform';
import { useThemeStore, THEMES, CHAT_BACKGROUNDS, chatBgUrl } from '../../stores/themeStore';

const GITHUB_REPO      = 'https://github.com/onyx-v1/onyx';
// Pinned to last known-good release. Update when CI produces a verified exe.
const DOWNLOAD_WINDOWS = `${GITHUB_REPO}/releases/download/v1.7.0/Onyx-Setup.exe`;
const DOWNLOAD_ANDROID = `${GITHUB_REPO}/releases/download/v1.7.0/Onyx.apk`;

const electron = typeof window !== 'undefined'
  ? (window as any).__onyx as {
      version: string;
      checkForUpdates: () => Promise<unknown>;
      onUpdateStatus:  (cb: (s: UpdateState) => void) => void;
      quitAndInstall:  () => void;
    } | undefined
  : undefined;

interface Props { onClose: () => void; }

export function SettingsModal({ onClose }: Props) {
  const { user, logout } = useAuthStore();
  const { theme, setTheme, chatBackground, setChatBackground } = useThemeStore();
  const overlayRef = useRef<HTMLDivElement>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateState | null>(null);
  const [manualChecking, setManualChecking] = useState(false);

  const handleBackdrop = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) onClose();
  };

  // Close on Escape
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, [onClose]);

  // Subscribe to real-time update status events from main process
  useEffect(() => {
    if (!platform.isDesktop || !platform.onUpdateStatus) return;
    platform.onUpdateStatus((status) => {
      setUpdateStatus(status);
      setManualChecking(false);
    });
  }, []);

  const handleCheckUpdates = async () => {
    if (!platform.checkForUpdates) return;
    setManualChecking(true);
    setUpdateStatus({ state: 'checking' });
    await platform.checkForUpdates();
  };

  const handleRestart = () => {
    platform.quitAndInstall?.();
  };

  const handleLogout = () => { logout(); onClose(); };

  const appVersion = electron?.version ?? null;

  // ── Update UI helpers ───────────────────────────────────────────────────────
  const renderUpdateSection = () => {
    const s = updateStatus;

    let btnLabel   = 'Check for updates';
    let btnIcon    = <RefreshCw size={13} />;
    let btnColor   = 'rgba(139,124,248,0.12)';
    let btnText    = 'var(--color-accent)';
    let btnDisabled = false;
    let showRestart = false;
    let statusLine: string | null = null;

    if (manualChecking || s?.state === 'checking') {
      btnLabel    = 'Checking…';
      btnIcon     = <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />;
      btnDisabled = true;
    } else if (s?.state === 'available') {
      btnLabel  = `v${s.version} available`;
      btnIcon   = <Download size={13} />;
      btnColor  = 'rgba(62,207,142,0.12)';
      btnText   = 'var(--color-online)';
      statusLine = 'Downloading in background…';
    } else if (s?.state === 'downloading') {
      btnLabel    = `Downloading ${s.percent}%`;
      btnIcon     = <Download size={13} />;
      btnColor    = 'rgba(62,207,142,0.10)';
      btnText     = 'var(--color-online)';
      btnDisabled = true;
      statusLine  = `${Math.round(s.bytesPerSecond / 1024)} KB/s`;
    } else if (s?.state === 'ready') {
      btnLabel    = 'Restart to update';
      btnIcon     = <Zap size={13} />;
      btnColor    = 'rgba(62,207,142,0.18)';
      btnText     = 'var(--color-online)';
      showRestart = true;
      statusLine  = `v${s.version} ready to install`;
    } else if (s?.state === 'not-available') {
      btnLabel  = 'Up to date';
      btnIcon   = <CheckCircle size={13} />;
      btnColor  = 'rgba(255,255,255,0.06)';
      btnText   = 'var(--color-subtle)';
      btnDisabled = true;
    } else if (s?.state === 'error') {
      btnLabel  = 'Retry';
      btnIcon   = <AlertCircle size={13} />;
      btnColor  = 'rgba(240,64,64,0.12)';
      btnText   = 'var(--color-danger)';
      statusLine = s.message.slice(0, 60);
    }

    return (
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{
          padding: '10px 12px', borderRadius: 10,
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.07)',
        }}>
          {/* Version row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: statusLine ? 8 : 0 }}>
            <div>
              <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', fontWeight: 500 }}>Version</p>
              <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>
                {appVersion ? `v${appVersion}` : 'v1.1.0'}
              </p>
            </div>

            {showRestart ? (
              <button
                onClick={handleRestart}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: btnColor, color: btnText,
                  fontSize: 12, fontWeight: 700, cursor: 'pointer',
                  animation: 'pulse 2s infinite',
                }}
              >
                {btnIcon}{btnLabel}
              </button>
            ) : (
              <button
                onClick={handleCheckUpdates}
                disabled={btnDisabled}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '7px 12px', borderRadius: 8, border: 'none',
                  background: btnColor, color: btnText,
                  fontSize: 12, fontWeight: 600,
                  cursor: btnDisabled ? 'default' : 'pointer',
                  transition: 'all 0.15s',
                }}
              >
                {btnIcon}{btnLabel}
              </button>
            )}
          </div>

          {/* Status line */}
          {statusLine && (
            <p style={{
              margin: 0, fontSize: 11, color: 'var(--color-muted)',
              paddingTop: 6, borderTop: '1px solid rgba(255,255,255,0.06)',
            }}>
              {statusLine}
            </p>
          )}

          {/* Download progress bar */}
          {s?.state === 'downloading' && (
            <div style={{
              marginTop: 6, height: 3, borderRadius: 2,
              background: 'rgba(255,255,255,0.1)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', width: `${s.percent}%`,
                background: 'var(--color-online)',
                transition: 'width 0.3s ease',
                borderRadius: 2,
              }} />
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={overlayRef}
      onClick={handleBackdrop}
      style={{
        position: 'fixed', inset: 0, zIndex: 200,
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        display: 'flex', alignItems: 'flex-end', justifyContent: 'flex-start',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      <div style={{
        width: 'min(320px, 92vw)',
        background: 'var(--color-elevated)',
        borderRadius: 16,
        border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 24px 64px rgba(0,0,0,0.6)',
        margin: '0 12px 80px 12px',
        overflow: 'hidden',
        animation: 'slideUp 0.2s cubic-bezier(0.34,1.56,0.64,1)',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 16px 12px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', letterSpacing: '0.02em' }}>
            Settings
          </span>
          <button onClick={onClose} style={{
            width: 24, height: 24, borderRadius: 6,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: 'rgba(255,255,255,0.06)', border: 'none',
            cursor: 'pointer', color: 'var(--color-subtle)',
          }}>
            <X size={13} />
          </button>
        </div>

        {/* Profile */}
        <div style={{ padding: '16px 16px 12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Avatar displayName={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="md" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.displayName}
              </p>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                @{user?.username}
              </p>
            </div>
            {user?.role === 'ADMIN' && (
              <span style={{
                fontSize: 10, fontWeight: 700,
                background: 'rgba(139,124,248,0.18)', color: 'var(--color-accent)',
                borderRadius: 6, padding: '3px 7px',
                textTransform: 'uppercase', letterSpacing: '0.08em', flexShrink: 0,
              }}>Admin</span>
            )}
          </div>
        </div>

        {/* Appearance — Theme switcher */}
        <div style={{ padding: '12px 16px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <Palette size={13} style={{ color: 'var(--color-muted)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Appearance
            </span>
          </div>

          <div style={{ display: 'flex', gap: 8 }}>
            {THEMES.map((t) => {
              const active = theme === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  title={t.description}
                  style={{
                    flex: 1, display: 'flex', flexDirection: 'column', gap: 8,
                    padding: '10px 10px 9px',
                    borderRadius: 10,
                    border: active
                      ? '2px solid var(--color-accent)'
                      : '2px solid rgba(255,255,255,0.07)',
                    background: active
                      ? 'var(--color-accent-muted)'
                      : 'rgba(255,255,255,0.03)',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    alignItems: 'flex-start',
                  }}
                >
                  {/* Mini swatch preview */}
                  <div style={{
                    width: '100%', height: 34, borderRadius: 7, overflow: 'hidden',
                    display: 'flex', border: '1px solid rgba(255,255,255,0.08)',
                  }}>
                    {/* Base surface */}
                    <div style={{ flex: 1, background: t.swatches[0] }} />
                    {/* Accent strip */}
                    <div style={{ width: 22, background: t.swatches[1] }} />
                  </div>

                  {/* Label */}
                  <span style={{
                    fontSize: 11, fontWeight: active ? 700 : 600,
                    color: active ? 'var(--color-accent)' : 'var(--color-muted)',
                    textAlign: 'left',
                  }}>
                    {t.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Chat Background picker */}
        <div style={{ padding: '12px 16px 14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 10 }}>
            <span style={{ fontSize: 13 }}>🖼️</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Chat Background
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
            {/* None option */}
            <button
              onClick={() => setChatBackground(null)}
              style={{
                height: 54, borderRadius: 8,
                border: !chatBackground ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.07)',
                background: 'var(--color-base)',
                cursor: 'pointer',
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 3,
                transition: 'border-color 0.15s',
              }}
            >
              <span style={{ fontSize: 16, opacity: 0.5 }}>✕</span>
              <span style={{ fontSize: 9, color: 'var(--color-muted)', fontWeight: 600 }}>None</span>
            </button>

            {CHAT_BACKGROUNDS.map((bg) => {
              const active = chatBackground === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => setChatBackground(bg.id)}
                  title={bg.label}
                  style={{
                    height: 54, borderRadius: 8, overflow: 'hidden', padding: 0,
                    border: active ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.07)',
                    backgroundImage: `url('${chatBgUrl(bg.id)}')`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    cursor: 'pointer',
                    position: 'relative',
                    transition: 'border-color 0.15s',
                  }}
                >
                  {/* Label overlay */}
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: active ? 'rgba(139,124,248,0.35)' : 'rgba(0,0,0,0.40)',
                    display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
                    padding: '0 2px 4px',
                  }}>
                    <span style={{ fontSize: 8, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.2 }}>
                      {bg.label}
                    </span>
                  </div>
                  {active && (
                    <div style={{
                      position: 'absolute', top: 3, right: 3,
                      width: 14, height: 14, borderRadius: '50%',
                      background: 'var(--color-accent)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ fontSize: 8, color: '#fff' }}>✓</span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* Desktop: version + update */}
        {platform.isDesktop && renderUpdateSection()}

        {/* Web/Mobile: download buttons */}
        {!platform.isDesktop && !platform.isNative && (
          <div style={{ padding: '0 16px 14px' }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-subtle)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' }}>
              Download App
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              <a href={DOWNLOAD_WINDOWS} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', transition: 'background 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(139,124,248,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(139,124,248,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(139,124,248,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Monitor size={16} style={{ color: 'var(--color-accent)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Windows Desktop</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>Onyx-Setup.exe</p>
                </div>
              </a>
              <a href={DOWNLOAD_ANDROID} target="_blank" rel="noreferrer"
                style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', textDecoration: 'none', transition: 'background 0.12s, border-color 0.12s' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(62,207,142,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62,207,142,0.3)'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(62,207,142,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Smartphone size={16} style={{ color: 'var(--color-online)' }} />
                </div>
                <div>
                  <p style={{ margin: 0, fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>Android</p>
                  <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)' }}>Onyx.apk</p>
                </div>
              </a>
            </div>
          </div>
        )}

        <div style={{ height: 1, background: 'rgba(255,255,255,0.06)', margin: '0 16px' }} />

        {/* Logout */}
        <div style={{ padding: '8px 8px' }}>
          <button onClick={handleLogout} style={{
            width: '100%', display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 10px', borderRadius: 8, border: 'none',
            background: 'transparent', cursor: 'pointer',
            color: 'var(--color-danger)', fontSize: 13, fontWeight: 600, transition: 'background 0.12s',
          }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(240,64,64,0.10)'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}>
            <LogOut size={15} />
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
