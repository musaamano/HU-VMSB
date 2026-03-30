import { useState, useEffect } from 'react';
import { Link, useNavigate, Outlet, useLocation } from 'react-router-dom';
import { getCurrentUser, getUserNotifications } from '../../api/api';
import './user.css';

const ACTION_CONFIG = {
  trip_update:       { route: '/user/my-requests', label: 'View Request Status' },
  trip_assignment:   { route: '/user/my-requests', label: 'View Request Status' },
  approval:          { route: '/user/my-requests', label: 'View Request Status' },
  complaint:         { route: '/user/dashboard', label: 'View Dashboard' },
  system:            null
};

const UserLayout = ({ onLogout }) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [currentUser, setCurrentUser] = useState(() => getCurrentUser());
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [userProfileImage, setUserProfileImage] = useState(localStorage.getItem('userProfileImage') || null);
  const [toastAlerts, setToastAlerts] = useState([]);
  const seenIdsRef = useState(() => new Set())[0];
  
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    setCurrentUser(getCurrentUser());
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);

    const handleImageUpdate = (e) => {
      if (e.detail && e.detail.image) setUserProfileImage(e.detail.image);
    };

    // Sync name/email instantly when user saves account settings
    const handleProfileUpdate = (e) => {
      if (e.detail) {
        setCurrentUser(prev => ({ ...prev, ...e.detail }));
      }
    };

    window.addEventListener('profileImageUpdated', handleImageUpdate);
    window.addEventListener('userProfileUpdated', handleProfileUpdate);

    return () => {
      clearInterval(interval);
      window.removeEventListener('profileImageUpdated', handleImageUpdate);
      window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    };
  }, []);

  const TYPE_ICON = {
    approval:        '✅',
    trip_update:     '🚗',
    trip_assignment: '📋',
    fuel_alert:      '⛽',
    complaint:       '⚠️',
    vehicle_alert:   '🔧',
    system:          '📢',
  };

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Play a 3-note ascending chime
      [880, 1100, 1320].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        const t = ctx.currentTime + i * 0.12;
        gain.gain.setValueAtTime(0, t);
        gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);
        osc.start(t); osc.stop(t + 0.18);
      });
    } catch (e) {}
  };

  const dismissToast = (id) => {
    setToastAlerts(prev => prev.filter(t => t.id !== id));
  };

  const pushToast = (notification) => {
    const id = `${notification._id}-${Date.now()}`;
    setToastAlerts(prev => [...prev.slice(-3), { id, notification }]); // max 4 toasts
    setTimeout(() => dismissToast(id), 5000);
  };

  const loadNotifications = async () => {
    try {
      const data = await getUserNotifications();
      const list = Array.isArray(data) ? data : [];

      // Detect brand-new notifications by comparing IDs
      const newItems = list.filter(n => !n.read && !seenIdsRef.has(n._id));
      if (newItems.length > 0 && seenIdsRef.size > 0) {
        // Only alert if we've already done the initial load (seenIdsRef is populated)
        playChime();
        newItems.forEach(n => pushToast(n));
      }
      // Update the seen set with all current IDs
      list.forEach(n => seenIdsRef.add(n._id));

      setNotifications(list);
      setUnreadCount(list.filter(n => !n.read).length);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const handleLogout = () => {
    if (onLogout) onLogout();
    navigate('/login');
  };

  const formatNotificationTime = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - new Date(timestamp)) / 60000);
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  const navItems = [
    { path: '/user/dashboard', label: 'Dashboard', icon: '💎' },
    { path: '/user/request-vehicle', label: 'Vehicle Request', icon: '🚐' },
    { path: '/user/my-requests', label: 'Active Missions', icon: '⚡' },
    { path: '/user/submit-complaint', label: 'Support & Help', icon: '🛡️' },
  ];

  return (
    <div className="user-portal-app">
      {/* ── Toast Alert Stack ── */}
      <div className="toast-stack">
        {toastAlerts.map(({ id, notification: n }) => (
          <div key={id} className="toast-alert" role="alert">
            <div className="toast-icon-box">
              {TYPE_ICON[n.type] || '🔔'}
            </div>
            <div className="toast-body">
              <div className="toast-title">{n.title}</div>
              <div className="toast-message">{n.message}</div>
            </div>
            <button className="toast-close" onClick={() => dismissToast(id)}>✕</button>
            <div className="toast-progress"></div>
          </div>
        ))}
      </div>
      {/* Mobile Menu Toggle */}
      <button className="user-mobile-menu-toggle" onClick={() => setIsMobileOpen(!isMobileOpen)}>
        <span className="user-hamburger">
          <span></span><span></span><span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && <div className="user-mobile-overlay" onClick={() => setIsMobileOpen(false)}></div>}

      {/* Sidebar */}
      <aside className={`user-sidebar-new ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileOpen ? 'mobile-open' : ''}`}>
        <div className="sidebar-header">
          {!isSidebarCollapsed && <div className="logo-text">ELITE PORTAL</div>}
          <div className="collapse-btn" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            {isSidebarCollapsed ? '→' : '←'}
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
              onClick={() => setIsMobileOpen(false)}
            >
              <span className="nav-icon">{item.icon}</span>
              {!isSidebarCollapsed && <span className="nav-label">{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="logout-btn" onClick={handleLogout}>
            <span className="nav-icon">🚪</span>
            {!isSidebarCollapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className={`user-portal-main-content ${isSidebarCollapsed ? 'main-content-collapsed' : ''}`}>
        <header className="user-header-modern">
          <div className="header-left">
            <h2 style={{ fontSize: '18px', fontWeight: '800', color: '#16a34a' }}>
              {navItems.find(i => i.path === location.pathname)?.label || 'Elite Dashboard'}
            </h2>
          </div>

          <div className="header-right">
            {/* Notification System */}
            <div style={{ position: 'relative' }}>
              <button 
                className="user-notification-bell-new"
                onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              >
                <span style={{ filter: 'drop-shadow(0 2px 4px rgba(234, 179, 8, 0.2))' }}>🔔</span>
                {unreadCount > 0 && <span className="notification-badge-new">{unreadCount}</span>}
              </button>

              {showNotifications && (
                <div className="notification-pane">
                  <div className="dropdown-pane-header">
                    <h3>Notifications</h3>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      {unreadCount > 0 && <span className="pane-tag">{unreadCount} NEW</span>}
                      <button onClick={() => setShowNotifications(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '16px' }}>✕</button>
                    </div>
                  </div>
                  <div className="pane-content">
                    {notifications.length > 0 ? (
                      notifications.slice(0, 8).map(n => (
                        <div 
                          key={n._id} 
                          className={`pane-item ${n.read ? 'read' : 'unread'}`}
                          onClick={() => { setSelectedNotification(n); setShowNotifications(false); }}
                        >
                          <div className="item-icon-box">
                            {n.type === 'approval' && '✅'}
                            {n.type === 'trip_assignment' && '📋'}
                            {n.type === 'trip_update' && '🚗'}
                            {n.type === 'complaint' && '⚠️'}
                            {(!n.type || n.type === 'system') && '📢'}
                          </div>
                          <div className="item-main">
                            <div className="item-title">{n.title}</div>
                            <div className="item-msg">{n.message}</div>
                            <div className="item-meta">
                              <span className="item-time">{formatNotificationTime(n.createdAt)}</span>
                              {!n.read && <div className="item-unread-dot"></div>}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="pane-empty">
                        <span className="empty-icon">🛰️</span>
                        All systems nominal. No new alerts.
                      </div>
                    )}
                  </div>
                  <div className="pane-footer">
                    <button className="view-all-notif-btn" onClick={() => { navigate('/user/notifications'); setShowNotifications(false); }}>
                      VIEW ALL MISSION LOGS
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown */}
            <div className="user-profile-pill-container">
              <div className="user-profile-pill-trigger" onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
                <div className="user-pill-avatar" style={{ overflow: 'hidden' }}>
                  {userProfileImage ? (
                    <img src={userProfileImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ color: '#16a34a' }}>{currentUser?.name?.charAt(0).toUpperCase() || 'U'}</span>
                  )}
                </div>
                <div className="user-pill-name">
                  {currentUser?.name?.split(' ')[0] || 'User'}.
                </div>
                <div className={`user-pill-arrow ${showProfileMenu ? 'rotated' : ''}`} style={{ fontSize: '8px' }}>▼</div>
              </div>

              {showProfileMenu && (
                <div className="user-profile-dropdown-pane">
                  {/* Purple Header */}
                  <div className="profile-dropdown-header">
                    <div className="profile-header-avatar-large">
                      {userProfileImage ? (
                        <img src={userProfileImage} alt="Profile" />
                      ) : (
                        currentUser?.name?.charAt(0).toUpperCase() || 'U'
                      )}
                    </div>
                    <div className="profile-header-meta">
                      <h3>{currentUser?.name || '—'}</h3>
                      <p className="profile-email-sub">{currentUser?.email || '—'}</p>
                      <div className="profile-id-tag">
                        ID: {currentUser?.employeeId || currentUser?.username || '—'}
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="profile-menu-body">
                    <div className="profile-menu-item" onClick={() => { navigate('/user/profile'); setShowProfileMenu(false); }}>
                      <span className="profile-menu-icon">👤</span>
                      <span>My Profile</span>
                    </div>
                    <div className="profile-menu-item" onClick={() => { navigate('/user/profile'); setShowProfileMenu(false); }}>
                      <span className="profile-menu-icon" style={{ opacity: 0.6 }}>⚙️</span>
                      <span>Settings</span>
                    </div>
                    <div className="profile-menu-item" onClick={() => { navigate('/user/dashboard'); setShowProfileMenu(false); }}>
                      <span className="profile-menu-icon">📊</span>
                      <span>My Performance</span>
                    </div>
                    
                    <div className="profile-menu-divider-thin"></div>

                    <div className="profile-menu-item logout-red" onClick={handleLogout}>
                      <span className="profile-menu-icon">🚪</span>
                      <span>Logout</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Notification Detail Modal */}
        {selectedNotification && (
          <div className="notif-detail-modal-overlay" onClick={() => setSelectedNotification(null)}>
            <div className="notif-detail-modal" onClick={e => e.stopPropagation()}>
              <div className="modal-header">
                <h3>Mission Alert Details</h3>
                <button className="modal-close" onClick={() => setSelectedNotification(null)}>✕</button>
              </div>
              <div className="modal-body">
                <div className="detail-status">NEW UPDATE RECOGNIZED</div>
                <h2 className="detail-title">{selectedNotification.title}</h2>
                <p className="detail-msg">{selectedNotification.message}</p>
                <div className="detail-meta">
                  <div className="meta-item">
                    <span className="meta-label">DISPATCH TIME</span>
                    <span className="meta-val">{new Date(selectedNotification.createdAt).toLocaleString()}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">PRIORITY</span>
                    <span className="meta-val high">CRITICAL</span>
                  </div>
                </div>
                <div className="detail-actions">
                  <button 
                    className="btn-resolve" 
                    onClick={() => {
                      // Mark as read locally
                      setNotifications(prev => prev.map(n => n._id === selectedNotification._id ? { ...n, read: true } : n));
                      setUnreadCount(prev => Math.max(0, prev - (selectedNotification.read ? 0 : 1)));
                      setSelectedNotification(null);
                    }}
                  >
                    ACKNOWLEDGE MISSION
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <section className="user-page-container">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default UserLayout;
