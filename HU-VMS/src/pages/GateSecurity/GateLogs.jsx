import { useState, useEffect } from 'react';
import './GateLogs.css';

const BASE = '/api';
const authReq = async (url) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const GateLogs = () => {
  const [gateLogs, setGateLogs] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [filters, setFilters]   = useState({ direction: '', date: '', plateNumber: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const load = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filters.direction) params.set('direction', filters.direction);
      if (filters.status)    params.set('status', filters.status);
      const data = await authReq(`${BASE}/gate/logs?${params}`).catch(() => []);
      setGateLogs(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const filtered = gateLogs.filter(log => {
    const plate = log.vehicle?.plateNumber || log.plateNumber || '';
    const dateStr = log.detectionTime ? log.detectionTime.slice(0, 10) : '';
    return (
      (!filters.direction || log.direction === filters.direction) &&
      (!filters.date || dateStr === filters.date) &&
      (!filters.plateNumber || plate.toLowerCase().includes(filters.plateNumber.toLowerCase())) &&
      (!filters.status || log.status === filters.status)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paged = filtered.slice(start, start + itemsPerPage);

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading gate logs...</div>;

  return (
    <div className="gate-logs-page">
      <div className="gate-page-header">
        <div>
          <h2>Gate Logs</h2>
          <p>Complete history of all gate activities</p>
        </div>
        <button className="gate-btn-primary" onClick={load}>↻ Refresh</button>
      </div>

      <div className="gate-filters-container">
        <div className="gate-filters-grid">
          <div className="gate-filter-group">
            <label className="gate-filter-label">Direction</label>
            <select name="direction" value={filters.direction} onChange={handleFilterChange} className="gate-filter-select">
              <option value="">All</option><option value="Entry">Entry</option><option value="Exit">Exit</option>
            </select>
          </div>
          <div className="gate-filter-group">
            <label className="gate-filter-label">Date</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="gate-filter-input" />
          </div>
          <div className="gate-filter-group">
            <label className="gate-filter-label">Plate Number</label>
            <input type="text" name="plateNumber" value={filters.plateNumber} onChange={handleFilterChange} placeholder="Search plate" className="gate-filter-input" />
          </div>
          <div className="gate-filter-group">
            <label className="gate-filter-label">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="gate-filter-select">
              <option value="">All</option><option value="Approved">Approved</option><option value="Rejected">Rejected</option><option value="Pending">Pending</option>
            </select>
          </div>
          <div className="gate-filter-actions">
            <button onClick={() => { setFilters({ direction: '', date: '', plateNumber: '', status: '' }); setCurrentPage(1); }} className="gate-btn-clear">Clear</button>
          </div>
        </div>
      </div>

      <div className="gate-results-summary">
        <span>Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + itemsPerPage, filtered.length)} of {filtered.length} logs</span>
      </div>

      <div className="gate-table-container">
        <div className="gate-table-wrapper">
          {paged.length === 0 ? (
            <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>No gate logs found.</p>
          ) : (
            <table className="gate-table">
              <thead>
                <tr><th>Log ID</th><th>Plate</th><th>Vehicle</th><th>Driver</th><th>Direction</th><th>Officer</th><th>Time</th><th>Status</th></tr>
              </thead>
              <tbody>
                {paged.map(log => (
                  <tr key={log._id}>
                    <td className="log-id">{log._id?.slice(-6).toUpperCase()}</td>
                    <td className="plate-number">{log.vehicle?.plateNumber || log.plateNumber || '—'}</td>
                    <td>{log.vehicle?.model || '—'}</td>
                    <td>{log.driver?.name || '—'}</td>
                    <td><span className={`gate-direction-badge ${log.direction?.toLowerCase()}`}>{log.direction}</span></td>
                    <td>{log.officerOnDuty?.name || '—'}</td>
                    <td className="detection-time">{log.detectionTime ? new Date(log.detectionTime).toLocaleString() : '—'}</td>
                    <td><span className={`gate-status-badge ${log.status?.toLowerCase()}`}>{log.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="gate-pagination">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="gate-pagination-btn">‹ Previous</button>
          <div className="gate-pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`gate-pagination-number ${currentPage === p ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="gate-pagination-btn">Next ›</button>
        </div>
      )}
    </div>
  );
};

export default GateLogs;
