import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import './FuelReport.css';

// Phase 2: Driver requests fuel → Admin approves → Fuel station dispenses
const FuelReport = () => {
  const [vehicle, setVehicle]     = useState(null);
  const [history, setHistory]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]         = useState('');
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm] = useState({
    fuelType: 'Diesel',
    requestedAmount: '',
    currentOdometer: '',
    destination: '',
    purpose: '',
    priority: 'Normal',
  });

  useEffect(() => {
    Promise.all([
      driverService.getVehicleInfo().catch(() => null),
      driverService.getFuelHistory().catch(() => []),
    ]).then(([v, h]) => {
      setVehicle(v);
      setHistory(Array.isArray(h) ? h : []);
    }).finally(() => setLoading(false));
  }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.requestedAmount || !form.destination) return notify('Amount and destination are required.');
    setSubmitting(true);
    try {
      await driverService.submitFuelRequest({
        fuelType: form.fuelType,
        requestedAmount: Number(form.requestedAmount),
        currentOdometer: Number(form.currentOdometer) || 0,
        destination: form.destination,
        purpose: form.purpose,
        priority: form.priority,
      });
      notify('Fuel request submitted. Waiting for Admin approval.');
      setShowForm(false);
      setForm({ fuelType: 'Diesel', requestedAmount: '', currentOdometer: '', destination: '', purpose: '', priority: 'Normal' });
      const h = await driverService.getFuelHistory().catch(() => []);
      setHistory(Array.isArray(h) ? h : []);
    } catch (err) {
      notify('Error: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444', Dispensed: '#6366f1' };

  if (loading) return <div style={{ padding: '2rem', color: '#94a3b8' }}>Loading...</div>;

  return (
    <div style={{ padding: '1.5rem', maxWidth: 800 }}>
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1e293b', fontWeight: 700 }}>Fuel Requests</h2>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>
            Submit a fuel request → Admin approves → Fuel station dispenses
          </p>
        </div>
        <button onClick={() => setShowForm(s => !s)}
          style={{ background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 18px', cursor: 'pointer', fontWeight: 600, fontSize: 14 }}>
          {showForm ? '✕ Cancel' : '+ Request Fuel'}
        </button>
      </div>

      {/* Vehicle info strip */}
      {vehicle ? (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', gap: 24, flexWrap: 'wrap', fontSize: 13 }}>
          <span><strong>Vehicle:</strong> {vehicle.plateNumber} — {vehicle.model}</span>
          <span><strong>Fuel Type:</strong> {vehicle.fuelType}</span>
          <span><strong>Odometer:</strong> {vehicle.odometer?.toLocaleString()} km</span>
          <span><strong>Fuel Level:</strong> {vehicle.fuelLevel}%</span>
        </div>
      ) : (
        <div style={{ background: '#fff7ed', border: '1px solid #ffedd5', borderRadius: 10, padding: '12px 16px', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: 12, fontSize: 13, color: '#9a3412' }}>
          <span style={{ fontSize: 16 }}>⚠️</span>
          <span>You don't have a vehicle assigned currently. You must have a permanent assignment or be on an active trip to request fuel.</span>
        </div>
      )}

      {/* Request form */}
      {showForm && (
        <form onSubmit={handleSubmit} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 1rem', color: '#1e293b', fontSize: 15, fontWeight: 700 }}>New Fuel Request</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 14 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Fuel Type</label>
              <select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                <option>Diesel</option><option>Petrol</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Amount Requested (L) *</label>
              <input type="number" value={form.requestedAmount} onChange={e => setForm(f => ({ ...f, requestedAmount: e.target.value }))}
                placeholder="e.g. 45" required
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Destination *</label>
              <input type="text" value={form.destination} onChange={e => setForm(f => ({ ...f, destination: e.target.value }))}
                placeholder="e.g. Harar" required
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Current Odometer (km)</label>
              <input type="number" value={form.currentOdometer} onChange={e => setForm(f => ({ ...f, currentOdometer: e.target.value }))}
                placeholder="e.g. 45230"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Purpose</label>
              <input type="text" value={form.purpose} onChange={e => setForm(f => ({ ...f, purpose: e.target.value }))}
                placeholder="e.g. Official trip"
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Priority</label>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                <option>Low</option><option>Normal</option><option>High</option>
              </select>
            </div>
          </div>
          <button type="submit" disabled={submitting}
            style={{ marginTop: 16, background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 24px', fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {submitting ? 'Submitting...' : '⛽ Submit Fuel Request'}
          </button>
        </form>
      )}

      {/* History */}
      <h3 style={{ color: '#1e293b', fontWeight: 700, fontSize: 15, marginBottom: '0.75rem' }}>My Fuel Request History</h3>
      {history.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: 14 }}>No fuel requests yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {history.map(r => (
            <div key={r._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{r.requestId || r._id?.slice(-6).toUpperCase()}</span>
                  <span style={{ marginLeft: 10, fontSize: 13, color: '#64748b' }}>{r.fuelType} · {r.requestedAmount}L → {r.destination}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, background: `${STATUS_COLOR[r.status]}22`, color: STATUS_COLOR[r.status] }}>
                    {r.status}
                  </span>
                  {r.authorizationCode && (
                    <span style={{ fontSize: 12, color: '#22c55e', fontWeight: 600 }}>Auth: {r.authorizationCode}</span>
                  )}
                </div>
              </div>
              {r.rejectionReason && (
                <p style={{ margin: '6px 0 0', fontSize: 12, color: '#ef4444' }}>Rejected: {r.rejectionReason}</p>
              )}
              <p style={{ margin: '4px 0 0', fontSize: 11, color: '#94a3b8' }}>{new Date(r.createdAt).toLocaleString()}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default FuelReport;
