import { useState, useContext } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import { logout as apiLogout } from './api/api';
import 'leaflet/dist/leaflet.css';
import './App.css';

// Landing
import LandingPage from './pages/landing/LandingPage';

// Auth
import Login from './pages/auth/Login';

// Components
import AdminHeader from './components/AdminHeader';

// Admin
import AdminSidebar from './pages/admin/AdminSidebar';
import AdminDashboardOverview from './pages/admin/AdminDashboardOverview';
import ManageVehiclesPage from './pages/admin/ManageVehiclesPage';
import AddVehicle from './pages/admin/AddVehicle';
import VehicleStatus from './pages/admin/VehicleStatus';
import VehicleTripHistory from './pages/admin/VehicleTripHistory';
import ManageUsersPage from './pages/admin/ManageUsersPage';
import AddUser from './pages/admin/AddUser';
import ManageDrivers from './pages/admin/ManageDrivers';
import UserRequestReport from './pages/admin/UserRequestReport';
import VehicleTripReport from './pages/admin/VehicleTripReport';
import DriverTripReport from './pages/admin/DriverTripReport';
import DriverPerformanceReport from './pages/admin/DriverPerformanceReport';
import FuelRecordsReport from './pages/admin/FuelRecordsReport';
import FuelRequestApproval from './pages/admin/FuelRequestApproval';
import AdminControlCenter from './pages/admin/AdminControlCenter';
import Settings from './pages/admin/Settings';

// Transport Officer
import TransportOfficerLayout from './pages/transportOfficer/TransportOfficerLayout';
import TransportDashboard from './pages/transportOfficer/TransportDashboard';
import Requests from './pages/transportOfficer/Requests';
import TripManagement from './pages/transportOfficer/TripManagement';
import VehicleTracking from './pages/transportOfficer/VehicleTracking';
import DriverCoordination from './pages/transportOfficer/DriverCoordination';
import TransportComplaints from './pages/transportOfficer/TransportComplaints';
import ComplaintHistory from './pages/transportOfficer/ComplaintHistory';
import TransportReports from './pages/transportOfficer/TransportReports';
import MaintenanceMonitor from './pages/transportOfficer/MaintenanceMonitor';
import TransportNotifications from './pages/transportOfficer/TransportNotifications';

// Driver
import DriverDashboard from './pages/driver/DriverDashboard';

// User
import UserLayout from './pages/user/UserLayout';
import UserDashboard from './pages/user/UserDashboard';
import UserProfile from './pages/user/UserProfile';
import SubmitVehicleRequest from './pages/user/SubmitVehicleRequest';
import RequestStatus from './pages/user/RequestStatus';
import SubmitComplaint from './pages/user/SubmitComplaint';
import Notifications from './pages/user/Notifications';

// Fuel Station Officer
import FuelStationLayout from './pages/fuelStationOfficer/FuelStationLayout';
import FuelDashboard from './pages/fuelStationOfficer/FuelDashboard';
import FuelRequests from './pages/fuelStationOfficer/FuelRequests';
import FuelDispenseForm from './pages/fuelStationOfficer/FuelDispenseForm';
import FuelInventory from './pages/fuelStationOfficer/FuelInventory';
import FuelTransactionHistory from './pages/fuelStationOfficer/FuelTransactionHistory';
import FuelReports from './pages/fuelStationOfficer/FuelReports';
import FuelNotifications from './pages/fuelStationOfficer/FuelNotifications';
import FuelStationProfile from './pages/fuelStationOfficer/FuelStationProfile';
import FuelStationSettings from './pages/fuelStationOfficer/FuelStationSettings';

// Gate Security
import GateSecurityLayout from './pages/gateSecurity/GateSecurityLayout';
import GateDashboard from './pages/gateSecurity/GateDashboard';
import ALPRCamera from './pages/gateSecurity/ALPRCamera';
import VehicleVerification from './pages/gateSecurity/VehicleVerification';
import GateLogs from './pages/gateSecurity/GateLogs';
import TripAuthorization from './pages/gateSecurity/TripAuthorization';
import VehicleInspection from './pages/gateSecurity/VehicleInspection';
import VehicleMovement from './pages/gateSecurity/VehicleMovement';
import GateNotifications from './pages/gateSecurity/GateNotifications';
import GateSecurityProfile from './pages/gateSecurity/GateSecurityProfile';
import GateSecurityReports from './pages/gateSecurity/GateSecurityReports';
import GateSecuritySettings from './pages/GateSecurity/GateSecuritySettings';

// Maintenance
import MaintenanceDashboard from './pages/maintenance/MaintenanceDashboard';

export default function App() {
  const { user, setUser } = useContext(AuthContext);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const navigate = useNavigate();

  const handleLogin = (userData) => {
    setUser(userData);
  };

  const handleLogout = () => {
    apiLogout();
    setUser(null);
    navigate('/');
  };

  return (
    <Routes>
      {/* Landing Page - Always accessible */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login onLogin={handleLogin} />} />

      {!user && (
        <>
          <Route path="*" element={<Navigate to="/" replace />} />
        </>
      )}

      {/* Admin Routes */}
      {user?.role === 'ADMIN' && (
        <>
          <Route path="/admin" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <AdminDashboardOverview />
              </div>
            </div>
          } />
          <Route path="/admin/dashboard" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <AdminDashboardOverview />
              </div>
            </div>
          } />
          <Route path="/admin/manage-vehicles" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <ManageVehiclesPage />
              </div>
            </div>
          } />
          <Route path="/admin/vehicle-status" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <VehicleStatus />
              </div>
            </div>
          } />
          <Route path="/admin/add-vehicle" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <AddVehicle />
              </div>
            </div>
          } />
          <Route path="/admin/vehicle-trip-history" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <VehicleTripHistory />
              </div>
            </div>
          } />
          <Route path="/admin/manage-users" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <ManageUsersPage />
              </div>
            </div>
          } />
          <Route path="/admin/add-user" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <AddUser />
              </div>
            </div>
          } />
          <Route path="/admin/manage-drivers" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <ManageDrivers />
              </div>
            </div>
          } />
          <Route path="/admin/user-request-report" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <UserRequestReport />
              </div>
            </div>
          } />
          <Route path="/admin/vehicle-trip-report" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <VehicleTripReport />
              </div>
            </div>
          } />
          <Route path="/admin/driver-trip-report" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <DriverTripReport />
              </div>
            </div>
          } />
          <Route path="/admin/driver-performance-report" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <DriverPerformanceReport />
              </div>
            </div>
          } />
          <Route path="/admin/fuel-records-report" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <FuelRecordsReport />
              </div>
            </div>
          } />
          <Route path="/admin/fuel-requests" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <FuelRequestApproval />
              </div>
            </div>
          } />
          <Route path="/admin/settings" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <Settings />
              </div>
            </div>
          } />
          <Route path="/admin/control-center" element={
            <div className="app">
              <AdminSidebar onLogout={handleLogout} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed(p => !p)} />
              <div className={`main-content${sidebarCollapsed ? " main-content-collapsed" : ""}`}>
                <AdminHeader />
                <AdminControlCenter />
              </div>
            </div>
          } />
        </>
      )}

      {/* Transport Officer Routes */}
      {user?.role === 'TRANSPORT' && (
        <>
          <Route path="/transport/*" element={<TransportOfficerLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<TransportDashboard />} />
            <Route path="requests" element={<Requests />} />
            <Route path="trips" element={<TripManagement />} />
            <Route path="tracking" element={<VehicleTracking />} />
            <Route path="drivers" element={<DriverCoordination />} />
            <Route path="maintenance" element={<MaintenanceMonitor />} />
            <Route path="notifications" element={<TransportNotifications />} />
            <Route path="complaints" element={<TransportComplaints />} />
            <Route path="complaint-history" element={<ComplaintHistory />} />
            <Route path="reports" element={<TransportReports />} />
            <Route index element={<Navigate to="dashboard" replace />} />
          </Route>
          <Route path="*" element={<Navigate to="/transport/dashboard" replace />} />
        </>
      )}

      {/* Driver Routes */}
      {user?.role === 'DRIVER' && (
        <>
          <Route path="/driver" element={<DriverDashboard onLogout={handleLogout} />} />
          <Route path="/driver/dashboard" element={<DriverDashboard onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/driver" replace />} />
        </>
      )}

      {/* User Routes */}
      {user?.role === 'USER' && (
        <>
          <Route path="/user" element={<UserLayout onLogout={handleLogout} />}>
            <Route index element={<UserDashboard />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="request-vehicle" element={<SubmitVehicleRequest />} />
            <Route path="my-requests" element={<RequestStatus />} />
            <Route path="submit-complaint" element={<SubmitComplaint />} />
            <Route path="notifications" element={<Notifications />} />
            <Route path="profile" element={<UserProfile />} />
          </Route>
        </>
      )}

      {/* Fuel Station Officer Routes */}
      {user?.role === 'FUEL_OFFICER' && (
        <>
          <Route path="/fuel" element={<FuelStationLayout onLogout={handleLogout} />}>
            <Route index element={<Navigate to="/fuel/dashboard" replace />} />
            <Route path="dashboard" element={<FuelDashboard />} />
            <Route path="requests" element={<FuelRequests />} />
            <Route path="dispense" element={<FuelDispenseForm />} />
            <Route path="inventory" element={<FuelInventory />} />
            <Route path="reports" element={<FuelReports />} />
            <Route path="notifications" element={<FuelNotifications />} />
            <Route path="transactions" element={<FuelTransactionHistory />} />
            <Route path="profile" element={<FuelStationProfile />} />
            <Route path="settings" element={<FuelStationSettings />} />
            <Route path="performance" element={<FuelDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/fuel/dashboard" replace />} />
        </>
      )}

      {/* Gate Security Routes */}
      {user?.role === 'GATE_OFFICER' && (
        <>
          <Route path="/gate" element={<Navigate to="/gate/dashboard" replace />} />
          <Route path="/gate" element={<GateSecurityLayout onLogout={handleLogout} />}>
            <Route path="dashboard" element={<GateDashboard />} />
            <Route path="camera" element={<ALPRCamera />} />
            <Route path="verification" element={<VehicleVerification />} />
            <Route path="trip-authorization" element={<TripAuthorization />} />
            <Route path="inspection" element={<VehicleInspection />} />
            <Route path="movement" element={<VehicleMovement />} />
            <Route path="logs" element={<GateLogs />} />
            <Route path="reports" element={<GateSecurityReports />} />
            <Route path="notifications" element={<GateNotifications />} />
            <Route path="profile" element={<GateSecurityProfile />} />
            <Route path="settings" element={<GateSecuritySettings />} />
            <Route path="performance" element={<GateDashboard />} />
          </Route>
          <Route path="*" element={<Navigate to="/gate/dashboard" replace />} />
        </>
      )}

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />

      {/* Maintenance Officer Routes */}
      {user?.role === 'MAINTENANCE' && (
        <>
          <Route path="/maintenance/dashboard" element={<MaintenanceDashboard />} />
          <Route path="/maintenance" element={<Navigate to="/maintenance/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/maintenance/dashboard" replace />} />
        </>
      )}
    </Routes>
  );
}
