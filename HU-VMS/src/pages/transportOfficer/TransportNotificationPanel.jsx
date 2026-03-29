import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Bell, Clock, CheckCircle, Inbox, ClipboardList, AlertTriangle, Activity, Wrench } from 'lucide-react';
import './TransportNotificationPanel.css';

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
  trip_update:     <ClipboardList size={18} color="#6366f1" />,
  trip_assignment: <Activity size={18} color="#3b82f6" />,
  complaint:       <AlertTriangle size={18} color="#f59e0b" />,
  vehicle_alert:   <Wrench size={18} color="#ef4444" />,
  approval:        <CheckCircle size={18} color="#22c55e" />,
  system:          <Bell size={18} color="#94a3b8" />,
};

const SEVERITY_COLOR = { high: '#ef4444', medium: '#f59e0b', normal: '#6366f1', low: '#94a3b8' };

const ACTION_CONFIG = {
  trip_update:       { route: '/transport/requests', label: 'Review Request' },
  trip_assignment:   { route: '/transport/trips', label: 'View Trip' },
  vehicle_alert:     { route: '/transport/maintenance', label: 'View Maintenance' },
  complaint:         { route: '/transport/complaints', label: 'View Complaints' },
  schedule_reminder: { route: '/transport/tracking', label: 'View Tracking' },
  gate_alert:        { route: '/transport/dashboard', label: 'View Gate Logs' },
  approval:          { route: '/transport/dashboard', label: 'View Approvals' },
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

const TransportNotificationPanel = ({ isOpen, onClose, onBadgeCount }) => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await authReq(`${BASE}/transport/notifications`).catch(() => []);
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      onBadgeCount?.(list.filter(n => !n.read).length);
    } finally {
      setLoading(false);
    }
  }, []);

  // Load on open and poll every 30s while open
  useEffect(() => {
    if (!isOpen) return;
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, [isOpen, load]);

  // Also expose load so header can refresh badge on mount
  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await authReq(`${BASE}/transport/notifications/${id}/read`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
      onBadgeCount?.(notifications.filter(n => !n.read && n._id !== id).length);
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await authReq(`${BASE}/transport/notifications/read-all`, { method: 'PUT' });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      onBadgeCount?.(0);
    } catch (e) { console.error(e); }
  };

  if (!isOpen) return null;

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="tnp-overlay" onClick={onClose}>
      <div className="tnp-panel" onClick={e => e.stopPropagation()}>

        <div className="tnp-header">
          <div>
            <h3>🔔 Notifications</h3>
            <span className="tnp-sub">
              {unread > 0 ? `${unread} unread` : 'All caught up'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            {unread > 0 && (
              <button onClick={markAllRead}
                style={{ fontSize: 12, color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>
                Mark all read
              </button>
            )}
            <button className="tnp-close" onClick={onClose}><X size={18} /></button>
          </div>
        </div>

        <div className="tnp-body">
          {loading ? (
            <div className="tnp-empty">Loading...</div>
          ) : notifications.length === 0 ? (
            <div className="tnp-empty">
              <Inbox size={40} style={{ opacity: 0.35, marginBottom: 10 }} />
              <p>No notifications yet.</p>
              <p style={{ fontSize: 12, opacity: 0.6 }}>New trip requests and updates will appear here.</p>
            </div>
          ) : (
            notifications.map(n => (
              <div
                key={n._id}
                className={`tnp-item ${!n.read ? 'tnp-item-unread' : ''}`}
                onClick={() => !n.read && markRead(n._id)}
                style={{ cursor: !n.read ? 'pointer' : 'default' }}
              >
                <div className="tnp-item-icon">
                  {TYPE_ICON[n.type] || TYPE_ICON.system}
                </div>
                <div className="tnp-item-body">
                  <div className="tnp-item-title" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {n.title}
                    {!n.read && (
                      <span style={{ width: 8, height: 8, borderRadius: '50%', background: SEVERITY_COLOR[n.severity] || '#6366f1', display: 'inline-block', flexShrink: 0 }} />
                    )}
                  </div>
                  <div className="tnp-item-sent">{n.message}</div>
                  <div className="tnp-item-meta">
                    <span className={`tnp-badge ${n.severity === 'high' ? 'red' : n.severity === 'medium' ? 'orange' : 'blue'}`}>
                      {n.type?.replace('_', ' ')}
                    </span>
                    <span className="tnp-time">
                      <Clock size={11} /> {timeAgo(n.createdAt)}
                    </span>
                  </div>
                  {ACTION_CONFIG[n.type] && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!n.read) markRead(n._id);
                        onClose();
                        navigate(ACTION_CONFIG[n.type].route);
                      }}
                      style={{ marginTop: 10, padding: '6px 12px', background: '#eef2ff', color: '#6366f1', border: '1px solid #c7d2fe', borderRadius: 6, cursor: 'pointer', fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 4 }}
                    >
                      {ACTION_CONFIG[n.type].label} <span>→</span>
                    </button>
                  )}
                </div>
                {n.read && (
                  <div className="tnp-item-status">
                    <CheckCircle size={14} className="tnp-received-icon" />
                  </div>
                )}
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
};

export default TransportNotificationPanel;
