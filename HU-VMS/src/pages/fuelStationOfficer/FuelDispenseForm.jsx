import { useState } from 'react';
import './FuelDispenseForm.css';
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

// Phase 2: Fuel station verifies Admin auth code then dispenses
const FuelDispenseForm = () => {
  const [authCode, setAuthCode]     = useState('');
  const [verified, setVerified]     = useState(null); // the approved FuelRequest
  const [verifying, setVerifying]   = useState(false);
  const [dispenseAmt, setDispenseAmt] = useState('');
  const [odometer, setOdometer]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast]           = useState({ msg: '', ok: true });

  const notify = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast({ msg: '', ok: true }), 4000); };

  const handleVerify = async () => {
    if (!authCode.trim()) return notify('Enter an authorization code.', false);
    setVerifying(true);
    try {
      // Fetch approved requests and find by auth code
      const requests = await req(`${BASE}/fuel/requests?status=Approved`);
      const match = (Array.isArray(requests) ? requests : []).find(r => r.authorizationCode === authCode.trim());
      if (!match) {
        notify('Invalid or already used authorization code.', false);
        setVerified(null);
      } else {
        setVerified(match);
        setDispenseAmt(String(match.requestedAmount));
        notify('Authorization verified. Ready to dispense.', true);
      }
    } catch (err) {
      notify('Error: ' + err.message, false);
    } finally { setVerifying(false); }
  };

  const handleDispense = async (e) => {
    e.preventDefault();
    if (!verified) return notify('Verify authorization code first.', false);
    if (!dispenseAmt || Number(dispenseAmt) <= 0) return notify('Enter a valid amount.', false);
    setSubmitting(true);
    try {
      await req(`${BASE}/fuel/dispense`, {
        method: 'POST',
        body: JSON.stringify({
          requestId: verified._id,
          dispensedAmount: Number(dispenseAmt),
          vehicleId: verified.vehicle?._id,
          currentOdometer: Number(odometer) || undefined,
        }),
      });
      notify('Fuel dispensed successfully!', true);
      setVerified(null);
      setAuthCode('');
      setDispenseAmt('');
      setOdometer('');
    } catch (err) {
      notify('Error: ' + err.message, false);
    } finally { setSubmitting(false); }
  };

  return (
    <div className="fuel-dispense-page">
      {toast.msg && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: toast.ok ? '#166534' : '#991b1b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14 }}>
          {toast.msg}
        </div>
      )}

      <div className="fuel-page-header">
        <h2>Fuel Dispense</h2>
        <p>Enter the Admin-issued authorization code to verify and dispense fuel.</p>
      </div>

      <div className="fuel-form-container">
        {/* Step 1: Verify auth code */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Step 1 — Verify Authorization Code</h3>
          <div style={{ display: 'flex', gap: 10 }}>
            <input
              type="text"
              value={authCode}
              onChange={e => setAuthCode(e.target.value)}
              placeholder="e.g. AUTH-ABC123"
              className="fuel-form-input"
              style={{ flex: 1 }}
            />
            <button type="button" onClick={handleVerify} disabled={verifying} className="fuel-btn-verify">
              {verifying ? 'Checking...' : '🔐 Verify'}
            </button>
          </div>

          {verified && (
            <div style={{ marginTop: 14, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: '12px 16px', fontSize: 13 }}>
              <p style={{ margin: '0 0 6px', fontWeight: 700, color: '#166534' }}>✓ Authorization Valid</p>
              <p style={{ margin: '2px 0', color: '#374151' }}><strong>Driver:</strong> {verified.driver?.name}</p>
              <p style={{ margin: '2px 0', color: '#374151' }}><strong>Vehicle:</strong> {verified.vehicle?.plateNumber} — {verified.vehicle?.model}</p>
              <p style={{ margin: '2px 0', color: '#374151' }}><strong>Fuel Type:</strong> {verified.fuelType}</p>
              <p style={{ margin: '2px 0', color: '#374151' }}><strong>Requested:</strong> {verified.requestedAmount}L</p>
              <p style={{ margin: '2px 0', color: '#374151' }}><strong>Destination:</strong> {verified.destination || '—'}</p>
            </div>
          )}
        </div>

        {/* Step 2: Dispense */}
        {verified && (
          <form onSubmit={handleDispense}>
            <h3 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 700, color: '#1e293b' }}>Step 2 — Dispense Fuel</h3>
            <div className="fuel-form-grid">
              <div className="fuel-form-group">
                <label className="fuel-form-label">Amount to Dispense (L) *</label>
                <input type="number" value={dispenseAmt} onChange={e => setDispenseAmt(e.target.value)}
                  step="0.1" min="0" className="fuel-form-input" required />
                <p className="fuel-help-text">Adjust if needed. Requested: {verified.requestedAmount}L</p>
              </div>
              <div className="fuel-form-group">
                <label className="fuel-form-label">Current Odometer (km)</label>
                <input type="number" value={odometer} onChange={e => setOdometer(e.target.value)}
                  placeholder="Optional" className="fuel-form-input" />
              </div>
            </div>
            <div className="fuel-form-actions">
              <button type="submit" disabled={submitting} className="fuel-btn-primary">
                <span>⛽</span> {submitting ? 'Dispensing...' : 'Confirm & Dispense Fuel'}
              </button>
              <button type="button" onClick={() => { setVerified(null); setAuthCode(''); setDispenseAmt(''); setOdometer(''); }} className="fuel-btn-secondary">
                <span>🔄</span> Reset
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default FuelDispenseForm;
