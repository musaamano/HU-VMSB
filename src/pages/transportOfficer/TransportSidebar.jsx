import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  ClipboardList, 
  Map, 
  MapPin, 
  Users, 
  AlertTriangle, 
  FileText,
  Truck,
  ChevronLeft,
  ChevronRight,
  History,
  Wrench
} from 'lucide-react';
import './TransportSidebar.css';

const TransportSidebar = ({ isOpen, toggleSidebar }) => {
  const location = useLocation();

  const menuItems = [
    { path: '/transport/dashboard',       icon: <LayoutDashboard size={20} />, label: 'Dashboard' },
    { path: '/transport/requests',        icon: <ClipboardList size={20} />,   label: 'Request Pool' },
    { path: '/transport/trips',           icon: <Map size={20} />,             label: 'Trip Management' },
    { path: '/transport/tracking',        icon: <MapPin size={20} />,          label: 'Vehicle Tracking' },
    { path: '/transport/drivers',         icon: <Users size={20} />,           label: 'Driver Coordination' },
    { path: '/transport/maintenance',     icon: <Wrench size={20} />,          label: 'Maintenance' },
    { path: '/transport/complaints',      icon: <AlertTriangle size={20} />,   label: 'Complaints' },
    { path: '/transport/complaint-history', icon: <History size={20} />,       label: 'Complaint History' },
    { path: '/transport/reports',         icon: <FileText size={20} />,        label: 'Reports' },
  ];

  return (
    <div className={`transport-sidebar ${!isOpen ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-container">
          <div className="logo-icon">
            <Truck size={24} color="var(--primary-color)" />
          </div>
          {isOpen && <h2 className="brand-text">HU-VMS</h2>}
        </div>
      </div>
      
      <nav className="sidebar-nav">
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            title={!isOpen ? item.label : ''}
          >
            <div className="nav-icon">{item.icon}</div>
            {isOpen && <span className="nav-label">{item.label}</span>}
          </Link>
        ))}
      </nav>
      
      <div className="sidebar-footer">
        <button className="collapse-btn" onClick={toggleSidebar}>
          {isOpen ? <ChevronLeft size={20} /> : <ChevronRight size={20} />}
          {isOpen && <span>Collapse</span>}
        </button>
      </div>
    </div>
  );
};

export default TransportSidebar;
