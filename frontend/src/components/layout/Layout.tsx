import React from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import './Layout.css';

const Layout: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    { path: '/', label: 'Dashboard', icon: '🏠' },
    { path: '/stock', label: 'Stock Management', icon: '📦' },
    { path: '/products', label: 'Products', icon: '📋' },
    { path: '/reports', label: 'Reports', icon: '📊' },
  ];

  return (
    <div className="layout">
      <nav className="sidebar">
        <div className="sidebar-header">
          <h2>Solai Store</h2>
        </div>
        <ul className="sidebar-nav">
          {navigation.map(item => (
            <li key={item.path}>
              <button
                onClick={() => navigate(item.path)}
                className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              >
                <span className="nav-icon">{item.icon}</span>
                <span className="nav-label">{item.label}</span>
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <main className="main-content">
        {/* This renders the active child route element */}
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
