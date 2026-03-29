import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './NotificationPanel.css';

const TYPE_ICON = {
  trip_update:       '🚗',
  trip_assignment:   '📋',
  approval:          '✅',
  vehicle_alert:     '🔧',
  fuel_alert:        '⛽',
  fuel_request:      '⛽',
  schedule_reminder: '⏰',
  complaint:         '⚠️',
  system:            '📢',
  gate_alert:        '🔐',
};

const SEV_COLOR = { high: '#ef4444', medium: '#f59e0b', normal: '#6366f1', low: '#94a3b8' };

const ACTION_CONFIG = {
  trip_update:       { route: '/admin/user-request-report', label: 'Review Trip Request' },
  trip_assignment:   { route: '/admin/vehicle-trip-report', label: 'View Trip Details' },
  fuel_alert:        { route: '/admin/fuel-requests', label: 'Review Fuel Request' },
  fuel_request:      { route: '/admin/fuel-requests', label: 'Review Fuel Request' },
  schedule_reminder: { route: '/admin/control-center', label: 'View Schedule' },
  vehicle_alert:     { route: '/admin/control-center', label: 'Review Maintenance' },
  complaint:         { route: '/admin/control-center', label: 'View Complaints' },
  gate_alert:        { route: '/admin/control-center', label: 'View Gate Activity' },
  approval:          { route: '/admin/control-center', label: 'View Approvals' },
  system:            null
};

const timeAgo = (d) => {
  if (!d) return '—';
  const s = Math.floor((Date.now() - new Date(d)) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
};

const NotificationPanel = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading]             = useState(false);
  const [filter, setFilter]               = useState('all');
  const [expanded, setExpanded]           = useState(null);

  const token = () => localStorage.getItem('authToken');
  const authReq = async (url, opts = {}) => {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers } });
    const text = await res.text();
    return text ? JSON.parse(text) : {};
  };

  const load = async () => {
    setLoading(true);
    try {
      const data = await authReq('/api/admin/notifications').catch(() => []);
      setNotifications(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    if (!isOpen) return;
    load();
  }, [isOpen]);

  const markRead = async (id) => {
    await authReq(`/api/admin/notifications/${id}/read`, { method: 'PUT' }).catch(() => {});
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
  };

  const markAllRead = async () => {
    await authReq('/api/admin/notifications/read-all', { method: 'PUT' }).catch(() => {});
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const filtered = filter === 'all' ? notifications
    : filter === 'unread' ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unread = notifications.filter(n => !n.read).length;

  if (!isOpen) return null;

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className="notification-panel" onClick={e => e.stopPropagation()}>
        <div className="notification-header">
          <div>
            <h2>🔔 Notifications</h2>
            <span className="notification-count">{unread} unread</span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead} style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                ✓ Mark all read
              </button>
            )}
            <button className="close-btn" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="notification-controls">
          <div className="filter-buttons">
            {['all', 'unread', 'trip_update', 'vehicle_alert', 'fuel_alert', 'system'].map(f => (
              <button key={f} className={`filter-btn ${filter === f ? 'active' : ''}`} onClick={() => setFilter(f)}>
                {f === 'all' ? 'All' : f === 'unread' ? 'Unread' : f.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="notification-list">
          {loading ? (
            <div className="no-notifications"><p>Loading...</p></div>
          ) : filtered.length === 0 ? (
            <div className="no-notifications"><p>📭 No notifications found</p></div>
          ) : filtered.map(n => (
            <div key={n._id}
              className={`notification-item ${n.read ? '' : 'pending'}`}
              style={{ borderLeftColor: SEV_COLOR[n.severity] || '#6366f1', cursor: 'pointer' }}
              onClick={() => { setExpanded(expanded === n._id ? null : n._id); if (!n.read) markRead(n._id); }}>

              <div className="notification-row">
                <div className="row-left">
                  <div className="user-avatar-small" style={{ fontSize: 20 }}>{TYPE_ICON[n.type] || '📢'}</div>
                  <div className="row-info">
                    <span className="row-name">{n.title}</span>
                    <span className="row-meta">
                      <span className="notif-time-small">⏰ {timeAgo(n.createdAt)}</span>
                    </span>
                  </div>
                </div>
                <div className="row-right">
                  <span className="status-badge-small" style={{ backgroundColor: SEV_COLOR[n.severity] || '#6366f1' }}>
                    {n.severity || 'normal'}
                  </span>
                  {!n.read && <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6366f1', display: 'inline-block' }} />}
                  <span className="expand-icon">{expanded === n._id ? '▲' : '▼'}</span>
                </div>
              </div>

              {expanded === n._id && (
                <div className="notification-expanded">
                  <div className="expanded-message">
                    <h4>📩 Message</h4>
                    <p style={{ whiteSpace: 'pre-wrap', lineHeight: 1.6 }}>{n.message}</p>
                    <p style={{ fontSize: 11, color: '#94a3b8', marginTop: 8 }}>
                      {new Date(n.createdAt).toLocaleString()}
                    </p>
                    {ACTION_CONFIG[n.type] && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          onClose();
                          navigate(ACTION_CONFIG[n.type].route);
                        }}
                        style={{ marginTop: 12, padding: '8px 14px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 6, cursor: 'pointer', fontSize: 12, fontWeight: 600, width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}
                      >
                        {ACTION_CONFIG[n.type].label} <span>→</span>
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default NotificationPanel;
