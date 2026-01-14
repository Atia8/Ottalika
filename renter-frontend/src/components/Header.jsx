import React from 'react';
import { useLocation } from 'react-router-dom';
import './Header.css';

const Header = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();

  const getPageTitle = () => {
    const path = location.pathname;
    if (path.includes('/dashboard')) return 'Dashboard';
    if (path.includes('/profile')) return 'My Profile';
    if (path.includes('/payments')) return 'Payments';
    if (path.includes('/complaints')) return 'Complaints';
    if (path.includes('/messages')) return 'Messages';
    return 'Dashboard';
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <header className="header">
      <div className="header-container">
        <div className="header-left">
          <button
            className="menu-toggle"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle menu"
          >
            <span className="menu-line"></span>
            <span className="menu-line"></span>
            <span className="menu-line"></span>
          </button>

          <div className="page-info">
            <h1 className="page-title">{getPageTitle()}</h1>
            <p className="page-subtitle">{getGreeting()}, Ahmed</p>
          </div>
        </div>

        <div className="header-right">
          <div className="current-date">
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </div>

          <button className="notification-btn" aria-label="Notifications">
            <span className="notification-icon">🔔</span>
            <span className="notification-badge">3</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;