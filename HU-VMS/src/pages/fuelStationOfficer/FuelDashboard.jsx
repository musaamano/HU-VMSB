import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './FuelDashboard.css';
import './fuelstation.css';

const BASE = '/api';
const authReq = async (url) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const FuelDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats]     = useState(null);
  const [recent, setRecent]   = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const [dash, txns] = await Promise.all([
        authReq(`${BASE}/fuel/dashboard`).catch(() => ({})),
        authReq(`${BASE}/fuel/transactions`).catch(() => []),
      ]);
      setStats(dash);
      setRecent(Array.isArray(txns) ? txns.slice(0, 8) : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="fuel-dashboard-content">
      <p style={{ padding: '2rem', color: '#94a3b8' }}>Loading dashboard...</p>
    </div>
  );

  const inventory = Array.isArray(stats?.inventory) ? stats.inventory : [];
  const diesel = inventory.find(i => i.fuelType === 'Diesel');
  const petrol = inventory.find(i => i.fuelType === 'Petrol');

  return (
    <div className="fuel-dashboard-content">
      <div className="fuel-dashboard-header">
        <h2>Fuel Station Dashboard</h2>
        <p>Only Admin-approved requests can be dispensed. Verify the authorization code before dispensing.</p>
      </div>

      <div className="fuel-stats-grid">
        <div 
          className="fuel-stat-card orange"
          onClick={() => navigate('/fuel/requests')}
          style={{ cursor: 'pointer', transition: 'transform 0.2s' }}
        >
          <div className="fuel-stat-icon">⏳</div>
          <div className="fuel-stat-value">{stats?.pendingRequests ?? 0}</div>
          <div className="fuel-stat-label">Pending (Awaiting Admin)</div>
        </div>
        <div className="fuel-stat-card blue">
          <div className="fuel-stat-icon">⛽</div>
          <div className="fuel-stat-value">{(stats?.fuelDispensedToday ?? 0).toFixed(1)}L</div>
          <div className="fuel-stat-label">Dispensed Today</div>
        </div>
        <div className="fuel-stat-card green">
          <div className="fuel-stat-icon">🟢</div>
          <div className="fuel-stat-value">{diesel ? `${diesel.currentStock.toLocaleString()}L` : '—'}</div>
          <div className="fuel-stat-label">Diesel Stock</div>
        </div>
        <div className="fuel-stat-card purple">
          <div className="fuel-stat-icon">🟠</div>
          <div className="fuel-stat-value">{petrol ? `${petrol.currentStock.toLocaleString()}L` : '—'}</div>
          <div className="fuel-stat-label">Petrol Stock</div>
        </div>
        <div className="fuel-stat-card teal">
          <div className="fuel-stat-icon">📊</div>
          <div className="fuel-stat-value">{stats?.totalTransactions ?? 0}</div>
          <div className="fuel-stat-label">Total Transactions</div>
        </div>
      </div>

      <div className="fuel-quick-actions">
        <button className="fuel-action-btn primary" onClick={() => navigate('/fuel/requests')}>
          <span className="action-icon">✓</span> Dispense Fuel
        </button>
        <button className="fuel-action-btn secondary" onClick={() => navigate('/fuel/dispense')}>
          <span className="action-icon">🔐</span> Verify Auth Code
        </button>
        <button className="fuel-action-btn success" onClick={() => navigate('/fuel/inventory')}>
          <span className="action-icon">📦</span> Inventory
        </button>
        <button className="fuel-action-btn" onClick={() => navigate('/fuel/transactions')}>
          <span className="action-icon">📋</span> Transactions
        </button>
      </div>

      <div className="fuel-table-container">
        <div className="fuel-table-header">
          <h3>Recent Dispensed Transactions</h3>
          <button onClick={load} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>
        {recent.length === 0 ? (
          <p style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>No dispensed transactions yet.</p>
        ) : (
          <div className="fuel-table-wrapper">
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Fuel Type</th>
                  <th>Dispensed (L)</th>
                  <th>Date</th>
                  <th>Auth Code</th>
                </tr>
              </thead>
              <tbody>
                {recent.map(t => (
                  <tr key={t._id}>
                    <td className="transaction-id">{t.requestId || t._id?.slice(-6).toUpperCase()}</td>
                    <td><strong>{t.vehicle?.plateNumber || '—'}</strong></td>
                    <td>{t.driver?.name || '—'}</td>
                    <td>
                      <span className={`fuel-type-badge ${t.fuelType?.toLowerCase()}`}>{t.fuelType}</span>
                    </td>
                    <td className="liters">{t.dispensedAmount}L</td>
                    <td>{t.dispensedAt ? new Date(t.dispensedAt).toLocaleString() : '—'}</td>
                    <td style={{ fontFamily: 'monospace', fontSize: 12, color: '#22c55e' }}>
                      {t.authorizationCode}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default FuelDashboard;
