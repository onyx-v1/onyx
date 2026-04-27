import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User, Palette, Download, LogOut, X,
  Monitor, Smartphone, RefreshCw, CheckCircle,
  AlertCircle, Zap, ChevronRight,
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useThemeStore, THEMES, CHAT_BACKGROUNDS, chatBgUrl } from '../stores/themeStore';
import { Avatar } from '../components/ui/Avatar';
import { platform } from '../platform';
import type { UpdateState } from '../platform';

const GITHUB_REPO      = 'https://github.com/onyx-v1/onyx';
const DOWNLOAD_WINDOWS = `${GITHUB_REPO}/releases/download/v1.7.0/Onyx-Setup.exe`;
const DOWNLOAD_ANDROID = `${GITHUB_REPO}/releases/download/v1.7.0/Onyx.apk`;

type Section = 'account' | 'appearance' | 'downloads';

const NAV_ITEMS: { id: Section; label: string; icon: React.ReactNode }[] = [
  { id: 'account',    label: 'Account',    icon: <User size={16} />      },
  { id: 'appearance', label: 'Appearance', icon: <Palette size={16} />   },
  { id: 'downloads',  label: 'Downloads',  icon: <Download size={16} />  },
];

export function SettingsPage() {
  const navigate  = useNavigate();
  const { user, logout } = useAuthStore();
  const { theme, setTheme, chatBackground, setChatBackground } = useThemeStore();

  const [section,  setSection]  = useState<Section>('account');
  const [closing,  setClosing]  = useState(false);
  const [updateStatus, setUpdateStatus] = useState<UpdateState | null>(null);
  const [manualChecking, setManualChecking] = useState(false);

  const close = () => {
    setClosing(true);
    setTimeout(() => navigate(-1), 260);
  };

  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (!platform.isDesktop || !platform.onUpdateStatus) return;
    platform.onUpdateStatus((s) => { setUpdateStatus(s); setManualChecking(false); });
  }, []);

  const handleCheckUpdates = async () => {
    if (!platform.checkForUpdates) return;
    setManualChecking(true);
    setUpdateStatus({ state: 'checking' });
    await platform.checkForUpdates();
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  /* ── animation state strings ── */
  const anim = closing ? 'sp-fade-out' : 'sp-fade-in';
  const sAnim = closing ? 'sp-side-out' : 'sp-side-in';
  const pAnim = closing ? 'sp-panel-out' : 'sp-panel-in';

  /* ── update section ── */
  const s = updateStatus;
  let btnLabel = 'Check for updates', btnIcon = <RefreshCw size={13} />;
  let btnBg = 'rgba(139,124,248,0.12)', btnColor = 'var(--color-accent)';
  let btnDisabled = false, showRestart = false, statusLine: string | null = null;
  if (manualChecking || s?.state === 'checking') {
    btnLabel = 'Checking…'; btnIcon = <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} />; btnDisabled = true;
  } else if (s?.state === 'available') {
    btnLabel = `v${s.version} available`; btnIcon = <Download size={13} />;
    btnBg = 'rgba(62,207,142,0.12)'; btnColor = 'var(--color-online)'; statusLine = 'Downloading in background…';
  } else if (s?.state === 'downloading') {
    btnLabel = `Downloading ${s.percent}%`; btnIcon = <Download size={13} />;
    btnBg = 'rgba(62,207,142,0.10)'; btnColor = 'var(--color-online)'; btnDisabled = true;
    statusLine = `${Math.round(s.bytesPerSecond / 1024)} KB/s`;
  } else if (s?.state === 'ready') {
    btnLabel = 'Restart to update'; btnIcon = <Zap size={13} />;
    btnBg = 'rgba(62,207,142,0.18)'; btnColor = 'var(--color-online)'; showRestart = true;
    statusLine = `v${s.version} ready to install`;
  } else if (s?.state === 'not-available') {
    btnLabel = 'Up to date'; btnIcon = <CheckCircle size={13} />;
    btnBg = 'rgba(255,255,255,0.06)'; btnColor = 'var(--color-subtle)'; btnDisabled = true;
  } else if (s?.state === 'error') {
    btnLabel = 'Retry'; btnIcon = <AlertCircle size={13} />;
    btnBg = 'rgba(240,64,64,0.12)'; btnColor = 'var(--color-danger)'; statusLine = s.message.slice(0, 80);
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 300,
      background: 'rgba(0,0,0,0.82)',
      display: 'flex', alignItems: 'stretch',
      animation: `${anim} 0.25s ease forwards`,
    }}>
      <style>{`
        @keyframes sp-fade-in  { from { opacity:0 } to { opacity:1 } }
        @keyframes sp-fade-out { from { opacity:1 } to { opacity:0 } }
        @keyframes sp-side-in  { from { opacity:0; transform:translateX(-44px) } to { opacity:1; transform:translateX(0) } }
        @keyframes sp-side-out { from { opacity:1; transform:translateX(0) } to { opacity:0; transform:translateX(-44px) } }
        @keyframes sp-panel-in  { from { opacity:0; transform:translateX(36px) } to { opacity:1; transform:translateX(0) } }
        @keyframes sp-panel-out { from { opacity:1; transform:translateX(0) } to { opacity:0; transform:translateX(36px) } }
        .sp-nav-item { display:flex; align-items:center; gap:10px; width:100%; padding:9px 12px; border-radius:8px; border:none; background:transparent; cursor:pointer; font-size:13px; font-weight:500; color:var(--color-subtle); transition:background 0.12s, color 0.12s; text-align:left; }
        .sp-nav-item:hover { background:rgba(255,255,255,0.06); color:var(--color-primary); }
        .sp-nav-item.active { background:rgba(139,124,248,0.14); color:var(--color-accent); font-weight:700; }
        .sp-card { background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); border-radius:12px; padding:16px; }
        .sp-label { font-size:11px; font-weight:700; color:var(--color-subtle); text-transform:uppercase; letter-spacing:0.08em; margin:0 0 12px; }
        .sp-dl-link { display:flex; align-items:center; gap:12px; padding:12px 14px; border-radius:10px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.07); text-decoration:none; transition:background 0.12s, border-color 0.12s; }
        .sp-dl-link:hover { background:rgba(139,124,248,0.10); border-color:rgba(139,124,248,0.3); }
      `}</style>

      {/* ── Left sidebar ── */}
      <div style={{
        width: 'clamp(180px, 22vw, 240px)',
        background: 'var(--color-surface)',
        borderRight: '1px solid rgba(255,255,255,0.06)',
        display: 'flex', flexDirection: 'column',
        padding: '32px 12px 20px',
        animation: `${sAnim} 0.28s cubic-bezier(0.34,1.4,0.64,1) forwards`,
        flexShrink: 0,
      }}>
        {/* User card */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '10px 10px 14px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          marginBottom: 16,
        }}>
          <Avatar displayName={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="sm" />
          <div style={{ minWidth: 0 }}>
            <p style={{ margin: 0, fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.displayName}
            </p>
            <p style={{ margin: 0, fontSize: 11, color: 'var(--color-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              @{user?.username}
            </p>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <p style={{ margin: '0 4px 6px', fontSize: 10, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            User Settings
          </p>
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sp-nav-item${section === item.id ? ' active' : ''}`}
              onClick={() => setSection(item.id)}
            >
              {item.icon}
              {item.label}
              {section === item.id && <ChevronRight size={12} style={{ marginLeft: 'auto', opacity: 0.6 }} />}
            </button>
          ))}
        </nav>

        {/* Sign out */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 12 }}>
          <button
            className="sp-nav-item"
            onClick={handleLogout}
            style={{ color: 'var(--color-danger)' }}
          >
            <LogOut size={16} />
            Sign out
          </button>
        </div>
      </div>

      {/* ── Main content ── */}
      <div style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        overflow: 'hidden',
        animation: `${pAnim} 0.30s cubic-bezier(0.34,1.3,0.64,1) 0.05s forwards`,
        opacity: 0,
      }}>
        {/* Top bar */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '24px 32px 0',
          flexShrink: 0,
        }}>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--color-primary)', letterSpacing: '-0.01em' }}>
            {NAV_ITEMS.find(n => n.id === section)?.label ?? 'Settings'}
          </h1>
          <button
            onClick={close}
            title="Close (Esc)"
            style={{
              width: 34, height: 34, borderRadius: 10, border: 'none',
              background: 'rgba(255,255,255,0.07)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--color-subtle)',
              transition: 'background 0.12s',
            }}
            onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.12)')}
            onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.07)')}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px 40px' }}>

          {/* ── ACCOUNT ── */}
          {section === 'account' && (
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="sp-card" style={{ display: 'flex', alignItems: 'center', gap: 18 }}>
                <Avatar displayName={user?.displayName ?? ''} avatarUrl={user?.avatarUrl} size="lg" />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ margin: '0 0 2px', fontSize: 20, fontWeight: 800, color: 'var(--color-primary)' }}>
                    {user?.displayName}
                  </p>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--color-muted)' }}>@{user?.username}</p>
                </div>
                {user?.role && (
                  <span style={{
                    fontSize: 11, fontWeight: 700, flexShrink: 0,
                    padding: '4px 10px', borderRadius: 8,
                    background: user.role === 'ADMIN'
                      ? 'rgba(139,124,248,0.18)' : user.role === 'MODERATOR'
                      ? 'rgba(62,207,142,0.15)' : 'rgba(255,255,255,0.07)',
                    color: user.role === 'ADMIN'
                      ? 'var(--color-accent)' : user.role === 'MODERATOR'
                      ? 'var(--color-online)' : 'var(--color-subtle)',
                    textTransform: 'uppercase', letterSpacing: '0.07em',
                  }}>
                    {user.role}
                  </span>
                )}
              </div>

              <div className="sp-card">
                <p className="sp-label">Account Info</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {[
                    { label: 'Display Name', value: user?.displayName },
                    { label: 'Username',     value: `@${user?.username}` },
                    { label: 'Role',         value: user?.role },
                  ].map(row => (
                    <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: 12, color: 'var(--color-muted)' }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--color-primary)' }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── APPEARANCE ── */}
          {section === 'appearance' && (
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Theme */}
              <div className="sp-card">
                <p className="sp-label">Theme</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  {THEMES.map(t => {
                    const active = theme === t.id;
                    return (
                      <button
                        key={t.id}
                        onClick={() => setTheme(t.id)}
                        title={t.description}
                        style={{
                          flex: 1, display: 'flex', flexDirection: 'column', gap: 10,
                          padding: '12px', borderRadius: 12, cursor: 'pointer',
                          border: active ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.07)',
                          background: active ? 'var(--color-accent-muted)' : 'rgba(255,255,255,0.03)',
                          transition: 'all 0.15s',
                        }}
                      >
                        <div style={{ width: '100%', height: 44, borderRadius: 8, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ flex: 1, background: t.swatches[0] }} />
                          <div style={{ width: 28, background: t.swatches[1] }} />
                        </div>
                        <span style={{ fontSize: 12, fontWeight: active ? 700 : 600, color: active ? 'var(--color-accent)' : 'var(--color-muted)', textAlign: 'left' }}>
                          {t.label}
                        </span>
                        {active && <span style={{ fontSize: 10, color: 'var(--color-muted)', textAlign: 'left', marginTop: -6 }}>{t.description}</span>}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Chat Background */}
              <div className="sp-card">
                <p className="sp-label">Chat Background</p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {/* None */}
                  <button
                    onClick={() => setChatBackground(null)}
                    style={{
                      height: 72, borderRadius: 10,
                      border: !chatBackground ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.07)',
                      background: 'var(--color-base)', cursor: 'pointer',
                      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 4,
                      transition: 'border-color 0.15s',
                    }}
                  >
                    <span style={{ fontSize: 20, opacity: 0.35 }}>✕</span>
                    <span style={{ fontSize: 10, color: 'var(--color-muted)', fontWeight: 600 }}>None</span>
                  </button>

                  {CHAT_BACKGROUNDS.map(bg => {
                    const active = chatBackground === bg.id;
                    return (
                      <button
                        key={bg.id}
                        onClick={() => setChatBackground(bg.id)}
                        title={bg.label}
                        style={{
                          height: 72, borderRadius: 10, overflow: 'hidden', padding: 0, cursor: 'pointer',
                          border: active ? '2px solid var(--color-accent)' : '2px solid rgba(255,255,255,0.07)',
                          backgroundImage: `url('${chatBgUrl(bg.id)}')`,
                          backgroundSize: 'cover', backgroundPosition: 'center',
                          position: 'relative', transition: 'border-color 0.15s',
                        }}
                      >
                        <div style={{
                          position: 'absolute', inset: 0,
                          background: active ? 'rgba(139,124,248,0.35)' : 'rgba(0,0,0,0.40)',
                          display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 4px 6px',
                        }}>
                          <span style={{ fontSize: 9, fontWeight: 700, color: '#fff', textAlign: 'center', lineHeight: 1.3 }}>{bg.label}</span>
                        </div>
                        {active && (
                          <div style={{
                            position: 'absolute', top: 4, right: 4,
                            width: 16, height: 16, borderRadius: '50%',
                            background: 'var(--color-accent)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <span style={{ fontSize: 9, color: '#fff' }}>✓</span>
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {/* ── DOWNLOADS ── */}
          {section === 'downloads' && (
            <div style={{ maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
              {/* Desktop update checker */}
              {platform.isDesktop && (
                <div className="sp-card">
                  <p className="sp-label">Desktop App</p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Version</p>
                      <p style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--color-primary)' }}>
                        {(window as any).__onyx?.version ? `v${(window as any).__onyx.version}` : 'v1.8.0'}
                      </p>
                    </div>
                    <button
                      onClick={showRestart ? () => platform.quitAndInstall?.() : handleCheckUpdates}
                      disabled={btnDisabled}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 16px', borderRadius: 8, border: 'none',
                        background: btnBg, color: btnColor,
                        fontSize: 12, fontWeight: 700,
                        cursor: btnDisabled ? 'default' : 'pointer',
                        transition: 'all 0.15s',
                      }}
                    >
                      {btnIcon}{btnLabel}
                    </button>
                  </div>
                  {statusLine && (
                    <p style={{ margin: '10px 0 0', fontSize: 11, color: 'var(--color-muted)', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 10 }}>
                      {statusLine}
                    </p>
                  )}
                  {s?.state === 'downloading' && (
                    <div style={{ marginTop: 8, height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.1)', overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${s.percent}%`, background: 'var(--color-online)', transition: 'width 0.3s ease', borderRadius: 2 }} />
                    </div>
                  )}
                </div>
              )}

              {/* Download links */}
              <div className="sp-card">
                <p className="sp-label">Get Onyx</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <a href={DOWNLOAD_WINDOWS} target="_blank" rel="noreferrer" className="sp-dl-link">
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(139,124,248,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Monitor size={20} style={{ color: 'var(--color-accent)' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>Windows Desktop</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Onyx-Setup.exe · v1.7.0</p>
                    </div>
                  </a>
                  <a href={DOWNLOAD_ANDROID} target="_blank" rel="noreferrer" className="sp-dl-link"
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(62,207,142,0.10)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(62,207,142,0.3)'; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'; (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.07)'; }}
                  >
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(62,207,142,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Smartphone size={20} style={{ color: 'var(--color-online)' }} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--color-primary)' }}>Android</p>
                      <p style={{ margin: 0, fontSize: 12, color: 'var(--color-muted)' }}>Onyx.apk · v1.7.0</p>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
