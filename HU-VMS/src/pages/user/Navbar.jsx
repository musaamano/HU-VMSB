import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css'; // Create this CSS file

const Navbar = ({ unreadCount = 0 }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', name: 'Dashboard', icon: '🏠', color: 'blue' },
    { path: '/requests', name: 'Requests', icon: '📋', color: 'green' },
    { path: '/submit-complaint', name: 'Complaint', icon: '⚠️', color: 'red' },
    { path: '/submit-request', name: 'New Request', icon: '🚗', color: 'purple' },
    { path: '/notifications', name: 'Notifications', icon: '🔔', color: 'orange' },
  ];

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="user-navbar">
      <div className="navbar-container">
        {/* Logo */}
        <div className="navbar-logo">
          <span>USER PORTAL</span>
        </div>
        
        {/* Navigation Items */}
        <div className="navbar-menu">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive(item.path) ? `active active-${item.color}` : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-text">{item.name}</span>
              {item.path === '/notifications' && unreadCount > 0 && (
                <span className="nav-badge">{unreadCount}</span>
              )}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;