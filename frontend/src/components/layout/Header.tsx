import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Header.css';


interface HeaderProps {
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onToggleSidebar, sidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/':
        return 'Dashboard';
      case '/stock':
        return 'Stock Management';
      case '/products':
        return 'Products Management';
      case '/reports':
        return 'Reports & Analytics';
      default:
        return 'Solai Store System';
    }
  };

  const getPageDescription = () => {
    switch (location.pathname) {
      case '/':
        return 'Overview of stock levels and alerts';
      case '/stock':
        return 'Manage stock movements and upload Excel data';
      case '/products':
        return 'View and manage all products';
      case '/reports':
        return 'Generate stock movement reports';
      default:
        return 'Stock management system';
    }
  };

  const handleLogout = () => {
    // Add logout logic here
    console.log('Logging out...');
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header-left">
        {onToggleSidebar && (
          <button 
            className="sidebar-toggle"
            onClick={onToggleSidebar}
            aria-label={sidebarOpen ? 'Close sidebar' : 'Open sidebar'}
          >
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
            <span className="hamburger-line"></span>
          </button>
        )}
        
        <div className="header-title">
          <h1>{getPageTitle()}</h1>
          <p>{getPageDescription()}</p>
        </div>
      </div>

      <div className="header-right">
        <div className="header-actions">
          <button 
            className="header-btn"
            onClick={() => navigate('/')}
            title="Dashboard"
          >
            <span className="btn-icon">🏠</span>
            <span className="btn-text">Dashboard</span>
          </button>

          <button 
            className="header-btn"
            onClick={() => navigate('/stock')}
            title="Stock Management"
          >
            <span className="btn-icon">📦</span>
            <span className="btn-text">Stock</span>
          </button>

          <div className="header-divider"></div>

          <div className="user-info">
            <div className="user-avatar">
              <span>👤</span>
            </div>
            <div className="user-details">
              <span className="user-name">Store Manager</span>
              <span className="user-role">Administrator</span>
            </div>
          </div>

          <button 
            className="header-btn logout-btn"
            onClick={handleLogout}
            title="Logout"
          >
            <span className="btn-icon">🚪</span>
            <span className="btn-text">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;