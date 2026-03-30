import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import NotificationBell from './NotificationBell';
import NotificationPanel from './NotificationPanel';
import { logout } from '../api/api';
import './AdminHeader.css';

const AdminHeader = () => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);
  const [prevCount, setPrevCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [profileImage, setProfileImage] = useState(
    localStorage.getItem('adminProfilePhoto') || 'https://via.placeholder.com/40'
  );
  const navigate = useNavigate();

  useEffect(() => {
    const handleStorageChange = () => {
      const savedPhoto = localStorage.getItem('adminProfilePhoto');
      if (savedPhoto) setProfileImage(savedPhoto);
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('adminProfileUpdated', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('adminProfileUpdated', handleStorageChange);
    };
  }, []);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
      osc.start(); osc.stop(ctx.currentTime + 0.5);
    } catch (e) {}
  };

  // Load real unread count from DB
  useEffect(() => {
    const loadCount = () => {
      const token = localStorage.getItem('authToken');
      fetch('/api/admin/notifications', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { 
          if (Array.isArray(data)) {
            const newUnread = data.filter(n => !n.read).length;
            setNotificationCount(newUnread);
            setNotificationCount(current => {
              if (newUnread > current) playChime();
              return newUnread;
            });
          }
        })
        .catch(() => {});
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <>
      <div className="admin-header">
        <div className="header-left">
          <h1 className="page-title">Dashboard</h1>
        </div>
        
        <div className="header-right">
          <NotificationBell 
            count={notificationCount}
            onClick={() => setShowNotifications(true)}
          />
          
          <div className="header-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
            <img src={profileImage} alt="Admin" className="header-avatar" />
            <div className="header-profile-info">
              <span className="header-profile-name">Admin User</span>
              <span className="header-profile-role">Administrator</span>
            </div>
            <span className="profile-dropdown-arrow">▼</span>
            
            {showProfileMenu && (
              <div className="profile-dropdown-menu">
                <Link to="/admin/settings" className="dropdown-menu-item">
                  <span>👤</span>
                  <span>My Profile</span>
                </Link>
                <Link to="/admin/settings" className="dropdown-menu-item">
                  <span>⚙️</span>
                  <span>Settings</span>
                </Link>
                <div className="dropdown-divider"></div>
                <button className="dropdown-menu-item logout-item" onClick={handleLogout}>
                  <span>🚪</span>
                  <span>Logout</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />
    </>
  );
};

export default AdminHeader;
