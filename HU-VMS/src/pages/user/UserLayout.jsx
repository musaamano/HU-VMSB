import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, getUserNotifications } from '../../api/api';
import './user.css';

const UserLayout = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const data = await getUserNotifications();
      const newUnread = Array.isArray(data) ? data.filter(n => !n.read).length : 0;
      setNotifications(Array.isArray(data) ? data : []);
      setUnreadCount(newUnread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    }
    navigate('/login');
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff} minute${diff > 1 ? 's' : ''} ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${Math.floor(hours / 24)} day${Math.floor(hours / 24) > 1 ? 's' : ''} ago`;
  };

  return (
    <div className="user-dashboard-wrapper">
      {/* Mobile Menu Toggle */}
      <button className="user-mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={`user-hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="user-mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <div className={`user-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="user-sidebar-header">
          <div className="user-logo">
            <span className="user-logo-icon">🚗</span>
            <span className="user-logo-text">USER PORTAL</span>
          </div>
          <div className="user-sidebar-name">
            {currentUser?.name || 'User'}
            <span className="user-sidebar-subtitle">Welcome back!</span>
          </div>
        </div>

        <nav className="user-sidebar-nav">
          <Link
            to="/user/dashboard"
            className={`${location.pathname === '/user/dashboard' || location.pathname === '/user' ? 'user-nav-item active' : 'user-nav-item'}`}
            onClick={closeMobileMenu}
          >
            <span className="user-nav-icon">📊</span>
            <span className="user-nav-text">Dashboard</span>
          </Link>

          <Link
            to="/user/request-vehicle"
            className={`user-nav-item ${location.pathname === '/user/request-vehicle' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="user-nav-icon">🚗</span>
            <span className="user-nav-text">Request Vehicle</span>
          </Link>

          <Link
            to="/user/my-requests"
            className={`user-nav-item ${location.pathname === '/user/my-requests' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="user-nav-icon">�</span>
            <span className="user-nav-text">My Requests</span>
          </Link>

          <Link
            to="/user/submit-complaint"
            className={`user-nav-item ${location.pathname === '/user/submit-complaint' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="user-nav-icon">⚠️</span>
            <span className="user-nav-text">Submit Complaint</span>
          </Link>
        </nav>

        <div className="user-sidebar-footer">
          <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="user-logout-btn">
            <span className="user-logout-icon">🚪</span>
            <span className="user-logout-text">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="user-main-content">
        {/* Header */}
        <div className="user-header">
          <div className="user-header-left">
            <h1>{currentUser?.name || 'User'} Dashboard</h1>
            <p className="user-header-username">Welcome to your personal dashboard</p>
          </div>
          <div className="user-header-right">
            {/* Notification Bell */}
            <button
              className="user-notification-bell"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="user-notification-badge">{unreadCount}</span>}
            </button>

            {/* Profile Section */}
            <div className="user-profile-dropdown-container">
              <div
                className="user-header-profile-section"
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              >
                <div className="user-header-profile-avatar">
                  <div className="user-header-avatar-placeholder">
                    <span className="user-avatar-icon">👤</span>
                  </div>
                </div>
                <div className="user-header-profile-info">
                  <span className="user-header-profile-name">{currentUser?.name?.split(' ')[0] || 'User'}</span>
                </div>
                <div className="user-header-dropdown-arrow">
                  <span className={`user-dropdown-icon ${showProfileMenu ? 'rotated' : ''}`}>▼</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div className="user-profile-overlay" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="user-profile-dropdown">
                    <div className="user-profile-dropdown-header">
                      <div className="user-profile-header-avatar">
                        <div className="user-profile-avatar-placeholder"><span>👤</span></div>
                      </div>
                      <div className="user-profile-header-info">
                        <h4 className="user-profile-header-name">{currentUser?.name || 'User'}</h4>
                        <p className="user-profile-header-email">{currentUser?.email || ''}</p>
                      </div>
                    </div>
                    <div className="user-profile-menu-items">
                      <button className="user-profile-menu-item" onClick={() => { navigate('/user/profile'); setShowProfileMenu(false); }}>
                        <span className="user-profile-menu-icon">👤</span><span>My Profile</span>
                      </button>
                      <div className="user-profile-menu-divider"></div>
                      <button className="user-profile-menu-item logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                        <span className="user-profile-menu-icon">🚪</span><span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div className="user-notification-overlay" onClick={() => setShowNotifications(false)}></div>
            <div className="user-notification-dropdown">
              <div className="user-notification-dropdown-header">
                <h3>Notifications</h3>
                <div className="user-notification-actions">
                  {unreadCount > 0 && (
                    <button className="user-mark-all-read" onClick={markAllAsRead} title="Mark all as read">
                      ✓ Mark all read
                    </button>
                  )}
                  <button className="user-notification-close" onClick={() => setShowNotifications(false)}>✕</button>
                </div>
              </div>
              <div className="user-notification-list">
                {notifications.length === 0 ? (
                  <div className="user-no-notifications">
                    <span className="user-no-notifications-icon">🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 5).map(notification => (
                    <div key={notification._id} className={`user-notification-item ${notification.read ? 'read' : 'unread'} ${notification.type || ''}`}>
                      <div className="user-notification-icon">
                        {notification.type === 'approval' && '✅'}
                        {notification.type === 'trip_update' && '🚗'}
                        {(!notification.type || notification.type === 'info') && 'ℹ️'}
                      </div>
                      <div className="user-notification-content">
                        <strong className="user-notification-title">{notification.title}</strong>
                        <p className="user-notification-message">{notification.message}</p>
                        <span className="user-notification-time">{formatNotificationTime(notification.createdAt)}</span>
                      </div>
                      {!notification.read && <div className="user-notification-unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              <div className="user-notification-footer">
                <button className="user-view-all-notifications" onClick={() => { navigate('/user/notifications'); setShowNotifications(false); }}>
                  View All Notifications
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="user-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default UserLayout;
