import React from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';
import Orders from './pages/Orders';
import Products from './pages/Products';

function Nav() {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <nav className="nav">
      <span className="brand">🛍️ ShopSphere</span>
      <NavLink to="/">Products</NavLink>
      {user && <NavLink to="/orders">Orders</NavLink>}
      {user && <NavLink to="/profile">Profile</NavLink>}
      <span className="spacer" />
      {user ? (
        <>
          <span style={{ fontSize: 14 }}>Hi, {user.name}</span>
          <button className="btn secondary" onClick={logout}>Logout</button>
        </>
      ) : (
        <>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register">Register</NavLink>
        </>
      )}
    </nav>
  );
}

export default function App() {
  return (
    <>
      <Nav />
      <div className="container">
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/orders" element={<Orders />} />
        </Routes>
      </div>
    </>
  );
}
