import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import './DriverNotifications.css';

const TYPE_ICON = {
  trip_assignment: '🚗',
  schedule_reminder: '⏰',
  vehicle_alert: '⚠️',
  fuel_alert: '⛽',
  approval: '✅',
  system: '📢',
};

const ACTION_CONFIG = {
  trip_assignment:   { view: 'trips', label: 'View Assignments' },
  trip_update:       { view: 'trips', label: 'View Trips' },
  fuel_alert:        { view: 'fuel', label: 'View Fuel Request' },
  vehicle_alert:     { view: 'vehicle', label: 'View Vehicle' },
  complaint:         { view: 'submit-complaint', label: 'View Complaint' },
  approval:          { view: 'trips', label: 'View Trip' },
  system:            null
};

const DriverNotifications = ({ setActiveView }) => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  const loadNotifications = async () => {
    try {
      const data = await driverService.getNotifications();
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load notifications:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const markAsRead = async (id) => {
    try {
      await driverService.markNotificationRead(id);
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (err) {
      console.error('Failed to mark read:', err);
    }
  };

  const markAllRead = async () => {
    try {
      await driverService.markAllNotificationsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (err) {
      console.error('Failed to mark all read:', err);
    }
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div className="loading">Loading notifications...</div>;

  return (
    <div className="driver-notifications">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>Notifications {unreadCount > 0 && <span style={{ fontSize: 14, background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 8px', marginLeft: 8 }}>{unreadCount}</span>}</h2>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ fontSize: 13, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
            ✓ Mark all read
          </button>
        )}
      </div>

      <div className="filter-buttons">
        {['all', 'unread', 'trip_assignment', 'fuel_alert', 'vehicle_alert'].map(f => (
          <button key={f} className={filter === f ? 'active' : ''} onClick={() => setFilter(f)}>
            {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f === 'trip_assignment' ? 'Trips' : f === 'fuel_alert' ? 'Fuel' : 'Alerts'}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {filtered.length === 0 ? (
          <p className="no-notifications">No notifications</p>
        ) : (
          filtered.map(n => (
            <div
              key={n._id}
              className={`notification-card ${n.read ? 'read' : 'unread'} ${n.severity || ''}`}
              onClick={() => !n.read && markAsRead(n._id)}
              style={{ cursor: !n.read ? 'pointer' : 'default' }}
            >
              <div className="notification-icon">{TYPE_ICON[n.type] || '📢'}</div>
              <div className="notification-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 }}>
                  <span className="notification-time" style={{ color: '#94a3b8', fontSize: 12 }}>{new Date(n.createdAt).toLocaleString()}</span>
                  {ACTION_CONFIG[n.type] && setActiveView && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.read) markAsRead(n._id);
                        setActiveView(ACTION_CONFIG[n.type].view);
                      }}
                      style={{ padding: '6px 14px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 12, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      {ACTION_CONFIG[n.type].label} <span>→</span>
                    </button>
                  )}
                </div>
              </div>
              {!n.read && <div className="unread-indicator"></div>}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default DriverNotifications;
