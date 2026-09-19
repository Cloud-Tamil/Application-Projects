import { useEffect, useState } from 'react';
import api from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, spent: 0 });

  useEffect(() => {
    api.get('/orders/my').then(res => {
      const total = res.data.reduce((s, o) => s + (o.total || 0), 0);
      setStats({ orders: res.data.length, spent: total });
    }).catch(() => {});
  }, []);

  return (
    <div>
      <div className="card">
        <h2>Welcome, {user?.name} 👋</h2>
        <p>Role: <span className="badge">{user?.role}</span></p>
      </div>
      <div className="grid">
        <div className="card"><h3>My Orders</h3><p style={{ fontSize: 28, fontWeight: 'bold' }}>{stats.orders}</p></div>
        <div className="card"><h3>Total Spent</h3><p style={{ fontSize: 28, fontWeight: 'bold' }}>${stats.spent.toFixed(2)}</p></div>
      </div>
    </div>
  );
}
