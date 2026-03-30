import { useState, useEffect } from 'react';
import './GateDashboard.css';

const BASE = '/api';
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const GateDashboard = () => {
  const [stats, setStats]       = useState(null);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading]   = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await authReq(`${BASE}/gate/dashboard`).catch(() => ({}));
      setStats(data);
      setActivity(Array.isArray(data.recentActivity) ? data.recentActivity : []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleApprove = async (id) => {
    try {
      await authReq(`${BASE}/gate/logs/${id}/approve`, { method: 'PUT' });
      setActivity(prev => prev.map(a => a._id === id ? { ...a, status: 'Approved' } : a));
      setStats(prev => prev ? { ...prev, pendingApprovals: Math.max(0, (prev.pendingApprovals || 1) - 1) } : prev);
    } catch (e) { alert(e.message); }
  };

  const handleReject = async (id) => {
    try {
      await authReq(`${BASE}/gate/logs/${id}/reject`, { method: 'PUT', body: JSON.stringify({ reason: 'Rejected by gate officer' }) });
      setActivity(prev => prev.map(a => a._id === id ? { ...a, status: 'Rejected' } : a));
      setStats(prev => prev ? { ...prev, pendingApprovals: Math.max(0, (prev.pendingApprovals || 1) - 1) } : prev);
    } catch (e) { alert(e.message); }
  };

  if (loading) return <div className="gate-dashboard-content"><p style={{ padding: '2rem', color: '#94a3b8' }}>Loading...</p></div>;

  return (
    <div className="gate-dashboard-content">
      <div className="gate-dashboard-header">
        <div>
          <h2>Gate Security Dashboard</h2>
          <p>Real-time monitoring of vehicle entry and exit</p>
        </div>
        <button className="gate-btn-refresh" onClick={load}>🔄 Refresh</button>
      </div>

      <div className="gate-stats-grid">
        <div className="gate-stat-card blue">
          <div className="gate-stat-icon">🚗</div>
          <div className="gate-stat-value">{stats?.vehiclesDetectedToday ?? 0}</div>
          <div className="gate-stat-label">Vehicles Today</div>
        </div>
        <div className="gate-stat-card green">
          <div className="gate-stat-icon">✅</div>
          <div className="gate-stat-value">{stats?.universityVehicles ?? 0}</div>
          <div className="gate-stat-label">University Vehicles</div>
        </div>
        <div className="gate-stat-card orange">
          <div className="gate-stat-icon">⚠️</div>
          <div className="gate-stat-value">{stats?.externalVehicles ?? 0}</div>
          <div className="gate-stat-label">External Vehicles</div>
        </div>
        <div className="gate-stat-card red">
          <div className="gate-stat-icon">⏳</div>
          <div className="gate-stat-value">{stats?.pendingApprovals ?? 0}</div>
          <div className="gate-stat-label">Pending Approvals</div>
        </div>
      </div>

      <div className="gate-table-container">
        <div className="gate-table-header">
          <h3>Live Gate Activity</h3>
          <span className="gate-live-indicator"><span className="gate-pulse"></span>Live</span>
        </div>
        {activity.length === 0 ? (
          <p style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>No gate activity yet today.</p>
        ) : (
          <div className="gate-table-wrapper">
            <table className="gate-table">
              <thead>
                <tr><th>Plate</th><th>Vehicle</th><th>Driver</th><th>Direction</th><th>Time</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {activity.map(a => (
                  <tr key={a._id}>
                    <td className="plate-number">{a.vehicle?.plateNumber || a.plateNumber || '—'}</td>
                    <td>{a.vehicle?.model || '—'}</td>
                    <td>{a.driver?.name || '—'}</td>
                    <td><span className={`gate-direction-badge ${a.direction?.toLowerCase()}`}>{a.direction}</span></td>
                    <td className="detection-time">{a.detectionTime ? new Date(a.detectionTime).toLocaleString() : '—'}</td>
                    <td><span className={`gate-status-badge ${a.status?.toLowerCase()}`}>{a.status}</span></td>
                    <td>
                      {a.status === 'Pending' && (
                        <div className="gate-action-buttons">
                          <button className="gate-action-btn approve" onClick={() => handleApprove(a._id)} title="Approve">✓</button>
                          <button className="gate-action-btn reject" onClick={() => handleReject(a._id)} title="Reject">✗</button>
                        </div>
                      )}
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

export default GateDashboard;
