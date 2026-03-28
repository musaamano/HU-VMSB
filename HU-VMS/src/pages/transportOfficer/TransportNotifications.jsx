import { useState, useEffect } from 'react';
import './TransportNotifications.css';

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
  trip_update:     '🚗',
  trip_assignment: '📋',
  complaint:       '⚠️',
  vehicle_alert:   '🔧',
  approval:        '✅',
  fuel_alert:      '⛽',
  system:          '📢',
};

const TYPE_LABEL = {
  trip_update:     'New Request',
  trip_assignment: 'Trip',
  complaint:       'Complaint',
  vehicle_alert:   'Vehicle Alert',
  approval:        'Approval',
  fuel_alert:      'Fuel',
  system:          'System',
};

const timeAgo = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const TransportNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filter, setFilter]   = useState('all');
  const [loading, setLoading] = useState(true);

  const load = async () => {
    try {
      const data = await authReq(`${BASE}/transport/notifications`).catch(() => []);
      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id) => {
    try {
      await authReq(`${BASE}/transport/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await authReq(`${BASE}/transport/notifications/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.error(e); }
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  if (loading) return <div className="transport-notifications"><div className="loading">Loading notifications...</div></div>;

  return (
    <div className="transport-notifications">
      <div className="tn-header-row">
        <h2>
          Notifications
          {unreadCount > 0 && (
            <span className="tn-unread-badge">{unreadCount}</span>
          )}
        </h2>
        {unreadCount > 0 && (
          <button className="tn-mark-all-btn" onClick={markAllRead}>
            ✓ Mark all read
          </button>
        )}
      </div>

      <div className="filter-buttons">
        {[
          { key: 'all',          label: 'All' },
          { key: 'unread',       label: 'Unread' },
          { key: 'trip_update',  label: 'Requests' },
          { key: 'complaint',    label: 'Complaints' },
          { key: 'vehicle_alert',label: 'Vehicles' },
        ].map(f => (
          <button key={f.key} className={filter === f.key ? 'active' : ''} onClick={() => setFilter(f.key)}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="notifications-list">
        {filtered.length === 0 ? (
          <p className="no-notifications">
            {filter === 'unread' ? 'All caught up — no unread notifications.' : 'No notifications yet.'}
          </p>
        ) : (
          filtered.map(n => (
            <div
              key={n._id}
              className={`notification-card ${n.read ? 'read' : 'unread'} ${n.severity || ''}`}
              onClick={() => !n.read && markRead(n._id)}
              style={{ cursor: !n.read ? 'pointer' : 'default' }}
            >
              <div className="notification-icon">
                {TYPE_ICON[n.type] || '📢'}
              </div>
              <div className="notification-content">
                <h4>{n.title}</h4>
                <p>{n.message}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4 }}>
                  <span className="notification-time">{timeAgo(n.createdAt)}</span>
                  <span style={{ fontSize: 11, fontWeight: 600, padding: '2px 8px', borderRadius: 20,
                    background: n.severity === 'high' ? '#fee2e2' : n.severity === 'medium' ? '#fef3c7' : '#ede9fe',
                    color: n.severity === 'high' ? '#dc2626' : n.severity === 'medium' ? '#d97706' : '#7c3aed' }}>
                    {TYPE_LABEL[n.type] || n.type}
                  </span>
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

export default TransportNotifications;
