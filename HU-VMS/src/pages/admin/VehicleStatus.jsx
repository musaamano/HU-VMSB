import { useState, useEffect } from 'react';
import { getVehicles } from '../../api/api';
import './vehicleStatus.css';

const VehicleStatus = () => {
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm]     = useState('');

  useEffect(() => {
    getVehicles()
      .then(setVehicles)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filteredVehicles = vehicles.filter(v => {
    const q = searchTerm.toLowerCase();
    const matchSearch = v.plateNumber?.toLowerCase().includes(q) || v.model?.toLowerCase().includes(q);
    const matchFilter = filterStatus === 'All' || normalizeStatus(v.status) === filterStatus;
    return matchSearch && matchFilter;
  });

  const statusCounts = {
    available:   vehicles.filter(v => v.status === 'available').length,
    assigned:    vehicles.filter(v => v.status === 'in-use').length,
    maintenance: vehicles.filter(v => v.status === 'maintenance').length,
  };

  function normalizeStatus(s) {
    if (s === 'available')   return 'Available';
    if (s === 'in-use')      return 'Assigned';
    if (s === 'maintenance') return 'Maintenance';
    return s;
  }

  const getStatusClass = (s) => {
    if (s === 'available')   return 'status-available';
    if (s === 'in-use')      return 'status-assigned';
    if (s === 'maintenance') return 'status-maintenance';
    return '';
  };

  return (
    <div className="vehicle-status-container">
      <h1>Vehicle Status</h1>

      <div className="status-summary">
        <div className="summary-card summary-available">
          <div className="summary-icon">✓</div>
          <div className="summary-content"><h3>{statusCounts.available}</h3><p>Available</p></div>
        </div>
        <div className="summary-card summary-assigned">
          <div className="summary-icon">📍</div>
          <div className="summary-content"><h3>{statusCounts.assigned}</h3><p>Assigned</p></div>
        </div>
        <div className="summary-card summary-maintenance">
          <div className="summary-icon">🔧</div>
          <div className="summary-content"><h3>{statusCounts.maintenance}</h3><p>Maintenance</p></div>
        </div>
      </div>

      <div className="controls-bar">
        <input type="text" placeholder="Search vehicles..." value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} className="search-input" />
        <div className="filter-buttons">
          {['All','Available','Assigned','Maintenance'].map(s => (
            <button key={s} className={`filter-btn ${filterStatus === s ? 'active' : ''}`}
              onClick={() => setFilterStatus(s)}>{s}</button>
          ))}
        </div>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Loading...</p>
      ) : (
        <div className="table-container">
          <table className="status-table">
            <thead>
              <tr>
                <th>#</th><th>Plate Number</th><th>Model</th><th>Type</th>
                <th>Status</th><th>Year</th>
              </tr>
            </thead>
            <tbody>
              {filteredVehicles.map((v, i) => (
                <tr key={v._id}>
                  <td>{i + 1}</td>
                  <td>{v.plateNumber}</td>
                  <td>{v.model}</td>
                  <td>{v.type || '—'}</td>
                  <td>
                    <span className={`status-badge ${getStatusClass(v.status)}`}>
                      {normalizeStatus(v.status)}
                    </span>
                  </td>
                  <td>{v.year || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredVehicles.length === 0 && <div className="no-results">No vehicles found</div>}
        </div>
      )}
    </div>
  );
};

export default VehicleStatus;
