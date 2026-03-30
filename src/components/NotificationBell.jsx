import { useState } from 'react';
import './NotificationBell.css';

const NotificationBell = ({ count = 0, onClick }) => {
  const [isAnimating, setIsAnimating] = useState(false);

  const handleClick = () => {
    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 500);
    onClick?.();
  };

  return (
    <button 
      className={`notification-bell ${isAnimating ? 'ringing' : ''}`}
      onClick={handleClick}
      aria-label="Notifications"
    >
      <span className="bell-icon">🔔</span>
      {count > 0 && (
        <span className="notification-badge">{count > 99 ? '99+' : count}</span>
      )}
    </button>
  );
};

export default NotificationBell;
