import React, { useEffect, useState } from 'react';
import api from '../api';

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/orders/me')
      .then((r) => setOrders(r.data.orders))
      .finally(() => setLoading(false));
  }, []);

  const cancel = async (id) => {
    if (!window.confirm('Cancel this order?')) return;
    await api.patch(`/orders/${id}/cancel`);
    setOrders((o) => o.map((x) => x._id === id ? { ...x, status: 'cancelled' } : x));
  };

  if (loading) return <div className="card">Loading orders...</div>;
  if (!orders.length) return <div className="card">No orders yet.</div>;

  return (
    <>
      <h2 style={{ marginBottom: 16 }}>My Orders</h2>
      {orders.map((o) => (
        <div key={o._id} className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <b>{o.orderNumber}</b>
              <div style={{ fontSize: 13, color: '#666' }}>{new Date(o.createdAt).toLocaleString()}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{
                display: 'inline-block', padding: '4px 10px', borderRadius: 999,
                background: o.status === 'cancelled' ? '#fde2e2' : '#e2f5ea',
                fontSize: 12, fontWeight: 700, textTransform: 'uppercase'
              }}>{o.status}</div>
              <div style={{ fontWeight: 700, marginTop: 6 }}>₹{o.total}</div>
            </div>
          </div>
          <ul style={{ marginTop: 12, paddingLeft: 18 }}>
            {o.items.map((i, idx) => (
              <li key={idx}>{i.name} × {i.quantity} — ₹{i.price * i.quantity}</li>
            ))}
          </ul>
          {['pending', 'paid'].includes(o.status) && (
            <button className="btn secondary" onClick={() => cancel(o._id)}>Cancel Order</button>
          )}
        </div>
      ))}
    </>
  );
}
