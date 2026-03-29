import { useState, useEffect } from 'react';
import './DriverDashboard.css';
import AssignedTrips from './trips/AssignedTrips';
import TripHistory from './trips/TripHistory';
import VehicleInfo from './vehicle/VehicleInfo';
import DriverNotifications from './notifications/DriverNotifications';
import DriverAvailability from './availability/DriverAvailability';
import UpdateTripStatus from './trip-status/UpdateTripStatus';
import GPSTracking from './tracking/GPSTracking';
import SubmitComplaint from './submit-complaint/SubmitComplaint';
import ExitEntryVerification from './gate-verification/ExitEntryVerification';
import DriverProfile from './profile/DriverProfile';
import DriverReports from './reports/DriverReports';
import FuelReport from './fuel/FuelReport';
import VehicleIssueReport from './vehicle-report/VehicleIssueReport';
import DriverSettings from './DriverSettings';
import driverService from '../../services/driverService';

const ACTION_CONFIG = {
  trip_assignment:   { view: 'trips', label: 'View Assignments' },
  trip_update:       { view: 'trips', label: 'View Trips' },
  fuel_alert:        { view: 'fuel', label: 'View Fuel Request' },
  vehicle_alert:     { view: 'vehicle', label: 'View Vehicle' },
  complaint:         { view: 'submit-complaint', label: 'View Complaint' },
  approval:          { view: 'trips', label: 'View Trip' },
  system:            null
};

const DriverDashboard = ({ onLogout }) => {
  const [activeView, setActiveView] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [currentTrip, setCurrentTrip] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [prevUnreadCount, setPrevUnreadCount] = useState(0);
  const [driverInfo, setDriverInfo] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@university.edu',
    phone: '+1 234 567 8900',
    employeeId: 'DRV-001',
    avatar: localStorage.getItem('driverProfileImage') || null
  });
  const [stats, setStats] = useState({
    totalTrips: 0,
    completedToday: 0,
    activeTrip: null,
    availability: 'available'
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
    loadNotifications();
    loadSettings();

    const handleStorageChange = () => {
      const newImage = localStorage.getItem('driverProfileImage');
      if (newImage) setDriverInfo(prev => ({ ...prev, avatar: newImage }));
    };

    const handleSettingsUpdate = (e) => {
      if (e.detail && e.detail.account) {
        setDriverInfo(prev => ({
          ...prev,
          name: e.detail.account.name,
          email: e.detail.account.email,
          avatar: e.detail.account.avatar || prev.avatar
        }));
      }
      loadSettings();
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('profileImageUpdated', handleStorageChange);
    window.addEventListener('driverAccountSettingsUpdated', handleSettingsUpdate);

    const interval = setInterval(() => {
      loadDashboardData();
      loadNotifications();
    }, 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('profileImageUpdated', handleStorageChange);
      window.removeEventListener('driverAccountSettingsUpdated', handleSettingsUpdate);
    };
  }, []);

  const loadDashboardData = async () => {
    try {
      const [trips, availability] = await Promise.all([
        driverService.getAssignedTrips(),
        driverService.getAvailability()
      ]);
      const activeTrip = trips.find(t => t.status === 'started' || t.status === 'on-the-way');
      setStats({
        totalTrips: trips.length,
        completedToday: trips.filter(t => t.status === 'completed' && isToday(t.completedAt)).length,
        activeTrip: activeTrip || null,
        availability: availability.status
      });
      setCurrentTrip(activeTrip);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      setLoading(false);
    }
  };

  const loadSettings = () => {
    const savedSettings = localStorage.getItem('driverSettings');
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings);
        if (parsed.account) {
          setDriverInfo(prev => ({
            ...prev,
            name: parsed.account.name || prev.name,
            email: parsed.account.email || prev.email,
            phone: parsed.account.phone || prev.phone,
            avatar: parsed.account.avatar || prev.avatar
          }));
        }
        if (parsed.system && parsed.system.theme) applyTheme(parsed.system.theme);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
    }
  };

  const playNotificationSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const intervals = [784, 988, 1174];
      intervals.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + idx * 0.15 + 0.12);
        osc.start(ctx.currentTime + idx * 0.15);
        osc.stop(ctx.currentTime + idx * 0.15 + 0.12);
      });
    } catch (err) { /* ignore if audio unavailable */ }
  };

  const loadNotifications = async () => {
    try {
      const data = await driverService.getNotifications();
      const list = Array.isArray(data) ? data : [];
      const newUnread = list.filter(n => !n.read).length;
      
      if (newUnread > unreadCount) {
        playNotificationSound();
      }
      
      setNotifications(list);
      setUnreadCount(newUnread);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    }
  };

  const isToday = (date) => {
    if (!date) return false;
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.toDateString() === today.toDateString();
  };

  const handleTripUpdate = () => loadDashboardData();

  const handleLogout = () => {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('authToken');
      if (onLogout) {
        onLogout();
      } else {
        window.location.href = '/login';
      }
    }
  };

  const markAllAsRead = async () => {
    try {
      const token = localStorage.getItem('authToken');
      await fetch('/api/driver/notifications/read-all', { method: 'PUT', headers: { Authorization: `Bearer ${token}` }});
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch (e) {
      console.error(e);
    }
  };

  const markRead = async (id) => {
    if (!id) return;
    try {
      const token = localStorage.getItem('authToken');
      await fetch(`/api/driver/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` }});
      setNotifications(prev => {
        const next = prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n);
        setUnreadCount(next.filter(n => !n.read).length);
        return next;
      });
    } catch (e) {
      console.error(e);
    }
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

  const renderView = () => {
    switch (activeView) {
      case 'trips': return <AssignedTrips onTripUpdate={handleTripUpdate} />;
      case 'trip-history': return <TripHistory />;
      case 'vehicle': return <VehicleInfo />;
      case 'notifications': return <DriverNotifications setActiveView={setActiveView} />;
      case 'submit-complaint': return <SubmitComplaint />;
      case 'gate-verification': return <ExitEntryVerification />;
      case 'reports': return <DriverReports />;
      case 'fuel': return <FuelReport />;
      case 'maintenance-request': return <VehicleIssueReport onClose={() => setActiveView('overview')} onSubmit={() => { loadDashboardData(); setActiveView('overview'); }} />;
      case 'profile': return <DriverProfile />;
      case 'settings': return <DriverSettings />;
      case 'tracking':
        return currentTrip ? <GPSTracking trip={currentTrip} /> : <div className="driver-no-data">No active trip for tracking</div>;
      case 'trip-status':
        return currentTrip ? <UpdateTripStatus trip={currentTrip} onUpdate={handleTripUpdate} /> : <div className="driver-no-data">No active trip to update</div>;
      default: return renderOverview();
    }
  };

  const renderOverview = () => (
    <div className="driver-dashboard-content">
      {/* Dashboard Header */}
      <div className="driver-dashboard-header">
        <h2>🚗 Driver Dashboard</h2>
        <p>Welcome back, {driverInfo.name} — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      {/* Stats Grid */}
      <div className="driver-stats-grid">
        <div className="driver-stat-card blue">
          <div className="driver-stat-icon">📋</div>
          <div className="driver-stat-value">{stats.totalTrips}</div>
          <div className="driver-stat-label">Assigned Trips</div>
        </div>
        <div className="driver-stat-card green">
          <div className="driver-stat-icon">✅</div>
          <div className="driver-stat-value">{stats.completedToday}</div>
          <div className="driver-stat-label">Completed Today</div>
        </div>
        <div className="driver-stat-card orange">
          <div className="driver-stat-icon">📍</div>
          <div className="driver-stat-value">{stats.activeTrip ? 'Active' : 'Idle'}</div>
          <div className="driver-stat-label">Current Status</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="driver-quick-actions">
        <button onClick={() => setActiveView('trips')} className="driver-action-btn primary">
          <span className="action-icon">📋</span> My Trips
        </button>
        <button onClick={() => setActiveView('vehicle')} className="driver-action-btn secondary">
          <span className="action-icon">🚙</span> Vehicle Info
        </button>
        <button onClick={() => setActiveView('reports')} className="driver-action-btn success">
          <span className="action-icon">📊</span> Reports
        </button>
        <button onClick={() => setActiveView('maintenance-request')} className="driver-action-btn" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)', color: '#fff' }}>
          <span className="action-icon">🔧</span> Report Issue
        </button>
        {currentTrip && (
          <button onClick={() => setActiveView('tracking')} className="driver-action-btn teal">
            <span className="action-icon">📍</span> GPS Tracking
          </button>
        )}
      </div>

      {/* Current Trip Card */}
      {currentTrip && (
        <div className="driver-current-trip-card">
          <h3>🚗 Current Trip</h3>
          <div className="driver-trip-details">
            <div className="driver-detail-row">
              <span>Pickup</span>
              <strong>{currentTrip.pickupLocation}</strong>
            </div>
            <div className="driver-detail-row">
              <span>Destination</span>
              <strong>{currentTrip.destination}</strong>
            </div>
            <div className="driver-detail-row">
              <span>Status</span>
              <span className={`driver-status-badge ${currentTrip.status}`}>{currentTrip.status}</span>
            </div>
          </div>
          <div className="driver-trip-card-footer">
            <button onClick={() => setActiveView('trip-status')} className="driver-btn-primary">
              🔄 Update Trip Status
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return <div className="driver-loading">Loading Driver Dashboard...</div>;
  }

  return (
    <div className="driver-dashboard-wrapper">
      {/* Sidebar */}
      <div className="driver-sidebar">
        <div className="driver-sidebar-header">
          <div className="driver-logo">
            <span className="driver-logo-icon">🚗</span>
            <span className="driver-logo-text">DRIVER PORTAL</span>
          </div>
        </div>

        <nav className="driver-sidebar-nav">
          <button
            className={`driver-nav-item ${activeView === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveView('overview')}
          >
            <span className="driver-nav-icon">📊</span>
            <span>Dashboard</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'trips' ? 'active' : ''}`}
            onClick={() => setActiveView('trips')}
          >
            <span className="driver-nav-icon">📋</span>
            <span>Assigned Trips</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'trip-history' ? 'active' : ''}`}
            onClick={() => setActiveView('trip-history')}
          >
            <span className="driver-nav-icon">📜</span>
            <span>Trip History</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'vehicle' ? 'active' : ''}`}
            onClick={() => setActiveView('vehicle')}
          >
            <span className="driver-nav-icon">🚙</span>
            <span>Vehicle Info</span>
          </button>
          {currentTrip && (
            <>
              <button
                className={`driver-nav-item ${activeView === 'trip-status' ? 'active' : ''}`}
                onClick={() => setActiveView('trip-status')}
              >
                <span className="driver-nav-icon">🔄</span>
                <span>Update Status</span>
              </button>
              <button
                className={`driver-nav-item ${activeView === 'tracking' ? 'active' : ''}`}
                onClick={() => setActiveView('tracking')}
              >
                <span className="driver-nav-icon">📍</span>
                <span>GPS Tracking</span>
              </button>
            </>
          )}

          <button
            className={`driver-nav-item ${activeView === 'submit-complaint' ? 'active' : ''}`}
            onClick={() => setActiveView('submit-complaint')}
          >
            <span className="driver-nav-icon">📝</span>
            <span>Submit Complaint</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'fuel' ? 'active' : ''}`}
            onClick={() => setActiveView('fuel')}
          >
            <span className="driver-nav-icon">⛽</span>
            <span>Request Fuel</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'maintenance-request' ? 'active' : ''}`}
            onClick={() => setActiveView('maintenance-request')}
          >
            <span className="driver-nav-icon">🔧</span>
            <span>Report Issue</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'gate-verification' ? 'active' : ''}`}
            onClick={() => setActiveView('gate-verification')}
          >
            <span className="driver-nav-icon">🚪</span>
            <span>Gate Verification</span>
          </button>
          <button
            className={`driver-nav-item ${activeView === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveView('reports')}
          >
            <span className="driver-nav-icon">📄</span>
            <span>Reports</span>
          </button>
        </nav>

        <div className="driver-sidebar-footer">
          <button onClick={handleLogout} className="driver-logout-btn">
            <span className="driver-logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="driver-main-content">
        {/* Header */}
        <div className="driver-header">
          <div className="driver-header-left">
            <h1>Driver Management</h1>
          </div>
          <div className="driver-header-right">
            <DriverAvailability currentStatus={stats.availability} onUpdate={loadDashboardData} />

            {/* Notification Bell */}
            <button
              className="driver-notification-bell"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              title="Notifications"
            >
              🔔
              {unreadCount > 0 && <span className="driver-notification-badge">{unreadCount}</span>}
            </button>

            {/* Profile Section */}
            <div className="driver-profile-dropdown-container">
              <div
                className="driver-header-profile-section"
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}
              >
                <div className="driver-header-profile-avatar">
                  {driverInfo.avatar ? (
                    <img src={driverInfo.avatar} alt={driverInfo.name} />
                  ) : (
                    <div className="driver-header-avatar-placeholder">
                      <span className="driver-avatar-icon">👤</span>
                    </div>
                  )}
                </div>
                <div className="driver-header-profile-info">
                  <span className="driver-header-profile-name">{driverInfo.name.split(' ')[0]}</span>
                </div>
                <div className="driver-header-dropdown-arrow">
                  <span className={`driver-dropdown-icon ${showProfileMenu ? 'rotated' : ''}`}>▼</span>
                </div>
              </div>

              {/* Profile Dropdown */}
              {showProfileMenu && (
                <>
                  <div className="driver-profile-overlay" onClick={() => setShowProfileMenu(false)}></div>
                  <div className="driver-profile-dropdown">
                    <div className="driver-profile-dropdown-header">
                      <div className="driver-profile-header-avatar">
                        {driverInfo.avatar ? (
                          <img src={driverInfo.avatar} alt={driverInfo.name} />
                        ) : (
                          <div className="driver-profile-avatar-placeholder"><span>👤</span></div>
                        )}
                      </div>
                      <div className="driver-profile-header-info">
                        <h4 className="driver-profile-header-name">{driverInfo.name}</h4>
                        <p className="driver-profile-header-email">{driverInfo.email}</p>
                        <span className="driver-profile-header-id">ID: {driverInfo.employeeId}</span>
                      </div>
                    </div>
                    <div className="driver-profile-menu-items">
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('profile'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">👤</span><span>My Profile</span>
                      </button>
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('settings'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">⚙️</span><span>Settings</span>
                      </button>
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('trip-history'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">📊</span><span>My Performance</span>
                      </button>
                      <div className="driver-profile-menu-divider"></div>
                      <button className="driver-profile-menu-item logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                        <span className="driver-profile-menu-icon">🚪</span><span>Logout</span>
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
            <div className="driver-notification-overlay" onClick={() => setShowNotifications(false)}></div>
            <div className="driver-notification-dropdown">
              <div className="driver-notification-dropdown-header">
                <h3>Notifications</h3>
                <div className="driver-notification-actions">
                  {unreadCount > 0 && (
                    <button className="driver-mark-all-read" onClick={markAllAsRead} title="Mark all as read">
                      ✓ Mark all read
                    </button>
                  )}
                  <button className="driver-notification-close" onClick={() => setShowNotifications(false)}>✕</button>
                </div>
              </div>
              <div className="driver-notification-list">
                {notifications.length === 0 ? (
                  <div className="driver-no-notifications">
                    <span className="driver-no-notifications-icon">🔔</span>
                    <p>No notifications</p>
                  </div>
                ) : (
                  notifications.slice(0, 8).map(notification => (
                    <div key={notification._id || notification.id} className={`driver-notification-item ${notification.read ? 'read' : 'unread'} ${notification.type || ''}`}>
                      <div className="driver-notification-icon">
                        {notification.type === 'alert' && '⚠️'}
                        {notification.type === 'success' && '✓'}
                        {notification.type === 'request' && '📋'}
                        {(!notification.type || notification.type === 'info' || notification.type === 'trip_assignment' || notification.type === 'trip_update') && '🚗'}
                      </div>
                      <div className="driver-notification-content">
                        <strong className="driver-notification-title">{notification.title}</strong>
                        <p className="driver-notification-message">{notification.message}</p>
                        <span className="driver-notification-time">{formatNotificationTime(notification.createdAt)}</span>
                        {ACTION_CONFIG[notification.type] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const nid = notification._id || notification.id;
                              if (!notification.read && nid) markRead(nid);
                              setShowNotifications(false);
                              setActiveView(ACTION_CONFIG[notification.type].view);
                            }}
                            className="driver-notif-action-btn"
                            style={{ marginTop: 8, padding: '6px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            {ACTION_CONFIG[notification.type].label} <span style={{fontSize: 12}}>→</span>
                          </button>
                        )}
                      </div>
                      {!notification.read && <div className="driver-notification-unread-dot"></div>}
                    </div>
                  ))
                )}
              </div>
              <div className="driver-notification-footer">
                <button className="driver-view-all-notifications" onClick={() => { setActiveView('notifications'); setShowNotifications(false); }}>
                  View All Notifications
                </button>
              </div>
            </div>
          </>
        )}

        {/* Page Content */}
        <div className="driver-page-content">
          {renderView()}
        </div>
      </div>
    </div>
  );
};

export default DriverDashboard;
