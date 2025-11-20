import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';


interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen = true, onClose }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const navigation = [
    {
      name: 'Dashboard',
      path: '/',
      icon: '🏠',
      description: 'Stock overview and alerts'
    },
    {
      name: 'Stock Management',
      path: '/stock',
      icon: '📦',
      description: 'Manage stock movements'
    },
    {
      name: 'Products',
      path: '/products',
      icon: '📋',
      description: 'View and manage products'
    },
    {
      name: 'Reports',
      path: '/reports',
      icon: '📊',
      description: 'Generate reports'
    }
  ];

  const handleNavigation = (path: string) => {
    navigate(path);
    if (onClose) {
      onClose();
    }
  };

  const isActivePath = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {!isOpen && onClose && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        {/* Sidebar Header */}
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">🏪</div>
            <div className="brand-text">
              <h2>Solai Store</h2>
              <p>Stock System</p>
            </div>
          </div>
          
          {onClose && (
            <button 
              className="sidebar-close"
              onClick={onClose}
              aria-label="Close sidebar"
            >
              <span className="close-icon">×</span>
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="sidebar-nav">
          <ul className="nav-list">
            {navigation.map((item) => (
              <li key={item.path} className="nav-item">
                <button
                  onClick={() => handleNavigation(item.path)}
                  className={`nav-link ${isActivePath(item.path) ? 'nav-link-active' : ''}`}
                  title={item.description}
                >
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-content">
                    <span className="nav-title">{item.name}</span>
                    <span className="nav-description">{item.description}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Sidebar Footer */}
        <div className="sidebar-footer">
          <div className="system-info">
            <div className="system-status">
              <div className="status-indicator online"></div>
              <span>System Online</span>
            </div>
            <div className="system-version">
              <span>v1.0.0</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;