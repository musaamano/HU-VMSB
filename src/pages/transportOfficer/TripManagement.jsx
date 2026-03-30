import { useState, useEffect } from 'react';
import {
  Search, MapPin, Calendar, Clock, CheckCircle2, PlayCircle,
  Filter, Car, User, Activity, CheckCircle, Clock as ClockIcon, RefreshCw
} from 'lucide-react';
import { getRequests, startTrip, completeTrip } from '../../api/api';
import './TripManagement.css';

// Trips = approved + in-progress + completed requests
const TRIP_STATUSES = ['approved', 'in-progress', 'completed'];

const STATUS_COLOR = {
  approved:    'var(--status-available)',
  'in-progress': 'var(--status-pending)',
  completed:   'var(--primary-color)',
  rejected:    'var(--status-complaint)',
};

const TripManagement = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [actionLoading, setActionLoading] = useState(null); // stores id being acted on

  const fetchTrips = async () => {
    try {
      setLoading(true);
      // Fetch all non-pending/rejected requests — these are the trips
      const all = await getRequests();
      setTrips(all.filter(r => TRIP_STATUSES.includes(r.status)));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrips(); }, []);

  const handleStart = async (id) => {
    setActionLoading(id);
    try {
      const updated = await startTrip(id);
      setTrips(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleComplete = async (id) => {
    setActionLoading(id);
    try {
      const updated = await completeTrip(id);
      setTrips(prev => prev.map(t => t._id === updated._id ? updated : t));
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setActionLoading(null);
    }
  };

  const filtered = trips.filter(t => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (t.requester || '').toLowerCase().includes(q) ||
      (t.destination || '').toLowerCase().includes(q) ||
      (t.assignedVehicle || '').toLowerCase().includes(q) ||
      (t.assignedDriver || '').toLowerCase().includes(q) ||
      t._id.slice(-6).toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || t.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    active:    trips.filter(t => t.status === 'in-progress').length,
    upcoming:  trips.filter(t => t.status === 'approved').length,
    completed: trips.filter(t => t.status === 'completed').length,
  };

  if (loading) return <div className="trip-management"><p style={{padding:'2rem',color:'#94a3b8'}}>Loading trips...</p></div>;
  if (error)   return <div className="trip-management"><p style={{padding:'2rem',color:'#f87171'}}>Error: {error}</p></div>;

  return (
    <div className="trip-management">
      <div className="dashboard-header">
        <div>
          <h1>Trip Management</h1>
          <p>Monitor active journeys and upcoming schedules</p>
        </div>
        <button className="refresh-btn" onClick={fetchTrips} title="Refresh" style={{
          background:'rgba(99,102,241,0.15)', border:'1px solid rgba(99,102,241,0.3)',
          color:'#818cf8', borderRadius:8, padding:'0.5rem', cursor:'pointer', display:'flex', alignItems:'center'
        }}>
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Stats */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-content">
            <div className="card-icon"><Activity size={28} /></div>
            <h3>{stats.active}</h3>
            <p>Active Trips</p>
            <div className="trend-indicator positive"><span>Live</span></div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-content">
            <div className="card-icon"><ClockIcon size={28} /></div>
            <h3>{stats.upcoming}</h3>
            <p>Upcoming</p>
            <div className="trend-indicator positive"><span>Approved</span></div>
          </div>
        </div>
        <div className="summary-card">
          <div className="card-content">
            <div className="card-icon"><CheckCircle size={28} /></div>
            <h3>{stats.completed}</h3>
            <p>Completed</p>
            <div className="trend-indicator positive"><span>Done</span></div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="dashboard-panel">
        <div className="panel-header">
          <h3>Trip Schedule</h3>
          <div className="header-actions">
            <div className="search-bar">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search by requester, destination, vehicle..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            <div className="filter-group">
              <div className="status-filter">
                <Filter size={16} className="filter-icon" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="floating-select"
                >
                  <option value="All">All Statuses</option>
                  <option value="approved">Upcoming (Approved)</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        <div className="trips-table-wrapper">
          <table className="modern-table">
            <thead>
              <tr>
                <th>Trip ID</th>
                <th>Requester</th>
                <th>Vehicle & Driver</th>
                <th>Route</th>
                <th>Date</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((trip) => (
                <tr key={trip._id}>
                  <td>
                    <div className="td-content">
                      <span className="text-primary-bold">#{trip._id.slice(-6).toUpperCase()}</span>
                      <span className="text-sub">{trip.purpose}</span>
                    </div>
                  </td>
                  <td>
                    <div className="td-content">
                      <span className="text-primary-bold">{trip.requester}</span>
                      <span className="text-sub">{trip.department}</span>
                    </div>
                  </td>
                  <td>
                    <div className="td-content row-gap">
                      <div className="icon-text">
                        <Car size={14} className="text-muted" />
                        <span>{trip.assignedVehicle || <em style={{color:'#94a3b8'}}>Not assigned</em>}</span>
                      </div>
                      <div className="icon-text text-sub">
                        <User size={14} className="text-muted" />
                        <span>{trip.assignedDriver || '—'}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="td-content row-gap">
                      <div className="icon-text">
                        <div className="route-dot start"></div>
                        <span>Haramaya University</span>
                      </div>
                      <div className="icon-text text-sub">
                        <div className="route-dot end"></div>
                        <span>{trip.destination}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className="td-content row-gap">
                      <div className="icon-text">
                        <Calendar size={14} className="text-muted" />
                        <span>{trip.date?.slice(0, 10)}</span>
                      </div>
                      {trip.passengers && (
                        <div className="icon-text text-sub">
                          <User size={14} className="text-muted" />
                          <span>{trip.passengers} passengers</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td>
                    <span
                      className="status-badge"
                      style={{
                        backgroundColor: `${STATUS_COLOR[trip.status]}22`,
                        color: STATUS_COLOR[trip.status],
                      }}
                    >
                      {trip.status === 'in-progress' && <span className="live-dot"></span>}
                      {trip.status}
                    </span>
                  </td>
                  <td className="text-right">
                    <div className="action-buttons">
                      {trip.status === 'approved' && (
                        <button
                          className="btn-icon-text action-start"
                          onClick={() => handleStart(trip._id)}
                          disabled={actionLoading === trip._id}
                        >
                          <PlayCircle size={16} />
                          {actionLoading === trip._id ? '...' : 'Start'}
                        </button>
                      )}
                      {trip.status === 'in-progress' && (
                        <button
                          className="btn-icon-text action-end"
                          onClick={() => handleComplete(trip._id)}
                          disabled={actionLoading === trip._id}
                        >
                          <CheckCircle2 size={16} />
                          {actionLoading === trip._id ? '...' : 'Finish'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan="7" className="empty-table-state">
                    <div className="empty-content">
                      <Car size={32} className="empty-icon" />
                      <p>No trips found. Approve some requests first.</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TripManagement;
