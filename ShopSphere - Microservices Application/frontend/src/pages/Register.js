import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../api';

export default function Register() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const onChange = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      nav('/');
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.errors?.[0]?.msg || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 420, margin: '40px auto' }}>
      <h2 style={{ marginBottom: 16 }}>Create account</h2>
      {error && <div className="error">{error}</div>}
      <form onSubmit={submit}>
        <input placeholder="Name" value={form.name} onChange={onChange('name')} required />
        <input type="email" placeholder="Email" value={form.email} onChange={onChange('email')} required />
        <input type="password" placeholder="Password (min 6 chars)"
               value={form.password} onChange={onChange('password')} required minLength={6} />
        <button className="btn" disabled={loading}>{loading ? '...' : 'Register'}</button>
      </form>
      <p style={{ marginTop: 12, fontSize: 14 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
