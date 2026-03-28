import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import NotificationBell from '../../components/NotificationBell';
import NotificationPanel from '../../components/NotificationPanel';
import './adminSidebar.css';

const Icon = ({ d, size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
    style={{ flexShrink: 0 }}>
    <path d={d} />
  </svg>
);

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  vehicle:   "M5 17H3a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v5 M16 17h2a2 2 0 0 0 2-2v-1 M9 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0 M17 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0",
  users:     "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75",
  reports:   "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z M14 2v6h6 M16 13H8 M16 17H8 M10 9H8",
  settings:  "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z",
};

const AdminSidebar = ({ onLogout, collapsed, onToggleCollapse }) => {
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  useEffect(() => {
    const loadCount = () => {
      const token = localStorage.getItem('authToken');
      fetch('/api/admin/notifications', {
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      })
        .then(r => r.json())
        .then(data => { if (Array.isArray(data)) setNotificationCount(data.filter(n => !n.read).length); })
        .catch(() => {});
    };
    loadCount();
    const interval = setInterval(loadCount, 30000);
    return () => clearInterval(interval);
  }, []);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleDropdown = (menu) => {
    setOpenDropdown(openDropdown === menu ? '' : menu);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  const handleMenuItemClick = () => {
    setOpenDropdown('');
    closeMobileMenu();
  };

  return (
    <>
      {/* Mobile Menu Toggle Button */}
      <button className="mobile-menu-toggle" onClick={toggleMobileMenu}>
        <span className={`hamburger ${isMobileMenuOpen ? 'open' : ''}`}>
          <span></span>
          <span></span>
          <span></span>
        </span>
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="mobile-overlay" onClick={closeMobileMenu}></div>
      )}

      <div className={`admin-sidebar ${isMobileMenuOpen ? 'mobile-open' : ''} ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        {!collapsed && <h2>Admin Panel</h2>}
        <button className="sidebar-collapse-btn" onClick={onToggleCollapse} title={collapsed ? 'Expand' : 'Collapse'}>
          {collapsed ? '▶' : '◀'}
        </button>
      </div>

      <NotificationPanel 
        isOpen={showNotifications}
        onClose={() => setShowNotifications(false)}
      />

      <nav className="sidebar-nav">
        <Link 
          to="/admin/dashboard" 
          className={`nav-item ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}
          onClick={closeMobileMenu}
          title="Dashboard Overview"
        >
          <Icon d={ICONS.dashboard} />
          {!collapsed && <span>Dashboard Overview</span>}
        </Link>

        <Link 
          to="/admin/control-center" 
          className={`nav-item ${location.pathname === '/admin/control-center' ? 'active' : ''}`}
          onClick={closeMobileMenu}
          title="Control Center"
        >
          <Icon d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          {!collapsed && <span>Control Center</span>}
        </Link>

        <div className="nav-dropdown">
          <div 
            className={`nav-item dropdown-toggle ${openDropdown === 'vehicles' ? 'open' : ''}`}
            onClick={() => !collapsed && toggleDropdown('vehicles')}
            title="Vehicles"
          >
            <Icon d={ICONS.vehicle} />
            {!collapsed && <><span>Vehicles</span>
            <span className="dropdown-arrow">{openDropdown === 'vehicles' ? '▼' : '▶'}</span></>}
          </div>
          {!collapsed && openDropdown === 'vehicles' && (
            <div className="dropdown-menu">
              <Link 
                to="/admin/manage-vehicles" 
                className={`dropdown-item ${location.pathname === '/admin/manage-vehicles' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                View Vehicle List
              </Link>
              <Link 
                to="/admin/add-vehicle" 
                className={`dropdown-item ${location.pathname === '/admin/add-vehicle' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Add Vehicle
              </Link>
              <Link 
                to="/admin/vehicle-trip-history" 
                className={`dropdown-item ${location.pathname === '/admin/vehicle-trip-history' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Trip History
              </Link>
            </div>
          )}
        </div>

        <div className="nav-dropdown">
          <div 
            className={`nav-item dropdown-toggle ${openDropdown === 'users' ? 'open' : ''}`}
            onClick={() => !collapsed && toggleDropdown('users')}
            title="Users"
          >
            <Icon d={ICONS.users} />
            {!collapsed && <><span>Users</span>
            <span className="dropdown-arrow">{openDropdown === 'users' ? '▼' : '▶'}</span></>}
          </div>
          {!collapsed && openDropdown === 'users' && (
            <div className="dropdown-menu">
              <Link 
                to="/admin/manage-users" 
                className={`dropdown-item ${location.pathname === '/admin/manage-users' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Manage Users
              </Link>
              <Link 
                to="/admin/add-user" 
                className={`dropdown-item ${location.pathname === '/admin/add-user' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Add New User
              </Link>
              <Link 
                to="/admin/manage-drivers" 
                className={`dropdown-item ${location.pathname === '/admin/manage-drivers' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Manage Drivers
              </Link>
            </div>
          )}
        </div>

        <div className="nav-dropdown">
          <div 
            className={`nav-item dropdown-toggle ${openDropdown === 'reports' ? 'open' : ''}`}
            onClick={() => !collapsed && toggleDropdown('reports')}
            title="Reports"
          >
            <Icon d={ICONS.reports} />
            {!collapsed && <><span>Reports</span>
            <span className="dropdown-arrow">{openDropdown === 'reports' ? '▼' : '▶'}</span></>}
          </div>
          {!collapsed && openDropdown === 'reports' && (
            <div className="dropdown-menu">
              <Link 
                to="/admin/user-request-report" 
                className={`dropdown-item ${location.pathname === '/admin/user-request-report' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                User Request Report
              </Link>
              <Link 
                to="/admin/vehicle-trip-report" 
                className={`dropdown-item ${location.pathname === '/admin/vehicle-trip-report' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Vehicle Trip Report
              </Link>
              <Link 
                to="/admin/driver-trip-report" 
                className={`dropdown-item ${location.pathname === '/admin/driver-trip-report' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Driver Trip Report
              </Link>
              <Link 
                to="/admin/driver-performance-report" 
                className={`dropdown-item ${location.pathname === '/admin/driver-performance-report' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Driver Performance
              </Link>
              <Link 
                to="/admin/fuel-records-report" 
                className={`dropdown-item ${location.pathname === '/admin/fuel-records-report' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Fuel Records
              </Link>
              <Link 
                to="/admin/fuel-requests" 
                className={`dropdown-item ${location.pathname === '/admin/fuel-requests' ? 'active' : ''}`}
                onClick={handleMenuItemClick}
              >
                Fuel Request Approval
              </Link>
            </div>
          )}
        </div>
      </nav>
    </div>
    </>
  );
};

export default AdminSidebar;
