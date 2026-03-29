import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FuelNotifications.css';

const BASE = '/api';
const token = () => localStorage.getItem('authToken');
const req = async (url, opts = {}) => {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers } });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
};

const ACTION_CONFIG = {
  fuel_request:      { route: '/fuel/requests', label: 'View Requests' },
  approval:          { route: '/fuel/requests', label: 'View Approvals' },
  fuel_alert:        { route: '/fuel/inventory', label: 'View Inventory' },
  system:            null
};

const FuelNotifications = () => {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = async () => {
        setLoading(true);
        try {
            const data = await req(`${BASE}/fuel/notifications`).catch(() => []);
            const notifs = Array.isArray(data) ? data : [];
            setNotifications(notifs);
            setUnreadCount(notifs.filter(n => !n.read).length);
        } catch (err) {
            console.error('Error loading notifications:', err);
            setNotifications([]);
            setUnreadCount(0);
        } finally {
            setLoading(false);
        }
    };

    const markAsRead = async (id) => {
        if (!id) return;
        try {
            await req(`${BASE}/fuel/notifications/${id}/read`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => (n._id === id || n.id === id) ? { ...n, read: true } : n));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (e) {
            console.error('Failed to mark read:', e);
        }
    };

    const markAllAsRead = async () => {
        try {
            await req(`${BASE}/fuel/notifications/read-all`, { method: 'PUT' });
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
            setUnreadCount(0);
        } catch (e) {
            console.error('Failed to mark all read:', e);
        }
    };

    const deleteNotification = (notificationId) => {
        const notification = notifications.find(n => n.id === notificationId);
        if (!notification.read) {
            setUnreadCount(prev => Math.max(0, prev - 1));
        }
        setNotifications(prev => prev.filter(n => n.id !== notificationId));
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

    const filteredNotifications = notifications.filter(notification => {
        if (filter === 'all') return true;
        if (filter === 'unread') return !notification.read;
        return notification.type === filter;
    });

    return (
        <div className="fuel-notifications-page">
            <div className="fuel-notifications-header">
                <div className="fuel-notifications-title">
                    <h2>Notifications</h2>
                    <span className="fuel-notifications-count">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </span>
                </div>
                {unreadCount > 0 && (
                    <button className="fuel-mark-all-read-btn" onClick={markAllAsRead}>
                        <span>✓</span> Mark All as Read
                    </button>
                )}
            </div>

            <div className="fuel-notifications-filters">
                <button
                    className={`fuel-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({notifications.length})
                </button>
                <button
                    className={`fuel-filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread ({unreadCount})
                </button>
                <button
                    className={`fuel-filter-btn ${filter === 'request' ? 'active' : ''}`}
                    onClick={() => setFilter('request')}
                >
                    📋 Requests
                </button>
                <button
                    className={`fuel-filter-btn ${filter === 'alert' ? 'active' : ''}`}
                    onClick={() => setFilter('alert')}
                >
                    ⚠️ Alerts
                </button>
                <button
                    className={`fuel-filter-btn ${filter === 'info' ? 'active' : ''}`}
                    onClick={() => setFilter('info')}
                >
                    ℹ️ Info
                </button>
                <button
                    className={`fuel-filter-btn ${filter === 'success' ? 'active' : ''}`}
                    onClick={() => setFilter('success')}
                >
                    ✓ Success
                </button>
            </div>

            <div className="fuel-notifications-list-page">
                {filteredNotifications.length === 0 ? (
                    <div className="fuel-no-notifications-page">
                        <span className="fuel-no-notifications-icon-page">🔔</span>
                        <h3>No notifications</h3>
                        <p>You're all caught up! Check back later for updates.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`fuel-notification-card ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                        >
                            <div className="fuel-notification-card-icon">
                                {notification.type === 'request' && '📋'}
                                {notification.type === 'alert' && '⚠️'}
                                {notification.type === 'info' && 'ℹ️'}
                                {notification.type === 'success' && '✓'}
                            </div>
                            <div className="fuel-notification-card-content">
                                <div className="fuel-notification-card-header">
                                    <strong className="fuel-notification-card-title">{notification.title}</strong>
                                    {!notification.read && <div className="fuel-notification-card-unread-dot"></div>}
                                </div>
                                <p className="fuel-notification-card-message">{notification.message}</p>
                                <span className="fuel-notification-card-time">
                                    {formatNotificationTime(notification.createdAt)}
                                </span>
                                {ACTION_CONFIG[notification.type] && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      const nid = notification._id || notification.id;
                                      if (!notification.read && nid) markAsRead(nid);
                                      navigate(ACTION_CONFIG[notification.type].route);
                                    }}
                                    style={{ marginTop: 12, padding: '8px 16px', background: '#3b82f6', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 13, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                                  >
                                    {ACTION_CONFIG[notification.type].label} <span style={{fontSize: 14}}>→</span>
                                  </button>
                                )}
                            </div>
                            <div className="fuel-notification-card-actions">
                                {!notification.read && (
                                    <button
                                        className="fuel-notification-action-btn mark-read"
                                        onClick={() => markAsRead(notification.id)}
                                        title="Mark as read"
                                    >
                                        ✓
                                    </button>
                                )}
                                <button
                                    className="fuel-notification-action-btn delete"
                                    onClick={() => deleteNotification(notification.id)}
                                    title="Delete notification"
                                >
                                    🗑️
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default FuelNotifications;
