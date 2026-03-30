import { useState, useEffect } from 'react';
import { getRequests } from '../../api/api';
import './vehicleTripHistory.css';

const VehicleTripHistory = () => {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    getRequests()
      .then(setTrips)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = trips.filter(t => {
    const q = searchTerm.toLowerCase();
    return (
      (t._id?.toLowerCase() || '').includes(q) ||
      (t.vehicle?.plateNumber?.toLowerCase() || '').includes(q) ||
      (t.driver?.name?.toLowerCase() || '').includes(q) ||
      (t.requestedBy?.name?.toLowerCase() || '').includes(q) ||
      (t.destination?.toLowerCase() || '').includes(q)
    );
  });

  const getStatusClass = (s) => {
    if (s === 'completed') return 'status-completed';
    if (s === 'rejected') return 'status-cancelled';
    if (s === 'in-progress') return 'status-delayed';
    return '';
  };

  const fmt = (d) => d ? new Date(d).toLocaleString() : 'In Progress';

  return (
    <div className="trip-history-container" style={{ background: 'white', minHeight: '100vh', padding: 30 }}>
      <h1 style={{ color: '#32CD32', fontSize: 32, marginBottom: 30 }}>🚗 Vehicle Trip History</h1>

      <div className="controls-bar">
        <input type="text" placeholder="🔍 Search by ID, plate, driver, destination..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</p>
      ) : (
        <div className="table-container">
          <table className="trip-table">
            <thead>
              <tr>
                <th>Trip ID</th><th>Plate Number</th><th>Driver</th>
                <th>Requested By</th><th>Destination</th>
                <th>Departure</th><th>Return</th><th>Purpose</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t._id}>
                  <td><strong>{t._id?.slice(-6).toUpperCase()}</strong></td>
                  <td>{t.vehicle?.plateNumber || '—'}</td>
                  <td>{t.driver?.name || '—'}</td>
                  <td>{t.requestedBy?.name || t.requestedBy?.username || '—'}</td>
                  <td>{t.destination || '—'}</td>
                  <td>{fmt(t.startTime || t.requestDate)}</td>
                  <td>{fmt(t.endTime)}</td>
                  <td>{t.purpose || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length === 0 && <div className="no-results"><p>📭 No trip records found</p></div>}
        </div>
      )}
    </div>
  );
};

export default VehicleTripHistory;
