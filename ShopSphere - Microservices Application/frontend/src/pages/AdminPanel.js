import { useEffect, useState } from 'react';
import api from '../api/client';

export default function AdminPanel() {
  const [orders, setOrders] = useState([]);
  const load = () => api.get('/orders').then(r => setOrders(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  const updateStatus = async (id, status) => {
    await api.put(`/orders/${id}/status`, { status });
    load();
  };

  return (
    <div className="card">
      <h2>Admin Panel — All Orders</h2>
      <table>
        <thead><tr><th>User</th><th>Products</th><th>Total</th><th>Status</th><th>Set Status</th></tr></thead>
        <tbody>
          {orders.map(o => (
            <tr key={o._id}>
              <td>{o.userEmail}</td>
              <td>{o.items.map(i => i.product).join(', ')}</td>
              <td>${o.total.toFixed(2)}</td>
              <td><span className="badge">{o.status}</span></td>
              <td>
                <select value={o.status} onChange={e => updateStatus(o._id, e.target.value)}>
                  {['pending','paid','shipped','delivered','cancelled'].map(s => <option key={s} value={s}>{s}</option>)}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
