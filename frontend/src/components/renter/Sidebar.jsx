import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Sidebar.css';

const Sidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const getActivePage = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'dashboard';
    if (path.includes('/profile')) return 'profile';
    if (path.includes('/payments')) return 'payments';
    if (path.includes('/complaints')) return 'complaints';
    if (path.includes('/messages')) return 'messages';
    return 'dashboard';
  };

  const activePage = getActivePage();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: '📊', path: '/dashboard' },
    { id: 'profile', label: 'Profile', icon: '👤', path: '/profile' },
    { id: 'payments', label: 'Payments', icon: '💳', path: '/payments' },
    { id: 'complaints', label: 'Complaints', icon: '🛠️', path: '/complaints' },
    { id: 'messages', label: 'Messages', icon: '💬', path: '/messages' },
  ];

  const handleNavigation = (path) => {
    navigate(path);
    // Close sidebar on mobile after navigation
    setSidebarOpen(false);
  };

  return (
    <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
      <div className="sidebar-inner">
        <div className="sidebar-header">
          <div className="app-brand">
            <span className="brand-icon">🏠</span>
            <div>
              <h2 className="brand-title">Ottalika</h2>
              <p className="brand-subtitle">Smart Living</p>
            </div>
          </div>
          <button
            className="close-sidebar"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {menuItems.map((item) => (
            <button
              key={item.id}
              className={`nav-item ${activePage === item.id ? 'active' : ''}`}
              onClick={() => handleNavigation(item.path)}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="user-info">
            <div className="user-avatar">AR</div>
            <div>
              <p className="user-name">Ahmed Rahman</p>
              <p className="user-apartment">A-101 • Renter</p>
            </div>
          </div>
          <button
            className="logout-btn"
            onClick={() => {
              if (window.confirm('Are you sure you want to logout?')) {
                navigate('/');
                alert('Logged out successfully!');
              }
            }}
          >
            <span className="logout-icon">→</span>
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;