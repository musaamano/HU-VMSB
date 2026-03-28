import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import './fuelstation.css';

const FuelStationLayout = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [fuelOfficerInfo, setFuelOfficerInfo] = useState(() => {
    // Initialize from localStorage if available
    const savedSettings = localStorage.getItem('fuelStationSettings');
    const savedProfilePhoto = localStorage.getItem('fuelStationProfilePhoto');

    let initialInfo = {
      name: 'Sarah Mohammed',
      email: 'sarah.mohammed@university.edu.et',
      employeeId: 'FS-2024-001',
      role: 'Fuel Station Officer',
      fuelStationName: 'Main Campus Fuel Station',
      avatar: savedProfilePhoto || null
    };

    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.account) {
          initialInfo = {
            ...initialInfo,
            name: parsed.account.name || initialInfo.name,
            email: parsed.account.email || initialInfo.email,
            employeeId: parsed.account.employeeId || initialInfo.employeeId,
            fuelStationName: parsed.account.fuelStationName || initialInfo.fuelStationName
          };
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    return initialInfo;
  });
  const navigate = useNavigate();
  const location = useLocation();

  // Apply theme on component mount and when settings change
  useEffect(() => {
    const applyTheme = () => {
      const savedSettings = localStorage.getItem('fuelStationSettings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        const theme = parsed.system?.theme || 'light';

        if (theme === 'dark') {
          document.documentElement.setAttribute('data-theme', 'dark');
          document.body.style.backgroundColor = '#1a1a1a';
          document.body.style.color = '#ffffff';
        } else if (theme === 'light') {
          document.documentElement.setAttribute('data-theme', 'light');
          document.body.style.backgroundColor = '#ffffff';
          document.body.style.color = '#000000';
        } else if (theme === 'auto') {
          const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
          document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
          document.body.style.backgroundColor = prefersDark ? '#1a1a1a' : '#ffffff';
          document.body.style.color = prefersDark ? '#ffffff' : '#000000';
        }
      }
    };

    applyTheme();

    // Listen for theme changes
    const handleStorageChange = (e) => {
      if (e.key === 'fuelStationSettings' || e.key === 'appTheme') {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Check for theme changes every second (for same-tab updates)
    const themeCheckInterval = setInterval(applyTheme, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(themeCheckInterval);
    };
  }, []);

  // Load profile photo from localStorage on component mount
  useEffect(() => {
    const loadProfileData = () => {
      const savedProfilePhoto = localStorage.getItem('fuelStationProfilePhoto');
      const savedSettings = localStorage.getItem('fuelStationSettings');

      if (savedProfilePhoto) {
        setFuelOfficerInfo(prev => ({
          ...prev,
          avatar: savedProfilePhoto
        }));
      }

      // Load name and other info from settings
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.account) {
          setFuelOfficerInfo(prev => ({
            ...prev,
            name: parsed.account.name || prev.name,
            email: parsed.account.email || prev.email,
            employeeId: parsed.account.employeeId || prev.employeeId,
            fuelStationName: parsed.account.fuelStationName || prev.fuelStationName
          }));
        }
      }
    };

    loadProfileData();

    // Listen for profile photo updates
    const handleProfilePhotoUpdate = (event) => {
      if (event.key === 'fuelStationProfilePhoto') {
        setFuelOfficerInfo(prev => ({
          ...prev,
          avatar: event.newValue
        }));
      }
    };

    // Listen for settings updates (name, email, etc.)
    const handleSettingsUpdate = (event) => {
      if (event.key === 'fuelStationSettings') {
        loadProfileData();
      }
    };

    window.addEventListener('storage', handleProfilePhotoUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    // Also listen for custom events from the same page
    const handleCustomProfileUpdate = (event) => {
      setFuelOfficerInfo(prev => ({
        ...prev,
        avatar: event.detail.profilePhoto
      }));
    };

    const handleCustomAccountUpdate = (event) => {
      console.log('Account update event received:', event.detail);
      if (event.detail.account) {
        setFuelOfficerInfo(prev => {
          const newInfo = {
            ...prev,
            name: event.detail.account.name,
            email: event.detail.account.email,
            employeeId: event.detail.account.employeeId,
            fuelStationName: event.detail.account.fuelStationName
          };
          console.log('Updating from', prev.name, 'to:', newInfo.name);
          return newInfo;
        });
      }
    };

    window.addEventListener('fuelProfilePhotoUpdated', handleCustomProfileUpdate);
    window.addEventListener('accountSettingsUpdated', handleCustomAccountUpdate);

    // Check for settings changes every second (for same-tab updates)
    const settingsCheckInterval = setInterval(loadProfileData, 1000);

    return () => {
      window.removeEventListener('storage', handleProfilePhotoUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('fuelProfilePhotoUpdated', handleCustomProfileUpdate);
      window.removeEventListener('accountSettingsUpdated', handleCustomAccountUpdate);
      clearInterval(settingsCheckInterval);
    };
  }, []);

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const loadNotifications = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const res = await fetch('/api/fuel/notifications', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      });
      const text = await res.text();
      const data = text ? JSON.parse(text) : [];
      const notifs = Array.isArray(data) ? data : [];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    } catch (err) {
      console.error('Error loading notifications:', err);
      setNotifications([]);
      setUnreadCount(0);
    }
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
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
    } else {
      navigate('/login');
    }
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const notificationDate = new Date(timestamp);
    const diffInMinutes = Math.floor((now - notificationDate) / 60000);

    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;

    return notificationDate.toLocaleDateString();
  };

  return (
    <div className="fuel-dashboard-wrapper">
      {/* Mobile Menu Toggle */}
      <button className="fuel-mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={`fuel-hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="fuel-mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <div className={`fuel-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="fuel-sidebar-header">
          <div className="fuel-logo">
            <span className="fuel-logo-icon">⛽</span>
            <span className="fuel-logo-text">FUEL STATION</span>
          </div>
        </div>

        <nav className="fuel-sidebar-nav">
          <Link
            to="/fuel/dashboard"
            className={`fuel-nav-item ${location.pathname === '/fuel/dashboard' || location.pathname === '/fuel' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/fuel/requests"
            className={`fuel-nav-item ${location.pathname === '/fuel/requests' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">📋</span>
            <span>Fuel Requests</span>
          </Link>

          <Link
            to="/fuel/dispense"
            className={`fuel-nav-item ${location.pathname === '/fuel/dispense' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">⛽</span>
            <span>Dispense Fuel</span>
          </Link>

          <Link
            to="/fuel/inventory"
            className={`fuel-nav-item ${location.pathname === '/fuel/inventory' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">📦</span>
            <span>Fuel Inventory</span>
          </Link>

          <Link
            to="/fuel/reports"
            className={`fuel-nav-item ${location.pathname === '/fuel/reports' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">📄</span>
            <span>Reports</span>
          </Link>

          <Link
            to="/fuel/transactions"
            className={`fuel-nav-item ${location.pathname === '/fuel/transactions' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="fuel-nav-icon">📜</span>
            <span>Transactions</span>
          </Link>
        </nav>

        <div className="fuel-sidebar-footer">
          <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="fuel-logout-btn">
            <span className="fuel-logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="fuel-main-content">
        {/* Header */}
        <div className="fuel-header">
          <div className="fuel-header-left">
            <h1>Fuel Station Management</h1>
          </div>
          <div className="fuel-header-right">
            {/* Notification Bell */}
            <button
              className="fuel-notification-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="fuel-notification-badge">{unreadCount}</span>}
            </button>

            {/* Beautiful Profile Section */}
            <div
              className="fuel-header-profile-section"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="fuel-header-profile-avatar">
                {fuelOfficerInfo.avatar ? (
                  <img src={fuelOfficerInfo.avatar} alt={fuelOfficerInfo.name} />
                ) : (
                  <div className="fuel-header-avatar-placeholder">
                    <div className="fuel-avatar-icon">👤</div>
                  </div>
                )}
              </div>
              <div className="fuel-header-profile-info">
                <span className="fuel-header-profile-name">{fuelOfficerInfo.name.split(' ')[0]}</span>
              </div>
              <div className="fuel-header-dropdown-arrow">
                <span className={`fuel-dropdown-icon ${showProfileMenu ? 'rotated' : ''}`}>▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div className="fuel-notification-overlay" onClick={() => setShowNotifications(false)}></div>
            <div className="fuel-notification-dropdown">
              <div className="fuel-notification-dropdown-header">
                <h3>Notifications</h3>
                <div className="fuel-notification-actions">
                  {unreadCount > 0 && (
                    <button
                      className="fuel-mark-all-read"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      ✓ Mark all read
                    </button>
                  )}
                  <button
                    className="fuel-notification-close"
                    onClick={() => setShowNotifications(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="fuel-notification-list">
                {notifications.length === 0 ? (
                  <div className="fuel-no-notifications">
                    <span className="fuel-no-notifications-icon">🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`fuel-notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="fuel-notification-icon">
                        {notification.type === 'request' && '📋'}
                        {notification.type === 'alert' && '⚠️'}
                        {notification.type === 'info' && 'ℹ️'}
                        {notification.type === 'success' && '✓'}
                      </div>
                      <div className="fuel-notification-content">
                        <strong className="fuel-notification-title">{notification.title}</strong>
                        <p className="fuel-notification-message">{notification.message}</p>
                        <span className="fuel-notification-time">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                      {!notification.read && <div className="fuel-notification-unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="fuel-notification-footer">
                  <button
                    className="fuel-view-all-notifications"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/fuel/notifications');
                    }}
                  >
                    View All Notifications
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Profile Dropdown Menu */}
        {showProfileMenu && (
          <>
            <div className="fuel-profile-overlay" onClick={() => setShowProfileMenu(false)}></div>
            <div className="fuel-profile-dropdown">
              {/* Profile Header */}
              <div className="fuel-profile-dropdown-header">
                <div className="fuel-profile-header-avatar">
                  {fuelOfficerInfo.avatar ? (
                    <img src={fuelOfficerInfo.avatar} alt={fuelOfficerInfo.name} />
                  ) : (
                    <div className="fuel-profile-avatar-placeholder">
                      <span>👤</span>
                    </div>
                  )}
                </div>
                <div className="fuel-profile-header-info">
                  <h4 className="fuel-profile-header-name">{fuelOfficerInfo.name}</h4>
                  <p className="fuel-profile-header-email">{fuelOfficerInfo.email}</p>
                  <span className="fuel-profile-header-id">ID: {fuelOfficerInfo.employeeId}</span>
                </div>
              </div>

              {/* Profile Menu Items */}
              <div className="fuel-profile-menu-items">
                <button
                  className="fuel-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/fuel/profile');
                  }}
                >
                  <span className="fuel-profile-menu-icon">👤</span>
                  <span>My Profile</span>
                </button>

                <button
                  className="fuel-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/fuel/settings');
                  }}
                >
                  <span className="fuel-profile-menu-icon">⚙️</span>
                  <span>Settings</span>
                </button>

                <button
                  className="fuel-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/fuel/performance');
                  }}
                >
                  <span className="fuel-profile-menu-icon">📊</span>
                  <span>My Performance</span>
                </button>

                <div className="fuel-profile-menu-divider"></div>

                <button
                  className="fuel-profile-menu-item logout"
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                >
                  <span className="fuel-profile-menu-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="fuel-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default FuelStationLayout;