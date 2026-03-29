import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Notifications.css';

const BASE = '/api';
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const TYPE_ICON = {
  approval:        '✅',
  trip_update:     '🚗',
  trip_assignment: '📋',
  fuel_alert:      '⛽',
  complaint:       '⚠️',
  vehicle_alert:   '🔧',
  system:          '🔔',
};

const TYPE_CLASS = {
  approval:        'notification-success',
  trip_assignment: 'notification-success',
  fuel_alert:      'notification-info',
  complaint:       'notification-warning',
  vehicle_alert:   'notification-warning',
  trip_update:     'notification-info',
  system:          'notification-default',
};

const ACTION_CONFIG = {
  trip_update:       { route: '/user/my-requests', label: 'View Request Status' },
  trip_assignment:   { route: '/user/my-requests', label: 'View Request Status' },
  approval:          { route: '/user/my-requests', label: 'View Request Status' },
  complaint:         { route: '/user/dashboard', label: 'View Dashboard' },
  system:            null
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    authReq(`${BASE}/user/notifications`)
      .then(data => setNotifications(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const markRead = async (id) => {
    try {
      await authReq(`${BASE}/user/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await authReq(`${BASE}/user/notifications/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading notifications...</div>
  );

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>Notifications</h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="mark-all-btn">
            <span>✓</span> Mark All as Read
          </button>
        )}
      </div>

      <div className="notifications-list">
        {notifications.length === 0 ? (
          <div className="empty-notifications">
            <span className="empty-icon">🔔</span>
            <p>No notifications yet</p>
            <p style={{ fontSize: 13, color: '#9ca3af' }}>You'll be notified when your requests are approved or rejected.</p>
          </div>
        ) : (
          notifications.map(n => (
            <div
              key={n._id}
              className={`notification-card ${TYPE_CLASS[n.type] || 'notification-default'} ${!n.read ? 'unread' : ''}`}
              onClick={() => !n.read && markRead(n._id)}
              style={{ cursor: !n.read ? 'pointer' : 'default' }}
            >
              <div className="notification-icon">{TYPE_ICON[n.type] || '🔔'}</div>
              <div className="notification-content">
                <div className="notification-header">
                  <h3>{n.title}</h3>
                  <span className="notification-time">
                    {new Date(n.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <p>{n.message}</p>
                {ACTION_CONFIG[n.type] && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!n.read) markRead(n._id);
                      navigate(ACTION_CONFIG[n.type].route);
                    }}
                    style={{ marginTop: 12, padding: '6px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                  >
                    {ACTION_CONFIG[n.type].label} <span style={{fontSize: 14}}>→</span>
                  </button>
                )}
              </div>
              {!n.read && <span className="unread-dot"></span>}
            </div>
          ))
        )}
      </div>

      <div className="notifications-summary">
        <div className="summary-item"><span>Total</span><span className="summary-value">{notifications.length}</span></div>
        <div className="summary-item"><span>Unread</span><span className="summary-value unread">{unreadCount}</span></div>
        <div className="summary-item"><span>Read</span><span className="summary-value">{notifications.length - unreadCount}</span></div>
      </div>
    </div>
  );
};

export default Notifications;
