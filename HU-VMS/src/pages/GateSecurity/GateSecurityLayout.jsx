import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import './GateSecurityLayout.css';

const GateSecurityLayout = ({ onLogout }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [gateOfficerInfo, setGateOfficerInfo] = useState(() => {
    const savedSettings = localStorage.getItem('gateSecuritySettings');
    const savedProfilePhoto = localStorage.getItem('gateSecurityProfilePhoto');
    
    let initialInfo = {
      name: 'Ahmed Hassan',
      email: 'ahmed.hassan@university.edu.et',
      employeeId: 'GS-2024-001',
      role: 'Gate Security Officer',
      gateLocation: 'Main Gate',
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
            gateLocation: parsed.account.gateLocation || initialInfo.gateLocation
          };
        }
      } catch (e) {
        console.error('Error loading settings:', e);
      }
    }

    return initialInfo;
  });

  // Apply theme on component mount
  useEffect(() => {
    const applyTheme = () => {
      const savedSettings = localStorage.getItem('gateSecuritySettings');
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

    const handleStorageChange = (e) => {
      if (e.key === 'gateSecuritySettings' || e.key === 'appTheme') {
        applyTheme();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    const themeCheckInterval = setInterval(applyTheme, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(themeCheckInterval);
    };
  }, []);

  // Load profile photo and settings
  useEffect(() => {
    const loadProfileData = () => {
      const savedProfilePhoto = localStorage.getItem('gateSecurityProfilePhoto');
      const savedSettings = localStorage.getItem('gateSecuritySettings');
      
      if (savedProfilePhoto) {
        setGateOfficerInfo(prev => ({
          ...prev,
          avatar: savedProfilePhoto
        }));
      }

      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        if (parsed.account) {
          setGateOfficerInfo(prev => ({
            ...prev,
            name: parsed.account.name || prev.name,
            email: parsed.account.email || prev.email,
            employeeId: parsed.account.employeeId || prev.employeeId,
            gateLocation: parsed.account.gateLocation || prev.gateLocation
          }));
        }
      }
    };

    loadProfileData();

    const handleProfilePhotoUpdate = (event) => {
      if (event.key === 'gateSecurityProfilePhoto') {
        setGateOfficerInfo(prev => ({
          ...prev,
          avatar: event.newValue
        }));
      }
    };

    const handleSettingsUpdate = (event) => {
      if (event.key === 'gateSecuritySettings') {
        loadProfileData();
      }
    };

    window.addEventListener('storage', handleProfilePhotoUpdate);
    window.addEventListener('storage', handleSettingsUpdate);

    const handleCustomProfileUpdate = (event) => {
      setGateOfficerInfo(prev => ({
        ...prev,
        avatar: event.detail.profilePhoto
      }));
    };

    const handleCustomAccountUpdate = (event) => {
      if (event.detail.account) {
        setGateOfficerInfo(prev => {
          const newInfo = {
            ...prev,
            name: event.detail.account.name,
            email: event.detail.account.email,
            employeeId: event.detail.account.employeeId,
            gateLocation: event.detail.account.gateLocation
          };
          return newInfo;
        });
      }
    };

    window.addEventListener('profilePhotoUpdated', handleCustomProfileUpdate);
    window.addEventListener('gateAccountSettingsUpdated', handleCustomAccountUpdate);

    const settingsCheckInterval = setInterval(loadProfileData, 1000);

    return () => {
      window.removeEventListener('storage', handleProfilePhotoUpdate);
      window.removeEventListener('storage', handleSettingsUpdate);
      window.removeEventListener('profilePhotoUpdated', handleCustomProfileUpdate);
      window.removeEventListener('gateAccountSettingsUpdated', handleCustomAccountUpdate);
      clearInterval(settingsCheckInterval);
    };
  }, []);

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    loadNotifications();
    // Refresh notifications every 30 seconds
    const interval = setInterval(loadNotifications, 15000);
    return () => clearInterval(interval);
  }, [unreadCount]);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const loadNotifications = () => {
    // Mock notifications for gate security officer
    const mockNotifications = [
      {
        id: 1,
        title: 'Unauthorized Vehicle Detected',
        message: 'Vehicle AA-1234-ET attempted entry without authorization',
        createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
        read: false,
        type: 'alert'
      },
      {
        id: 2,
        title: 'New Vehicle Entry',
        message: 'Vehicle HU-2045 has been granted entry to campus',
        createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
        read: false,
        type: 'info'
      },
      {
        id: 3,
        title: 'Pending Approval',
        message: 'Vehicle HU-3021 is waiting for gate approval',
        createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
        read: false,
        type: 'request'
      },
    ];

    const newUnread = mockNotifications.filter(n => !n.read).length;
    if (newUnread > unreadCount) playChime();
    setNotifications(mockNotifications);
    setUnreadCount(newUnread);
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

  return (
    <div className="gate-dashboard-wrapper">
      {/* Mobile Menu Toggle */}
      <button className="gate-mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={`gate-hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="gate-mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      {/* Sidebar */}
      <div className={`gate-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="gate-sidebar-header">
          <div className="gate-logo">
            <span className="gate-logo-icon">🚧</span>
            <span className="gate-logo-text">GATE SECURITY</span>
          </div>
        </div>

        <nav className="gate-sidebar-nav">
          <Link
            to="/gate/dashboard"
            className={`gate-nav-item ${location.pathname === '/gate/dashboard' || location.pathname === '/gate' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">📊</span>
            <span>Dashboard</span>
          </Link>

          <Link
            to="/gate/camera"
            className={`gate-nav-item ${location.pathname === '/gate/camera' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">📷</span>
            <span>ALPR Camera</span>
          </Link>

          <Link
            to="/gate/verification"
            className={`gate-nav-item ${location.pathname === '/gate/verification' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">🔍</span>
            <span>Vehicle Verification</span>
          </Link>

          <Link
            to="/gate/trip-authorization"
            className={`gate-nav-item ${location.pathname === '/gate/trip-authorization' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">✅</span>
            <span>Trip Authorization</span>
          </Link>

          <Link
            to="/gate/inspection"
            className={`gate-nav-item ${location.pathname === '/gate/inspection' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">🔧</span>
            <span>Vehicle Inspection</span>
          </Link>

          <Link
            to="/gate/movement"
            className={`gate-nav-item ${location.pathname === '/gate/movement' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">📝</span>
            <span>Vehicle Movement</span>
          </Link>

          <Link
            to="/gate/logs"
            className={`gate-nav-item ${location.pathname === '/gate/logs' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">📋</span>
            <span>Gate Logs</span>
          </Link>

          <Link
            to="/gate/reports"
            className={`gate-nav-item ${location.pathname === '/gate/reports' ? 'active' : ''}`}
            onClick={closeMobileMenu}
          >
            <span className="gate-nav-icon">📊</span>
            <span>Reports</span>
          </Link>
        </nav>

        <div className="gate-sidebar-footer">
          <button onClick={() => { handleLogout(); closeMobileMenu(); }} className="gate-logout-btn">
            <span className="gate-logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="gate-main-content">
        {/* Header */}
        <div className="gate-header">
          <div className="gate-header-left">
            <h1>Gate Security System</h1>
          </div>
          <div className="gate-header-right">
            {/* Notification Bell */}
            <button
              className="gate-notification-bell"
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowProfileMenu(false);
              }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="gate-notification-badge">{unreadCount}</span>}
            </button>

            {/* Beautiful Profile Section */}
            <div
              className="gate-header-profile-section"
              onClick={() => {
                setShowProfileMenu(!showProfileMenu);
                setShowNotifications(false);
              }}
            >
              <div className="gate-header-profile-avatar">
                {gateOfficerInfo.avatar ? (
                  <img src={gateOfficerInfo.avatar} alt={gateOfficerInfo.name} />
                ) : (
                  <div className="gate-header-avatar-placeholder">
                    <div className="gate-avatar-icon">👤</div>
                  </div>
                )}
              </div>
              <div className="gate-header-profile-info">
                <span className="gate-header-profile-name">{gateOfficerInfo.name.split(' ')[0]}</span>
              </div>
              <div className="gate-header-dropdown-arrow">
                <span className={`gate-dropdown-icon ${showProfileMenu ? 'rotated' : ''}`}>▼</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notification Dropdown */}
        {showNotifications && (
          <>
            <div className="gate-notification-overlay" onClick={() => setShowNotifications(false)}></div>
            <div className="gate-notification-dropdown">
              <div className="gate-notification-dropdown-header">
                <h3>Notifications</h3>
                <div className="gate-notification-actions">
                  {unreadCount > 0 && (
                    <button
                      className="gate-mark-all-read"
                      onClick={markAllAsRead}
                      title="Mark all as read"
                    >
                      ✓ Mark all read
                    </button>
                  )}
                  <button
                    className="gate-notification-close"
                    onClick={() => setShowNotifications(false)}
                  >
                    ✕
                  </button>
                </div>
              </div>
              <div className="gate-notification-list">
                {notifications.length === 0 ? (
                  <div className="gate-no-notifications">
                    <span className="gate-no-notifications-icon">🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.map(notification => (
                    <div
                      key={notification.id}
                      className={`gate-notification-item ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                      onClick={() => {
                        if (!notification.read) {
                          markAsRead(notification.id);
                        }
                      }}
                    >
                      <div className="gate-notification-icon">
                        {notification.type === 'request' && '📋'}
                        {notification.type === 'alert' && '⚠️'}
                        {notification.type === 'info' && 'ℹ️'}
                        {notification.type === 'success' && '✓'}
                      </div>
                      <div className="gate-notification-content">
                        <strong className="gate-notification-title">{notification.title}</strong>
                        <p className="gate-notification-message">{notification.message}</p>
                        <span className="gate-notification-time">
                          {formatNotificationTime(notification.createdAt)}
                        </span>
                      </div>
                      {!notification.read && <div className="gate-notification-unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              {notifications.length > 0 && (
                <div className="gate-notification-footer">
                  <button
                    className="gate-view-all-notifications"
                    onClick={() => {
                      setShowNotifications(false);
                      navigate('/gate/notifications');
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
            <div className="gate-profile-overlay" onClick={() => setShowProfileMenu(false)}></div>
            <div className="gate-profile-dropdown">
              {/* Profile Header */}
              <div className="gate-profile-dropdown-header">
                <div className="gate-profile-header-avatar">
                  {gateOfficerInfo.avatar ? (
                    <img src={gateOfficerInfo.avatar} alt={gateOfficerInfo.name} />
                  ) : (
                    <div className="gate-profile-avatar-placeholder">
                      <span>👤</span>
                    </div>
                  )}
                </div>
                <div className="gate-profile-header-info">
                  <h4 className="gate-profile-header-name">{gateOfficerInfo.name}</h4>
                  <p className="gate-profile-header-email">{gateOfficerInfo.email}</p>
                  <span className="gate-profile-header-id">ID: {gateOfficerInfo.employeeId}</span>
                </div>
              </div>

              {/* Profile Menu Items */}
              <div className="gate-profile-menu-items">
                <button
                  className="gate-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/gate/profile');
                  }}
                >
                  <span className="gate-profile-menu-icon">👤</span>
                  <span>My Profile</span>
                </button>

                <button
                  className="gate-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/gate/settings');
                  }}
                >
                  <span className="gate-profile-menu-icon">⚙️</span>
                  <span>Settings</span>
                </button>

                <button
                  className="gate-profile-menu-item"
                  onClick={() => {
                    setShowProfileMenu(false);
                    navigate('/gate/performance');
                  }}
                >
                  <span className="gate-profile-menu-icon">📊</span>
                  <span>My Performance</span>
                </button>

                <div className="gate-profile-menu-divider"></div>

                <button
                  className="gate-profile-menu-item logout"
                  onClick={() => {
                    setShowProfileMenu(false);
                    handleLogout();
                  }}
                >
                  <span className="gate-profile-menu-icon">🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="gate-page-content">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default GateSecurityLayout;
