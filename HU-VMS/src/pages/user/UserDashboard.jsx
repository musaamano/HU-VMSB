import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getRequests, getCurrentUser } from '../../api/api';
import './UserDashboard.css';

const UserDashboard = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [stats, setStats] = useState({ 
    totalTrips: 0, 
    distanceDriven: 0, 
    drivingHours: 0,
    currentTrip: null,
    rating: 0,
    scheduleTrips: 0,
    currentVehicle: null
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    // Update time every minute
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    
    // Fetch user data
    const fetchUserData = async () => {
      try {
        const userRequests = await getRequests();
        setRequests(userRequests || []);
        
        // Calculate stats from real data
        const totalTrips = userRequests?.length || 0;
        const approvedTrips = userRequests?.filter(req => ['approved', 'assigned', 'accepted', 'started', 'completed'].includes(req.status)) || [];
        const pendingTrips = userRequests?.filter(req => req.status === 'pending') || [];
        const currentTrip = userRequests?.find(req => ['assigned', 'accepted', 'started'].includes(req.status));
        const upcomingTrips = userRequests?.filter(req => ['approved', 'assigned'].includes(req.status)) || [];
        
        setStats({
          totalTrips: totalTrips,
          distanceDriven: approvedTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
          drivingHours: approvedTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0),
          currentTrip: currentTrip ? `${currentTrip.pickupLocation} to ${currentTrip.destination}` : null,
          rating: 4.5, // Could be calculated from actual ratings if available
          scheduleTrips: upcomingTrips.length,
          currentVehicle: currentTrip?.assignedVehicle?.plateNumber || null
        });
      } catch (error) {
        console.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    return () => clearInterval(timeInterval);
  }, []);

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="user-dashboard-loading">
        <div className="user-loading-spinner"></div>
        <p>Loading your dashboard...</p>
      </div>
    );
  }

  return (
    <div className="user-dashboard-container">
      {/* Search Bar */}
      <div className="user-search-section">
        <div className="user-search-bar">
          <span className="user-search-icon">�</span>
          <input type="text" placeholder="Search trips, vehicles, or routes..." />
        </div>
      </div>

      {/* Welcome Message */}
      <div className="user-welcome-section">
        <h1>{getGreeting()}, {currentUser?.name || 'User'}!</h1>
        <p>Here's your travel overview for today, {currentUser?.name?.split(' ')[0] || 'User'}</p>
      </div>

      {/* Stats Grid */}
      <div className="user-stats-grid">
        <div className="user-stat-card">
          <div className="user-stat-icon">🚗</div>
          <div className="user-stat-value">{stats.totalTrips}</div>
          <div className="user-stat-label">Total trips</div>
        </div>
        
        <div className="user-stat-card">
          <div className="user-stat-icon">📍</div>
          <div className="user-stat-value">{stats.distanceDriven}</div>
          <div className="user-stat-label">Distance driven (km)</div>
        </div>
        
        <div className="user-stat-card">
          <div className="user-stat-icon">⏱️</div>
          <div className="user-stat-value">{stats.drivingHours}</div>
          <div className="user-stat-label">Driving hours</div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="user-main-grid">
        {/* Current Trip Card */}
        <div className="user-card current-trip">
          <div className="user-card-header">
            <h3>Current trip</h3>
            <span className="user-card-status">{stats.currentTrip ? 'Active' : 'No active trip'}</span>
          </div>
          <div className="user-card-content">
            {stats.currentTrip ? (
              <div className="user-trip-info">
                <div className="user-trip-route">
                  <div className="user-trip-point">
                    <span className="user-point-label">Current</span>
                    <span className="user-point-location">{stats.currentTrip}</span>
                  </div>
                  <div className="user-trip-line"></div>
                  <div className="user-trip-point">
                    <span className="user-point-label">Vehicle</span>
                    <span className="user-point-location">{stats.currentVehicle || 'Not assigned'}</span>
                  </div>
                </div>
                <div className="user-trip-details">
                  <span className="user-trip-time">In progress</span>
                  <span className="user-trip-eta">Track live</span>
                </div>
              </div>
            ) : (
              <div className="user-no-trip">
                <span className="user-no-trip-icon">🚗</span>
                <p>No active trips</p>
                <button onClick={() => navigate('/user/request-vehicle')} className="user-request-btn">
                  Request Vehicle
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Map Card */}
        <div className="user-card map-card">
          <div className="user-card-header">
            <h3>Map</h3>
          </div>
          <div className="user-card-content">
            <div className="user-map-placeholder">
              <span className="user-map-icon">🗺️</span>
              <p>Live map view</p>
            </div>
          </div>
        </div>

        {/* Rating Card */}
        <div className="user-card rating-card">
          <div className="user-card-header">
            <h3>Your Rating</h3>
          </div>
          <div className="user-card-content">
            <div className="user-rating-display">
              <div className="user-rating-stars">
                {[1, 2, 3, 4, 5].map(star => (
                  <span key={star} className={`user-star ${star <= Math.floor(stats.rating) ? 'filled' : ''}`}>
                    {star <= Math.floor(stats.rating) ? '⭐' : '☆'}
                  </span>
                ))}
              </div>
              <div className="user-rating-value">{stats.rating.toFixed(1)}</div>
              <div className="user-rating-label">Average rating</div>
            </div>
          </div>
        </div>

        {/* Schedule of Trips */}
        <div className="user-card schedule-card">
          <div className="user-card-header">
            <h3>Schedule of trips</h3>
          </div>
          <div className="user-card-content">
            {requests.filter(req => ['approved', 'assigned'].includes(req.status)).length > 0 ? (
              <div className="user-trip-schedule">
                {requests
                  .filter(req => ['approved', 'assigned'].includes(req.status))
                  .slice(0, 3)
                  .map((trip, index) => (
                    <div key={trip._id} className="user-schedule-item">
                      <div className="user-schedule-time">
                        {trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'TBD'}
                      </div>
                      <div className="user-schedule-details">
                        <div className="user-schedule-destination">{trip.destination}</div>
                        <div className="user-schedule-purpose">{trip.purpose || 'Trip'}</div>
                      </div>
                      <div className="user-schedule-status">
                        <span className={`user-status-badge ${trip.status}`}>{trip.status}</span>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="user-no-schedule">
                <span className="user-no-schedule-icon">📅</span>
                <p>No scheduled trips</p>
                <button onClick={() => navigate('/user/request-vehicle')} className="user-request-btn">
                  Schedule Trip
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Current Vehicle */}
        <div className="user-card vehicle-card">
          <div className="user-card-header">
            <h3>Current vehicle</h3>
          </div>
          <div className="user-card-content">
            {stats.currentVehicle ? (
              <div className="user-vehicle-info">
                <div className="user-vehicle-details">
                  <div className="user-vehicle-plate">{stats.currentVehicle}</div>
                  <div className="user-vehicle-type">Assigned Vehicle</div>
                </div>
                <div className="user-vehicle-status">
                  <span className="user-vehicle-badge active">Active</span>
                </div>
              </div>
            ) : (
              <div className="user-no-vehicle">
                <span className="user-no-vehicle-icon">🚗</span>
                <p>No vehicle assigned</p>
                <button onClick={() => navigate('/user/request-vehicle')} className="user-request-btn">
                  Request Vehicle
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
