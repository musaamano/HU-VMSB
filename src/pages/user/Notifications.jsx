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
  system:          '📢',
};

const ACTION_CONFIG = {
  trip_update:       { route: '/user/my-requests', label: 'Monitor Deployment' },
  trip_assignment:   { route: '/user/my-requests', label: 'Active Missions' },
  approval:          { route: '/user/my-requests', label: 'Command Review' },
  complaint:         { route: '/user/dashboard', label: 'Go to Hub' },
  system:            null
};

const Notifications = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('all');

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

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  if (loading) return (
    <div style={{ padding: 100, textAlign: 'center', color: '#64748b', fontSize: 18, fontWeight: 700 }}>
       📡 Synchronizing Notifications...
    </div>
  );

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <h1>
          Command Center Alerts
          {unreadCount > 0 && <span className="unread-badge">{unreadCount} UNREAD</span>}
        </h1>
        {unreadCount > 0 && (
          <button onClick={markAllRead} className="mark-all-btn">
             ✓ Acknowledge All Broadcasts
          </button>
        )}
      </div>

      <div className="filter-tabs">
        <button className={`filter-tab ${activeFilter === 'all' ? 'active' : ''}`} onClick={() => setActiveFilter('all')}>🌐 All Intel</button>
        <button className={`filter-tab ${activeFilter === 'unread' ? 'active' : ''}`} onClick={() => setActiveFilter('unread')}>📡 Unread Signals</button>
        <button className={`filter-tab ${activeFilter === 'approval' ? 'active' : ''}`} onClick={() => setActiveFilter('approval')}>✅ Mission Approvals</button>
        <button className={`filter-tab ${activeFilter === 'trip_update' ? 'active' : ''}`} onClick={() => setActiveFilter('trip_update')}>🚗 Deployment Logs</button>
        <button className={`filter-tab ${activeFilter === 'complaint' ? 'active' : ''}`} onClick={() => setActiveFilter('complaint')}>⚠️ Incident Alerts</button>
      </div>

      <div className="notifications-list">
        {filteredNotifications.length === 0 ? (
          <div className="empty-container">
            <div className="empty-icon-box">🛰️</div>
            <h2>Zero Pending Alerts</h2>
            <p>Your communication frequency is clear. No active mission updates at this time.</p>
          </div>
        ) : (
          filteredNotifications.map(n => (
            <div
              key={n._id}
              className={`notification-card ${!n.read ? 'unread' : ''}`}
              onClick={() => !n.read && markRead(n._id)}
            >
              {!n.read && <div className="unread-indicator"></div>}
              <div className="notification-icon-wrapper">
                {TYPE_ICON[n.type] || '🔔'}
              </div>
              <div className="notification-main">
                <div className="notification-top">
                  <h3>{n.title}</h3>
                  <span className="notification-time">
                    {new Date(n.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="notification-message">{n.message}</p>
                <div className="notification-footer">
                  <span className={`status-badge badge-${n.type || 'system'}`}>
                    {n.type ? n.type.replace('_', ' ') : 'Hub Signal'}
                  </span>
                  {ACTION_CONFIG[n.type] && (
                    <button
                      className="action-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.read) markRead(n._id);
                        navigate(ACTION_CONFIG[n.type].route);
                      }}
                    >
                      {ACTION_CONFIG[n.type].label} <span>→</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Notifications;
