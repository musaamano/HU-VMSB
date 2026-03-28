import { useState, useEffect } from 'react';
import './GateNotifications.css';

const GateNotifications = () => {
    const [notifications, setNotifications] = useState([]);
    const [filter, setFilter] = useState('all');
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        loadNotifications();
    }, []);

    const loadNotifications = () => {
        // Mock notifications for gate security
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
            {
                id: 4,
                title: 'Shift Report Generated',
                message: 'Your shift report has been generated successfully',
                createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
                read: true,
                type: 'success'
            },
            {
                id: 5,
                title: 'System Maintenance',
                message: 'ALPR camera system maintenance scheduled for tomorrow',
                createdAt: new Date(Date.now() - 4 * 3600000).toISOString(),
                read: true,
                type: 'info'
            },
            {
                id: 6,
                title: 'Vehicle Exit Recorded',
                message: 'Vehicle HU-1567 has exited the campus',
                createdAt: new Date(Date.now() - 6 * 3600000).toISOString(),
                read: true,
                type: 'info'
            },
            {
                id: 7,
                title: 'Trip Authorization Verified',
                message: 'Trip TRIP-2024-001 has been verified and approved',
                createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
                read: true,
                type: 'success'
            },
            {
                id: 8,
                title: 'Security Alert',
                message: 'Multiple unauthorized entry attempts detected',
                createdAt: new Date(Date.now() - 2 * 24 * 3600000).toISOString(),
                read: true,
                type: 'alert'
            },
            {
                id: 9,
                title: 'Vehicle Inspection Required',
                message: 'Vehicle HU-4532 requires mandatory inspection',
                createdAt: new Date(Date.now() - 3 * 24 * 3600000).toISOString(),
                read: true,
                type: 'request'
            },
            {
                id: 10,
                title: 'Weekly Report Ready',
                message: 'Your weekly gate activity report is ready for review',
                createdAt: new Date(Date.now() - 5 * 24 * 3600000).toISOString(),
                read: true,
                type: 'success'
            }
        ];

        setNotifications(mockNotifications);
        setUnreadCount(mockNotifications.filter(n => !n.read).length);
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
        <div className="gate-notifications-page">
            <div className="gate-notifications-header">
                <div className="gate-notifications-title">
                    <h2>Notifications</h2>
                    <span className="gate-notifications-count">
                        {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                    </span>
                </div>
                {unreadCount > 0 && (
                    <button className="gate-mark-all-read-btn" onClick={markAllAsRead}>
                        <span>✓</span> Mark All as Read
                    </button>
                )}
            </div>

            <div className="gate-notifications-filters">
                <button
                    className={`gate-filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    All ({notifications.length})
                </button>
                <button
                    className={`gate-filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => setFilter('unread')}
                >
                    Unread ({unreadCount})
                </button>
                <button
                    className={`gate-filter-btn ${filter === 'request' ? 'active' : ''}`}
                    onClick={() => setFilter('request')}
                >
                    📋 Requests
                </button>
                <button
                    className={`gate-filter-btn ${filter === 'alert' ? 'active' : ''}`}
                    onClick={() => setFilter('alert')}
                >
                    ⚠️ Alerts
                </button>
                <button
                    className={`gate-filter-btn ${filter === 'info' ? 'active' : ''}`}
                    onClick={() => setFilter('info')}
                >
                    ℹ️ Info
                </button>
                <button
                    className={`gate-filter-btn ${filter === 'success' ? 'active' : ''}`}
                    onClick={() => setFilter('success')}
                >
                    ✓ Success
                </button>
            </div>

            <div className="gate-notifications-list-page">
                {filteredNotifications.length === 0 ? (
                    <div className="gate-no-notifications-page">
                        <span className="gate-no-notifications-icon-page">🔔</span>
                        <h3>No notifications</h3>
                        <p>You're all caught up! Check back later for updates.</p>
                    </div>
                ) : (
                    filteredNotifications.map(notification => (
                        <div
                            key={notification.id}
                            className={`gate-notification-card ${notification.read ? 'read' : 'unread'} ${notification.type}`}
                        >
                            <div className="gate-notification-card-icon">
                                {notification.type === 'request' && '📋'}
                                {notification.type === 'alert' && '⚠️'}
                                {notification.type === 'info' && 'ℹ️'}
                                {notification.type === 'success' && '✓'}
                            </div>
                            <div className="gate-notification-card-content">
                                <div className="gate-notification-card-header">
                                    <strong className="gate-notification-card-title">{notification.title}</strong>
                                    {!notification.read && <div className="gate-notification-card-unread-dot"></div>}
                                </div>
                                <p className="gate-notification-card-message">{notification.message}</p>
                                <span className="gate-notification-card-time">
                                    {formatNotificationTime(notification.createdAt)}
                                </span>
                            </div>
                            <div className="gate-notification-card-actions">
                                {!notification.read && (
                                    <button
                                        className="gate-notification-action-btn mark-read"
                                        onClick={() => markAsRead(notification.id)}
                                        title="Mark as read"
                                    >
                                        ✓
                                    </button>
                                )}
                                <button
                                    className="gate-notification-action-btn delete"
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

export default GateNotifications;
