import { useState, useEffect } from 'react';
import './FuelRequests.css';
import './fuelstation.css';

const BASE = '/api';
const token = () => localStorage.getItem('authToken');
const req = async (url, opts = {}) => {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444', Dispensed: '#6366f1' };

// Phase 2: Fuel station sees ONLY Admin-approved requests and dispenses fuel
const FuelRequests = () => {
  const [requests, setRequests]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [filter, setFilter]       = useState('Approved');
  const [selected, setSelected]   = useState(null);
  const [dispensing, setDispensing] = useState(false);
  const [dispenseAmt, setDispenseAmt] = useState('');
  const [toast, setToast]         = useState('');

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await req(`${BASE}/fuel/requests`).catch(() => []);
      setRequests(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleDispense = async () => {
    if (!dispenseAmt || Number(dispenseAmt) <= 0) return notify('Enter a valid amount.');
    setDispensing(true);
    try {
      await req(`${BASE}/fuel/dispense`, {
        method: 'POST',
        body: JSON.stringify({
          requestId: selected._id,
          dispensedAmount: Number(dispenseAmt),
          vehicleId: selected.vehicle?._id,
        }),
      });
      notify('Fuel dispensed successfully.');
      setSelected(null);
      setDispenseAmt('');
      await load();
    } catch (err) {
      notify('Error: ' + err.message);
    } finally { setDispensing(false); }
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const counts = { Approved: 0, Pending: 0, Dispensed: 0, Rejected: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div className="fuel-requests-page">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <div className="fuel-page-header">
        <h2>Fuel Requests</h2>
        <p>Dispense fuel only for <strong>Admin-approved</strong> requests. Verify the authorization code before dispensing.</p>
      </div>

      {/* Stats */}
      <div className="fuel-stats-grid">
        {[
          { label: 'Approved (Ready)', count: counts.Approved, color: '#22c55e', icon: '✓' },
          { label: 'Pending (Awaiting Admin)', count: counts.Pending, color: '#f59e0b', icon: '⏳' },
          { label: 'Dispensed', count: counts.Dispensed, color: '#6366f1', icon: '⛽' },
          { label: 'Rejected', count: counts.Rejected, color: '#ef4444', icon: '✗' },
        ].map(s => (
          <div key={s.label} className="fuel-stat-card" style={{ borderTop: `3px solid ${s.color}` }}>
            <div className="fuel-stat-icon" style={{ color: s.color }}>{s.icon}</div>
            <div className="fuel-stat-value" style={{ color: s.color }}>{s.count}</div>
            <div className="fuel-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="fuel-filter-section">
        <label className="fuel-filter-label">Filter:</label>
        <div className="fuel-filter-buttons">
          {['Approved', 'All', 'Pending', 'Dispensed', 'Rejected'].map(s => (
            <button key={s} className={`fuel-filter-btn ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="fuel-table-container">
        <div className="fuel-table-header">
          <h3>
            {filter === 'Approved' ? '⚡ Ready to Dispense' : `${filter} Requests`} ({filtered.length})
          </h3>
          <button onClick={load} style={{ background: 'none', border: '1px solid #e2e8f0', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 13 }}>
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
        ) : filtered.length === 0 ? (
          <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>
            {filter === 'Approved' ? 'No approved requests waiting for fuel. Admin must approve first.' : 'No requests found.'}
          </p>
        ) : (
          <div className="fuel-table-wrapper">
            <table className="fuel-table">
              <thead>
                <tr>
                  <th>Request ID</th>
                  <th>Vehicle</th>
                  <th>Driver</th>
                  <th>Fuel Type</th>
                  <th>Amount (L)</th>
                  <th>Auth Code</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(r => (
                  <tr key={r._id}>
                    <td className="transaction-id">{r.requestId || r._id?.slice(-6).toUpperCase()}</td>
                    <td>
                      <div className="vehicle-info">
                        <strong>{r.vehicle?.plateNumber || '—'}</strong>
                        <small>{r.vehicle?.model || ''}</small>
                      </div>
                    </td>
                    <td>{r.driver?.name || '—'}</td>
                    <td><span className={`fuel-type-badge ${r.fuelType?.toLowerCase()}`}>{r.fuelType}</span></td>
                    <td className="liters">{r.requestedAmount}L</td>
                    <td>
                      {r.authorizationCode
                        ? <span style={{ fontFamily: 'monospace', fontWeight: 700, color: '#22c55e', fontSize: 12 }}>{r.authorizationCode}</span>
                        : <span style={{ color: '#94a3b8', fontSize: 12 }}>Not yet approved</span>}
                    </td>
                    <td><span className={`priority-badge ${r.priority?.toLowerCase()}`}>{r.priority}</span></td>
                    <td>
                      <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status] }}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'Approved' && (
                        <button className="action-btn approve" onClick={() => { setSelected(r); setDispenseAmt(String(r.requestedAmount)); }}
                          title="Dispense Fuel">
                          ⛽ Dispense
                        </button>
                      )}
                      {r.status === 'Pending' && (
                        <span style={{ fontSize: 11, color: '#f59e0b' }}>Awaiting Admin</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dispense Modal */}
      {selected && (
        <div className="fuel-modal-overlay" onClick={() => setSelected(null)}>
          <div className="fuel-modal" onClick={e => e.stopPropagation()}>
            <div className="fuel-modal-header">
              <h3>⛽ Dispense Fuel</h3>
              <button className="fuel-modal-close" onClick={() => setSelected(null)}>×</button>
            </div>
            <div className="fuel-modal-content">
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', marginBottom: 16 }}>
                <p style={{ margin: 0, fontSize: 13, color: '#166534', fontWeight: 600 }}>
                  ✓ Admin Authorization Code: <span style={{ fontFamily: 'monospace', fontSize: 14 }}>{selected.authorizationCode}</span>
                </p>
              </div>
              <div className="approval-info" style={{ fontSize: 13, marginBottom: 16 }}>
                <p><strong>Driver:</strong> {selected.driver?.name}</p>
                <p><strong>Vehicle:</strong> {selected.vehicle?.plateNumber} — {selected.vehicle?.model}</p>
                <p><strong>Fuel Type:</strong> {selected.fuelType}</p>
                <p><strong>Requested:</strong> {selected.requestedAmount}L</p>
                <p><strong>Destination:</strong> {selected.destination || '—'}</p>
              </div>
              <div className="fuel-form-group">
                <label className="fuel-form-label">Amount to Dispense (L) *</label>
                <input type="number" value={dispenseAmt} onChange={e => setDispenseAmt(e.target.value)}
                  step="0.1" min="0" className="fuel-form-input" />
                <p className="fuel-help-text">You can adjust the amount if needed.</p>
              </div>
            </div>
            <div className="fuel-modal-actions">
              <button onClick={handleDispense} disabled={dispensing} className="fuel-btn-primary">
                {dispensing ? 'Dispensing...' : '⛽ Confirm Dispense'}
              </button>
              <button onClick={() => setSelected(null)} className="fuel-btn-secondary">Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelRequests;
