import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Hash, Trash2, Plus, Volume2, Loader2,
  ArrowLeft, Shield, Settings, Copy, Check, Pencil,
} from 'lucide-react';
import { apiClient } from '../api/client';
import { useChannelStore } from '../stores/channelStore';
import { useAuthStore } from '../stores/authStore';
import { User, Channel } from '@onyx/types';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

type Tab = 'users' | 'channels' | 'settings';

export function AdminPage() {
  const navigate   = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers]     = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const { user: me, login }   = useAuthStore();

  // ── Create user ──────────────────────────────────────────────────
  const [showCreateUser, setShowCreateUser]   = useState(false);
  const [newDisplayName, setNewDisplayName]   = useState('');
  const [creating, setCreating]               = useState(false);
  const [createError, setCreateError]         = useState('');
  const [createdUser, setCreatedUser]         = useState<{ username: string; displayName: string } | null>(null);
  const [copied,      setCopied]              = useState(false);

  // ── Create channel ───────────────────────────────────────────────
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName]       = useState('');
  const [newChannelType, setNewChannelType]       = useState<'TEXT' | 'VOICE'>('TEXT');

  // ── Settings ─────────────────────────────────────────────────────
  const [serverName,    setServerName]    = useState('');
  const [adminName,     setAdminName]     = useState('');
  const [savingServer,  setSavingServer]  = useState(false);
  const [savingAdmin,   setSavingAdmin]   = useState(false);
  const [settingsSaved, setSettingsSaved] = useState('');

  const { channels, addChannel, removeChannel, communityName, fetchCommunity } = useChannelStore();

  useEffect(() => {
    fetchUsers();
    setServerName(communityName);
    setAdminName(me?.displayName ?? '');
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users');
      setUsers(data);
    } finally { setLoading(false); }
  };

  /* ── Create user (display name only) ─────────────────────────── */
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await apiClient.post('/users', { displayName: newDisplayName });
      setUsers((u) => [...u, data]);
      setCreatedUser(data);   // show the generated ID
      setNewDisplayName('');
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to create user');
    } finally { setCreating(false); }
  };

  const handleCopyId = () => {
    if (!createdUser) return;
    navigator.clipboard.writeText(createdUser.username);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Delete user ──────────────────────────────────────────────── */
  const handleDeleteUser = async (userId: string, displayName: string) => {
    if (!confirm(`Delete ${displayName}? This is permanent.`)) return;
    await apiClient.delete(`/users/${userId}`);
    setUsers((u) => u.filter((user) => user.id !== userId));
  };

  /* ── Create channel ───────────────────────────────────────────── */
  const handleCreateChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { data } = await apiClient.post('/channels', { name: newChannelName, type: newChannelType });
      addChannel(data);
      setShowCreateChannel(false);
      setNewChannelName('');
    } catch (err: any) {
      alert(err.response?.data?.message ?? 'Failed to create channel');
    }
  };

  const handleDeleteChannel = async (channelId: string, name: string) => {
    if (!confirm(`Delete #${name}? All messages will be deleted.`)) return;
    await apiClient.delete(`/channels/${channelId}`);
    removeChannel(channelId);
  };

  /* ── Save server name ─────────────────────────────────────────── */
  const handleSaveServerName = async () => {
    if (!serverName.trim()) return;
    setSavingServer(true);
    try {
      await apiClient.patch('/community/name', { name: serverName.trim() });
      await fetchCommunity();
      setSettingsSaved('Server name updated!');
      setTimeout(() => setSettingsSaved(''), 2500);
    } catch { alert('Failed to update server name'); }
    finally { setSavingServer(false); }
  };

  /* ── Save admin display name ──────────────────────────────────── */
  const handleSaveAdminName = async () => {
    if (!adminName.trim() || !me) return;
    setSavingAdmin(true);
    try {
      const { data } = await apiClient.patch(`/users/${me.id}`, { displayName: adminName.trim() });
      // Update auth store
      useAuthStore.setState((s) => ({ ...s, user: data }));
      setSettingsSaved('Display name updated!');
      setTimeout(() => setSettingsSaved(''), 2500);
    } catch { alert('Failed to update display name'); }
    finally { setSavingAdmin(false); }
  };

  /* ── Render ───────────────────────────────────────────────────── */
  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'users',    label: 'Users',    icon: <Users size={14} /> },
    { key: 'channels', label: 'Channels', icon: <Hash size={14} />  },
    { key: 'settings', label: 'Settings', icon: <Settings size={14} /> },
  ];

  return (
    <div className="flex flex-col h-screen overflow-hidden" style={{ background: 'var(--color-panel)', animation: 'page-enter 0.2s ease-out' }}>

      {/* ── Header ─────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '0 24px', height: 'var(--size-header)', background: 'var(--color-base)', borderBottom: '1px solid var(--color-border)', flexShrink: 0 }}>
        <button onClick={() => navigate(-1)} className="btn-ghost" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
          <ArrowLeft size={18} /> Back
        </button>
        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />
        <Shield size={18} style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>Admin Panel</span>
        <div style={{ flex: 1 }} />
        {tab === 'users' && (
          <button onClick={() => setShowCreateUser(true)} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Plus size={15} /> Add User
          </button>
        )}
        {tab === 'channels' && (
          <button onClick={() => setShowCreateChannel(true)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}>
            <Plus size={15} /> Add Channel
          </button>
        )}
      </div>

      {/* ── Tabs + Content ─────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 0' }}>
          <div className="flex gap-1 mb-6">
            {TABS.map((t) => (
              <button key={t.key} onClick={() => setTab(t.key)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 18px', borderRadius: 'var(--radius-control)', fontSize: 14, fontWeight: 500, background: tab === t.key ? 'var(--color-active)' : 'transparent', color: tab === t.key ? 'var(--color-primary)' : 'var(--color-muted)', transition: 'background 0.15s' }}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>

          {/* Users */}
          {tab === 'users' && (
            <div className="flex flex-col gap-2">
              {loading && <Loader2 size={16} className="animate-spin text-muted mx-auto mt-8" />}
              {users.map((user) => (
                <div key={user.id} className="flex items-center gap-3 p-3 bg-input rounded-xl">
                  <Avatar displayName={user.displayName} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{user.displayName}</p>
                    <p className="text-xs text-muted font-mono">{user.username}</p>
                  </div>
                  {user.role === 'ADMIN' ? (
                    <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
                  ) : (
                    <button onClick={() => handleDeleteUser(user.id, user.displayName)} className="btn-ghost p-2 text-muted hover:text-danger transition-colors">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Channels */}
          {tab === 'channels' && (
            <div className="flex flex-col gap-2">
              {channels.map((ch) => (
                <div key={ch.id} className="flex items-center gap-3 p-3 bg-input rounded-xl">
                  {ch.type === 'TEXT' ? <Hash size={16} className="text-muted flex-shrink-0" /> : <Volume2 size={16} className="text-muted flex-shrink-0" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-primary">{ch.name}</p>
                    <p className="text-xs text-muted">{ch.type}</p>
                  </div>
                  <button onClick={() => handleDeleteChannel(ch.id, ch.name)} className="btn-ghost p-2 text-muted hover:text-danger transition-colors">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Settings */}
          {tab === 'settings' && (
            <div className="flex flex-col gap-6" style={{ maxWidth: 480 }}>
              {settingsSaved && (
                <div style={{ padding: '10px 14px', background: 'rgba(62,207,142,0.12)', border: '1px solid rgba(62,207,142,0.3)', borderRadius: 8, fontSize: 13, color: 'var(--color-online)' }}>
                  ✓ {settingsSaved}
                </div>
              )}

              {/* Server Name */}
              <div style={{ background: 'var(--color-input)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                  Server Settings
                </h3>
                <label className="block text-xs font-semibold text-muted mb-2">Server Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input-field flex-1"
                    value={serverName}
                    onChange={(e) => setServerName(e.target.value)}
                    maxLength={64}
                    placeholder="Enter server name"
                  />
                  <button
                    onClick={handleSaveServerName}
                    disabled={savingServer || !serverName.trim()}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
                  >
                    {savingServer ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                    Save
                  </button>
                </div>
              </div>

              {/* Admin Display Name */}
              <div style={{ background: 'var(--color-input)', borderRadius: 12, padding: 20 }}>
                <h3 style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 14px' }}>
                  Your Profile
                </h3>
                <label className="block text-xs font-semibold text-muted mb-2">Display Name</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <input
                    className="input-field flex-1"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    maxLength={32}
                    placeholder="Your display name"
                  />
                  <button
                    onClick={handleSaveAdminName}
                    disabled={savingAdmin || !adminName.trim()}
                    className="btn-primary"
                    style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
                  >
                    {savingAdmin ? <Loader2 size={14} className="animate-spin" /> : <Pencil size={14} />}
                    Update
                  </button>
                </div>
                <p className="text-xs text-subtle mt-2">Login ID: <span className="font-mono">{me?.username}</span></p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Create User Modal ───────────────────────────────────────── */}
      {showCreateUser && (
        <Modal title="Add User" onClose={() => { setShowCreateUser(false); setCreatedUser(null); setCreateError(''); }}>
          {createdUser ? (
            /* Show generated ID after creation */
            <div className="flex flex-col gap-4">
              <div style={{ textAlign: 'center', padding: '8px 0' }}>
                <Avatar displayName={createdUser.displayName} size="sm" />
                <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--color-primary)', marginTop: 10 }}>{createdUser.displayName}</p>
                <p style={{ fontSize: 12, color: 'var(--color-muted)', margin: '4px 0 16px' }}>Account created</p>
              </div>
              <div style={{ background: 'var(--color-base)', borderRadius: 10, padding: 14 }}>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Login ID — share this with the user
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <code style={{ flex: 1, fontSize: 16, fontFamily: 'monospace', color: 'var(--color-accent)', background: 'rgba(139,124,248,0.1)', padding: '8px 12px', borderRadius: 8, letterSpacing: '0.05em' }}>
                    {createdUser.username}
                  </code>
                  <button onClick={handleCopyId} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13 }}>
                    {copied ? <Check size={13} style={{ color: 'var(--color-online)' }} /> : <Copy size={13} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>
              <button onClick={() => { setCreatedUser(null); setNewDisplayName(''); }} className="btn-secondary">
                Create Another
              </button>
            </div>
          ) : (
            /* Create form */
            <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Display Name</label>
                <input
                  className="input-field"
                  placeholder="e.g. John"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                  autoFocus
                  maxLength={32}
                />
                <p className="text-[10px] text-subtle mt-1">A unique login ID (onyx_XXXXXXX) will be generated automatically</p>
              </div>
              {createError && <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{createError}</p>}
              <div className="flex justify-end gap-2 mt-2">
                <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={creating || !newDisplayName.trim()} className="btn-primary flex items-center gap-2">
                  {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                  Create User
                </button>
              </div>
            </form>
          )}
        </Modal>
      )}

      {/* ── Create Channel Modal ────────────────────────────────────── */}
      {showCreateChannel && (
        <Modal title="Add Channel" onClose={() => setShowCreateChannel(false)}>
          <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Channel Name</label>
              <input className="input-field" placeholder="e.g. general" value={newChannelName} onChange={(e) => setNewChannelName(e.target.value.toLowerCase())} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type</label>
              <div className="flex gap-2">
                {(['TEXT', 'VOICE'] as const).map((t) => (
                  <button key={t} type="button" onClick={() => setNewChannelType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${newChannelType === t ? 'bg-accent text-white' : 'bg-input text-muted hover:text-primary'}`}>
                    {t === 'TEXT' ? <Hash size={14} /> : <Volume2 size={14} />} {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowCreateChannel(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={!newChannelName} className="btn-primary">Create Channel</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
