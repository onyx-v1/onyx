import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Hash, Trash2, Plus, Volume2, Loader2, ArrowLeft, Shield } from 'lucide-react';
import { apiClient } from '../api/client';
import { useChannelStore } from '../stores/channelStore';
import { User, Channel } from '@onyx/types';
import { Modal } from '../components/ui/Modal';
import { Avatar } from '../components/ui/Avatar';

type Tab = 'users' | 'channels';

export function AdminPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  // Create user modal
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newDisplayName, setNewDisplayName] = useState('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');

  // Create channel modal
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [newChannelType, setNewChannelType] = useState<'TEXT' | 'VOICE'>('TEXT');

  const { channels, addChannel, removeChannel } = useChannelStore();

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data } = await apiClient.get('/users');
      setUsers(data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    setCreateError('');
    try {
      const { data } = await apiClient.post('/users', { username: newUsername, displayName: newDisplayName });
      setUsers((u) => [...u, data]);
      setShowCreateUser(false);
      setNewUsername('');
      setNewDisplayName('');
    } catch (err: any) {
      setCreateError(err.response?.data?.message ?? 'Failed to create user');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Delete @${username}? This is permanent.`)) return;
    await apiClient.delete(`/users/${userId}`);
    setUsers((u) => u.filter((user) => user.id !== userId));
  };

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

  return (
    <div
      className="flex flex-col h-screen overflow-hidden"
      style={{
        background: 'var(--color-panel)',
        animation: 'page-enter 0.2s ease-out',
      }}
    >
      {/* ── Admin Header ───────────────────────────────────────── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          padding: '0 24px',
          height: 'var(--size-header)',
          background: 'var(--color-base)',
          borderBottom: '1px solid var(--color-border)',
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => navigate(-1)}
          className="btn-ghost"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
          title="Back"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div style={{ width: 1, height: 20, background: 'var(--color-border)' }} />

        <Shield size={18} style={{ color: 'var(--color-accent)' }} />
        <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--color-primary)' }}>
          Admin Panel
        </span>

        <div style={{ flex: 1 }} />

        <button
          onClick={() => setShowCreateUser(true)}
          className="btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
        >
          <Plus size={15} /> Add User
        </button>
        <button
          onClick={() => setShowCreateChannel(true)}
          className="btn-secondary"
          style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 14 }}
        >
          <Plus size={15} /> Add Channel
        </button>
      </div>

      {/* ── Tabs + Content ─────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto">
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px 24px 0' }}>
          {/* Tabs */}
          <div className="flex gap-1 mb-6">
            {(['users', 'channels'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 18px',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 14, fontWeight: 500,
                  background: tab === t ? 'var(--color-active)' : 'transparent',
                  color: tab === t ? 'var(--color-primary)' : 'var(--color-muted)',
                  transition: 'background 0.15s, color 0.15s',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'users' ? <Users size={15} /> : <Hash size={15} />}
                {t}
              </button>
            ))}
          </div>

        {tab === 'users' && (
          <div className="flex flex-col gap-2">
            {loading && <Loader2 size={16} className="animate-spin text-muted mx-auto mt-8" />}
            {users.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 bg-input rounded-xl">
                <Avatar displayName={user.displayName} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">{user.displayName}</p>
                  <p className="text-xs text-muted">@{user.username}</p>
                </div>
                {user.role === 'ADMIN' ? (
                  <span className="text-[10px] bg-accent/20 text-accent px-2 py-0.5 rounded-full font-semibold">ADMIN</span>
                ) : (
                  <button
                    onClick={() => handleDeleteUser(user.id, user.username)}
                    className="btn-ghost p-2 text-muted hover:text-danger transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {tab === 'channels' && (
          <div className="flex flex-col gap-2">
            {channels.map((ch) => (
              <div key={ch.id} className="flex items-center gap-3 p-3 bg-input rounded-xl">
                {ch.type === 'TEXT' ? (
                  <Hash size={16} className="text-muted flex-shrink-0" />
                ) : (
                  <Volume2 size={16} className="text-muted flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-primary">{ch.name}</p>
                  <p className="text-xs text-muted">{ch.type}</p>
                </div>
                <button
                  onClick={() => handleDeleteChannel(ch.id, ch.name)}
                  className="btn-ghost p-2 text-muted hover:text-danger transition-colors"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
        </div>{/* end max-width container */}
      </div>{/* end flex-1 overflow */}

      {/* Create User Modal */}
      {showCreateUser && (
        <Modal title="Add User" onClose={() => setShowCreateUser(false)}>
          <form onSubmit={handleCreateUser} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Username</label>
              <input
                className="input-field"
                placeholder="e.g. jdoe"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value.toLowerCase())}
                autoFocus
              />
              <p className="text-[10px] text-subtle mt-1">Lowercase letters, numbers, underscores</p>
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Display Name</label>
              <input
                className="input-field"
                placeholder="e.g. John Doe"
                value={newDisplayName}
                onChange={(e) => setNewDisplayName(e.target.value)}
              />
            </div>
            {createError && (
              <p className="text-xs text-danger bg-danger/10 px-3 py-2 rounded-lg">{createError}</p>
            )}
            <div className="flex justify-end gap-2 mt-2">
              <button type="button" onClick={() => setShowCreateUser(false)} className="btn-secondary">Cancel</button>
              <button type="submit" disabled={creating || !newUsername || !newDisplayName} className="btn-primary flex items-center gap-2">
                {creating ? <Loader2 size={14} className="animate-spin" /> : null}
                Create User
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Create Channel Modal */}
      {showCreateChannel && (
        <Modal title="Add Channel" onClose={() => setShowCreateChannel(false)}>
          <form onSubmit={handleCreateChannel} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Channel Name</label>
              <input
                className="input-field"
                placeholder="e.g. general"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value.toLowerCase())}
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted uppercase tracking-wider mb-2">Type</label>
              <div className="flex gap-2">
                {(['TEXT', 'VOICE'] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNewChannelType(t)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                      newChannelType === t ? 'bg-accent text-white' : 'bg-input text-muted hover:text-primary'
                    }`}
                  >
                    {t === 'TEXT' ? <Hash size={14} /> : <Volume2 size={14} />}
                    {t}
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
