import { useState, useEffect } from 'react';
import './fuelstation.css';

const BASE = '/api';
const authReq = async (url) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const FuelTransactionHistory = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ fuelType: '', date: '', plateNumber: '', status: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  useEffect(() => {
    authReq(`${BASE}/fuel/transactions`)
      .then(data => setTransactions(Array.isArray(data) ? data : []))
      .catch(() => setTransactions([]))
      .finally(() => setLoading(false));
  }, []);

  const handleFilterChange = (e) => {
    setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    setCurrentPage(1);
  };

  const filtered = transactions.filter(t => {
    const plate = t.vehicle?.plateNumber || '';
    const dateStr = t.dispensedAt ? t.dispensedAt.slice(0, 10) : '';
    return (
      (!filters.fuelType || t.fuelType === filters.fuelType) &&
      (!filters.date || dateStr === filters.date) &&
      (!filters.plateNumber || plate.toLowerCase().includes(filters.plateNumber.toLowerCase())) &&
      (!filters.status || t.status === filters.status)
    );
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const start = (currentPage - 1) * itemsPerPage;
  const paged = filtered.slice(start, start + itemsPerPage);

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading transactions...</div>;

  return (
    <div className="fuel-transactions-page">
      <div className="fuel-page-header">
        <h2>Fuel Transaction History</h2>
        <p>All dispensed fuel transactions from the real database</p>
      </div>

      <div className="fuel-filters-container">
        <div className="fuel-filters-grid">
          <div className="fuel-filter-group">
            <label className="fuel-filter-label">Fuel Type</label>
            <select name="fuelType" value={filters.fuelType} onChange={handleFilterChange} className="fuel-filter-select">
              <option value="">All Types</option>
              <option value="Diesel">Diesel</option>
              <option value="Petrol">Petrol</option>
            </select>
          </div>
          <div className="fuel-filter-group">
            <label className="fuel-filter-label">Date</label>
            <input type="date" name="date" value={filters.date} onChange={handleFilterChange} className="fuel-filter-input" />
          </div>
          <div className="fuel-filter-group">
            <label className="fuel-filter-label">Plate Number</label>
            <input type="text" name="plateNumber" value={filters.plateNumber} onChange={handleFilterChange} placeholder="Search plate" className="fuel-filter-input" />
          </div>
          <div className="fuel-filter-group">
            <label className="fuel-filter-label">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange} className="fuel-filter-select">
              <option value="">All</option>
              <option value="Dispensed">Dispensed</option>
              <option value="Approved">Approved</option>
              <option value="Pending">Pending</option>
            </select>
          </div>
          <div className="fuel-filter-actions">
            <button onClick={() => { setFilters({ fuelType: '', date: '', plateNumber: '', status: '' }); setCurrentPage(1); }} className="fuel-btn-clear">
              Clear
            </button>
          </div>
        </div>
      </div>

      <div className="fuel-results-summary">
        <span>Showing {filtered.length === 0 ? 0 : start + 1}–{Math.min(start + itemsPerPage, filtered.length)} of {filtered.length} transactions</span>
      </div>

      <div className="fuel-table-container">
        <div className="fuel-table-wrapper">
          {paged.length === 0 ? (
            <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>No transactions found.</p>
          ) : (
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Request ID</th><th>Vehicle</th><th>Driver</th><th>Fuel Type</th>
                  <th>Dispensed (L)</th><th>Date</th><th>Odometer</th><th>Auth Code</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {paged.map(t => (
                  <tr key={t._id}>
                    <td className="transaction-id">{t.requestId || t._id?.slice(-6).toUpperCase()}</td>
                    <td><strong>{t.vehicle?.plateNumber || '—'}</strong><br /><small>{t.vehicle?.model || ''}</small></td>
                    <td>{t.driver?.name || '—'}</td>
                    <td><span className={`fuel-type-badge ${t.fuelType?.toLowerCase()}`}>{t.fuelType}</span></td>
                    <td className="liters">{t.dispensedAmount ?? t.requestedAmount}L</td>
                    <td>{t.dispensedAt ? new Date(t.dispensedAt).toLocaleDateString() : '—'}</td>
                    <td>{t.currentOdometer ? `${t.currentOdometer.toLocaleString()} km` : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#22c55e' }}>{t.authorizationCode || '—'}</td>
                    <td><span className={`status-badge ${t.status?.toLowerCase()}`}>{t.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="fuel-pagination">
          <button onClick={() => setCurrentPage(p => Math.max(p - 1, 1))} disabled={currentPage === 1} className="fuel-pagination-btn">‹ Previous</button>
          <div className="fuel-pagination-numbers">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setCurrentPage(p)} className={`fuel-pagination-number ${currentPage === p ? 'active' : ''}`}>{p}</button>
            ))}
          </div>
          <button onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))} disabled={currentPage === totalPages} className="fuel-pagination-btn">Next ›</button>
        </div>
      )}
    </div>
  );
};

export default FuelTransactionHistory;
