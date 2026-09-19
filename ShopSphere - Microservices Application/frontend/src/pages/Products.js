import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api';

const DEMO_PRODUCTS = [
  { id: 'p1', name: 'Wireless Headphones', price: 2999, image: '🎧' },
  { id: 'p2', name: 'Mechanical Keyboard', price: 4599, image: '⌨️' },
  { id: 'p3', name: '4K Monitor', price: 18999, image: '🖥️' },
  { id: 'p4', name: 'USB-C Hub', price: 1499, image: '🔌' },
  { id: 'p5', name: 'Ergonomic Mouse', price: 999, image: '🖱️' },
  { id: 'p6', name: 'Laptop Stand', price: 1299, image: '💻' },
];

export default function Products() {
  const nav = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const [cart, setCart] = useState(() => JSON.parse(localStorage.getItem('cart') || '[]'));
  const [msg, setMsg] = useState('');

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));
  }, [cart]);

  const add = (p) => {
    setCart((c) => {
      const existing = c.find((i) => i.productId === p.id);
      if (existing) return c.map((i) => i.productId === p.id ? { ...i, quantity: i.quantity + 1 } : i);
      return [...c, { productId: p.id, name: p.name, price: p.price, quantity: 1 }];
    });
    setMsg(`${p.name} added to cart`);
    setTimeout(() => setMsg(''), 1800);
  };

  const checkout = async () => {
    if (!user) return nav('/login');
    if (!cart.length) return alert('Cart is empty');
    try {
      const { data } = await api.post('/orders', { items: cart });
      localStorage.removeItem('cart');
      setCart([]);
      alert(`Order placed: ${data.order.orderNumber}`);
      nav('/orders');
    } catch (err) {
      alert(err.response?.data?.error || 'Checkout failed');
    }
  };

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  return (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2>Products</h2>
        <div>
          🛒 Cart: <b>{cart.reduce((s, i) => s + i.quantity, 0)}</b> items
          {cart.length > 0 && (
            <span> • ₹{total} <button className="btn" style={{ marginLeft: 8 }} onClick={checkout}>Checkout</button></span>
          )}
        </div>
      </div>
      {msg && <div className="success">{msg}</div>}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 16 }}>
        {DEMO_PRODUCTS.map((p) => (
          <div key={p.id} className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 48 }}>{p.image}</div>
            <h3 style={{ margin: '10px 0' }}>{p.name}</h3>
            <p style={{ fontWeight: 700 }}>₹{p.price}</p>
            <button className="btn" onClick={() => add(p)}>Add to Cart</button>
          </div>
        ))}
      </div>
    </>
  );
}
