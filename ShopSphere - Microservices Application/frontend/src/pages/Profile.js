import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get('/users/me').then((r) => setProfile(r.data.profile)).catch((e) => setError(e.message));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data } = await api.put('/users/me', {
        name: profile.name, phone: profile.phone, avatarUrl: profile.avatarUrl,
      });
      setProfile(data.profile);
    } catch (e) {
      setError(e.response?.data?.error || 'Update failed');
    } finally {
      setSaving(false);
    }
  };

  if (error) return <div className="card error">{error}</div>;
  if (!profile) return <div className="card">Loading...</div>;

  return (
    <div className="card" style={{ maxWidth: 520, margin: '0 auto' }}>
      <h2 style={{ marginBottom: 12 }}>My Profile</h2>
      <label>Name</label>
      <input value={profile.name || ''} onChange={(e) => setProfile({ ...profile, name: e.target.value })} />
      <label>Phone</label>
      <input value={profile.phone || ''} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} />
      <label>Avatar URL</label>
      <input value={profile.avatarUrl || ''} onChange={(e) => setProfile({ ...profile, avatarUrl: e.target.value })} />
      <button className="btn" onClick={save} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
      <p style={{ marginTop: 12, fontSize: 13, color: '#666' }}>Email: {profile.email}</p>
    </div>
  );
}
