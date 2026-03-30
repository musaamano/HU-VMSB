import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Cell, PieChart, Pie
} from 'recharts';
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
    rating: 4.8,
    scheduleTrips: 0,
    currentVehicle: null,
    pendingRequests: 0,
    completedTrips: 0
  });
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timeInterval = setInterval(() => setCurrentTime(new Date()), 60000);
    
    const fetchUserData = async () => {
      try {
        const userRequests = await getRequests();
        const myRequests = userRequests || [];
        setRequests(myRequests);
        
        const approvedTrips = myRequests.filter(req => ['approved', 'assigned', 'accepted', 'started', 'completed'].includes(req.status));
        const currentTrip = myRequests.find(req => ['assigned', 'accepted', 'started'].includes(req.status));
        const upcomingTrips = myRequests.filter(req => ['approved', 'assigned'].includes(req.status));
        const completedTrips = myRequests.filter(req => req.status === 'completed').length;
        const pendingRequests = myRequests.filter(req => req.status === 'pending').length;
        
        setStats({
          totalTrips: myRequests.length,
          distanceDriven: approvedTrips.reduce((sum, trip) => sum + (trip.distance || 0), 0),
          drivingHours: approvedTrips.reduce((sum, trip) => sum + (trip.duration || 0), 0),
          currentTrip: currentTrip ? `${currentTrip.pickupLocation} to ${currentTrip.destination}` : null,
          rating: null,
          scheduleTrips: upcomingTrips.length,
          currentVehicle: currentTrip?.assignedVehicle?.plateNumber || null,
          pendingRequests,
          completedTrips
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
    if (hour < 12) return 'Good Morning';
    if (hour < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  if (loading) {
    return (
      <div className="user-dashboard-loader">
        <div className="pulse-loader"></div>
        <p style={{ marginTop: '20px', color: '#16a34a', fontWeight: '800' }}>INITIALIZING COMMAND HUB...</p>
      </div>
    );
  }

  // Chart Data preparation
  const tripStatusData = [
    { name: 'Completed', value: stats.completedTrips, fill: '#16a34a' },
    { name: 'Pending', value: stats.pendingRequests, fill: '#f59e0b' },
    { name: 'Upcoming', value: stats.scheduleTrips, fill: '#3b82f6' }
  ].filter(d => d.value > 0);

  // Fallback data for chart if empty
  const displayTripData = tripStatusData.length > 0 ? tripStatusData : [
    { name: 'No Data', value: 1, fill: '#e2e8f0' }
  ];

  const monthlyActivityData = [
    { month: 'Jan', trips: 4 },
    { month: 'Feb', trips: 7 },
    { month: 'Mar', trips: stats.totalTrips || 5 },
  ];

  return (
    <div className="modern-user-dashboard">
      {/* ── Green Hero Section ── */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <div className="user-greeting">
            <h1>{getGreeting()}, {currentUser?.name?.split(' ')[0] || 'User'}!</h1>
            <p>Your transport logistics are optimized and ready for the day.</p>
          </div>
          <button onClick={() => navigate('/user/request-vehicle')} className="premium-btn primary">
            + NEW REQUEST
          </button>
        </div>
      </div>

      {/* ── Metrics Histogram Section ── */}
      <div className="metrics-histogram-section">
        <div className="histogram-header">
          <div className="h-left">
            <h3>Usage Analytics</h3>
            <p>Overview of your travel metrics and system interaction.</p>
          </div>
          <div className="live-status-pill">
            <div className="dot"></div>
            SYSTEM OPERATIONAL
          </div>
        </div>
        
        <div className="histogram-chart-wrapper">
          <div style={{ width: '100%', height: '220px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyActivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                <Tooltip 
                  cursor={{ fill: 'rgba(22, 163, 74, 0.05)' }}
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                />
                <Bar dataKey="trips" fill="#16a34a" radius={[6, 6, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Insight & Matrix Section ── */}
      <div className="insight-section">
        {/* Status Breakdown Chart */}
        <div className="insight-card">
          <div className="insight-header">
            <h3>Request Lifecycle</h3>
            <p>Distribution of your transport requests by status.</p>
          </div>
          <div className="chart-wrapper">
            <div style={{ width: '150px', height: '150px' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={displayTripData}
                    cx="50%"
                    cy="50%"
                    innerRadius={45}
                    outerRadius={65}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                  >
                    {displayTripData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="legend-pills-container" style={{ flex: 1 }}>
              {displayTripData.map((item, idx) => (
                <div key={idx} className="legend-pills" style={{ marginBottom: '8px' }}>
                  <span className="pill-dot" style={{ background: item.fill }}></span>
                  <span className="pill-name">{item.name}</span>
                  <span className="pill-val">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* User Rating / Satisfaction */}
        <div className="insight-card">
          <div className="insight-header">
            <h3>Experience Score</h3>
            <p>Your consistent feedback helps us improve.</p>
          </div>
          <div className="experience-score-display">
            {stats.rating !== null ? (
              <>
                <div className="score-value">{stats.rating}</div>
                <div className="score-stars">★★★★★</div>
                <div className="score-label">OFFICIAL USER RATING</div>
              </>
            ) : (
              <>
                <div className="score-value" style={{ fontSize: '28px', color: '#94a3b8' }}>N/A</div>
                <div className="score-label" style={{ color: '#94a3b8' }}>NO RATING YET</div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Matrix (Trips) ── */}
      <div className="bottom-detail-matrix">
        <div className="live-matrix-card">
          <div className="matrix-header">
            <h3>Active Commute</h3>
            <span className="live-tag">LIVE TRACKING</span>
          </div>
          
          <div className="matrix-active-trip">
            {stats.currentTrip ? (
              <div className="commute-path">
                <span className="node-val">{stats.currentTrip.split(' to ')[0]}</span>
                <div className="path-liner active-anim"></div>
                <span className="node-val">{stats.currentTrip.split(' to ')[1]}</span>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '20px', color: '#64748b' }}>
                <p>No active trips detected.</p>
                <button onClick={() => navigate('/user/request-vehicle')} style={{ marginTop: '12px', background: 'none', border: '1px solid #cbd5e1', padding: '6px 16px', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '12px' }}>
                  Request Now
                </button>
              </div>
            )}
            
            <div style={{ marginTop: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h4 style={{ fontSize: '14px', fontWeight: '800' }}>UPCOMING SCHEDULE</h4>
                <a onClick={() => navigate('/user/request-status')} className="matrix-link">VIEW ALL</a>
              </div>
              
              {requests.filter(req => ['approved', 'assigned'].includes(req.status)).length > 0 ? (
                requests
                  .filter(req => ['approved', 'assigned'].includes(req.status))
                  .slice(0, 3)
                  .map((trip, idx) => (
                    <div key={idx} className="mission-item">
                      <div>
                        <div className="mission-dest">{trip.destination}</div>
                        <div className="mission-meta">{trip.purpose || 'Transport'} · {trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleDateString() : 'Upcoming'}</div>
                      </div>
                      <div className="live-tag" style={{ background: '#f0fdf4', color: '#16a34a' }}>{trip.status.toUpperCase()}</div>
                    </div>
                  ))
              ) : (
                <p style={{ fontSize: '13px', color: '#64748b', textAlign: 'center' }}>No upcoming trips scheduled.</p>
              )}
            </div>
          </div>
        </div>

        <div className="live-matrix-card">
          <div className="matrix-header">
            <h3>Assigned Asset</h3>
          </div>
          {stats.currentVehicle ? (
            <div style={{ padding: '20px', background: '#f8fafc', borderRadius: '20px', textAlign: 'center', border: '1px solid #e2e8f0' }}>
              <div style={{ fontSize: '48px', marginBottom: '10px' }}>🚐</div>
              <div style={{ fontSize: '24px', fontWeight: '900', color: '#1e293b' }}>{stats.currentVehicle}</div>
              <div style={{ fontSize: '12px', fontWeight: '800', color: '#16a34a', marginTop: '4px' }}>OPERATIONAL</div>
              <button className="premium-btn primary" style={{ width: '100%', marginTop: '20px' }} onClick={() => navigate(`/user/profile`)}>
                VIEW DETAILS
              </button>
            </div>
          ) : (
            <div style={{ padding: '40px 20px', background: '#f8fafc', borderRadius: '20px', textAlign: 'center', border: '1px dashed #cbd5e1' }}>
              <p style={{ color: '#64748b', fontSize: '14px' }}>No vehicle currently assigned.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
