import { Outlet } from "react-router-dom";
import { useContext, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import TransportSidebar from './TransportSidebar';
import TransportHeader from './TransportHeader';
import "./transportOfficerLayout.css";

export default function TransportOfficerLayout() {
  const { logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const handleLogout = () => {
    logout();
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="transport-layout">
      <TransportSidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div className={`transport-main ${!isSidebarOpen ? 'expanded' : ''}`}>
        <TransportHeader 
          title="Transport Operations" 
          onLogout={handleLogout}
          toggleSidebar={toggleSidebar}
          isSidebarOpen={isSidebarOpen}
        />
        
        <main className="transport-content">
          <div className="content-container">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}