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
  const [unreadCount, setUnreadCount] = useState(0);

  const playChime = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(880, ctx.currentTime);
      osc.type = 'sine';
      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(); osc.stop(ctx.currentTime + 0.2);
    } catch (e) {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      const [dash, txns, notifs] = await Promise.all([
        authReq(`${BASE}/fuel/dashboard`).catch(() => ({})),
        authReq(`${BASE}/fuel/transactions`).catch(() => []),
        fetch(`${BASE}/fuel/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
        }).then(r => r.json()).catch(() => [])
      ]);

      const newUnread = Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0;
      setUnreadCount(current => {
        if (newUnread > current) playChime();
        return newUnread;
      });

      setStats(dash);
      setRecent(Array.isArray(txns) ? txns.slice(0, 8) : []);
    } finally {
      setLoading(false);
    }
  };

  const poll = async () => {
    try {
      const token = localStorage.getItem('authToken');
      const notifs = await fetch(`${BASE}/fuel/notifications`, {
          headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()).catch(() => []);
      
      const newUnread = Array.isArray(notifs) ? notifs.filter(n => !n.read).length : 0;
      setUnreadCount(current => {
        if (newUnread > current) playChime();
        return newUnread;
      });
    } catch (e) {}
  };

  useEffect(() => { 
    load();
    const interval = setInterval(poll, 15000);
    return () => clearInterval(interval);
  }, []);

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
