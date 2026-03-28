import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import '../driver-shared.css';

const ISSUE_TYPES = ['Engine', 'Tires', 'Brakes', 'Lights', 'Body Damage', 'Fuel System', 'Electrical', 'Other'];

const SEV = [
  { value: 'Minor',    color: '#f59e0b', bg: '#fef3c7', desc: 'Small issue, vehicle still operational' },
  { value: 'Moderate', color: '#f97316', bg: '#ffedd5', desc: 'Noticeable problem, needs attention soon' },
  { value: 'Critical', color: '#ef4444', bg: '#fee2e2', desc: 'Serious — vehicle may be unsafe to drive' },
];

const STATUS_BADGE = {
  reported:     { bg: '#fee2e2', color: '#dc2626', label: 'Reported' },
  acknowledged: { bg: '#dbeafe', color: '#1d4ed8', label: 'Acknowledged' },
  in_repair:    { bg: '#fef3c7', color: '#d97706', label: 'In Repair' },
  resolved:     { bg: '#dcfce7', color: '#16a34a', label: 'Resolved' },
};

const BASE = '/api/driver';
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const VehicleIssueReport = ({ onClose, onSubmit }) => {
  const [tab, setTab]           = useState('new');
  const [form, setForm]         = useState({ issueType: 'Engine', severity: 'Minor', description: '' });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted]   = useState(false);
  const [error, setError]           = useState('');
  const [history, setHistory]       = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [vehicle, setVehicle]       = useState(null);

  useEffect(() => {
    driverService.getVehicleInfo().then(setVehicle).catch(() => {
      // No vehicle assigned — that's OK, form still works
      setVehicle(null);
    });
    if (tab === 'history') loadHistory();
  }, [tab]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await authReq(`${BASE}/vehicle/issues`).catch(() => []);
      setHistory(Array.isArray(data) ? data : []);
    } finally { setLoadingHistory(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.description.trim()) { setError('Please describe the issue.'); return; }
    setSubmitting(true); setError('');
    try {
      const res = await driverService.reportIssue({
        issueType:   form.issueType,
        severity:    form.severity,
        description: form.description,
      });
      setSubmitted(true);
      if (onSubmit) onSubmit();
    } catch (err) {
      setError(err.message || 'Failed to submit. Please try again.');
    } finally { setSubmitting(false); }
  };

  const selectedSev = SEV.find(s => s.value === form.severity);

  if (submitted) {
    return (
      <div className="driver-page-wrapper">
        <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center', padding: '48px 32px', background: '#fff', borderRadius: 20, boxShadow: '0 8px 32px rgba(0,0,0,0.08)', border: '1px solid #e5e7eb' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>✅</div>
          <h2 style={{ color: '#1f2937', fontWeight: 700, marginBottom: 8 }}>Request Submitted!</h2>
          <p style={{ color: '#374151', fontSize: 15, lineHeight: 1.6, marginBottom: 8 }}>
            Your maintenance request has been sent directly to the <strong>Maintenance Office</strong> and <strong>Transport Office</strong>.
          </p>
          <p style={{ color: '#6b7280', fontSize: 13, marginBottom: 28 }}>They will acknowledge your request and begin repairs shortly.</p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <button className="driver-btn-primary" onClick={() => { setSubmitted(false); setForm({ issueType: 'Engine', severity: 'Minor', description: '' }); setTab('history'); loadHistory(); }}>
              View My Requests
            </button>
            <button className="driver-btn-secondary" onClick={onClose}>Back to Dashboard</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="driver-page-wrapper">
      <div className="driver-page-header">
        <h2>🔧 Report Vehicle Issue</h2>
        <p>Submit a maintenance request — sent directly to the Maintenance Office</p>
      </div>

      {/* Vehicle info strip */}
      {vehicle && (
        <div style={{ background: 'linear-gradient(135deg,#1e3a5f,#2a6d9a)', borderRadius: 12, padding: '14px 20px', marginBottom: 20, display: 'flex', gap: 24, flexWrap: 'wrap', color: '#fff', fontSize: 13 }}>
          <span>🚗 <strong>{vehicle.plateNumber}</strong> — {vehicle.model}</span>
          <span>⛽ Fuel: {vehicle.fuelLevel}%</span>
          <span>📏 Odometer: {vehicle.odometer?.toLocaleString()} km</span>
          <span style={{ marginLeft: 'auto', background: vehicle.status === 'Available' ? '#22c55e' : '#ef4444', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>{vehicle.status}</span>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
        {[{ key: 'new', label: '+ New Request' }, { key: 'history', label: '📋 My Requests' }].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding: '9px 20px', borderRadius: 20, border: '2px solid', fontWeight: 700, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              borderColor: tab === t.key ? '#7c3aed' : '#e5e7eb',
              background: tab === t.key ? 'linear-gradient(135deg,#7c3aed,#6d28d9)' : '#fff',
              color: tab === t.key ? '#fff' : '#374151' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* New Request Form */}
      {tab === 'new' && (
        <div className="driver-form-container">
          <div className="driver-form-header">
            <h3>🔧 New Maintenance Request</h3>
            <p>Fill in the details below — your request will be sent immediately to the Maintenance Office</p>
          </div>

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13 }}>
              ⚠️ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Issue Type */}
            <div style={{ marginBottom: 20 }}>
              <label className="driver-form-label">Issue Type</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 8 }}>
                {ISSUE_TYPES.map(t => (
                  <button key={t} type="button"
                    onClick={() => setForm(f => ({ ...f, issueType: t }))}
                    style={{ padding: '10px 8px', border: `2px solid ${form.issueType === t ? '#7c3aed' : '#e5e7eb'}`, borderRadius: 10,
                      background: form.issueType === t ? 'linear-gradient(135deg,#ede9fe,#ddd6fe)' : '#f9fafb',
                      color: form.issueType === t ? '#6d28d9' : '#374151', fontWeight: 600, fontSize: 12, cursor: 'pointer', transition: 'all 0.2s' }}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Severity */}
            <div style={{ marginBottom: 20 }}>
              <label className="driver-form-label">Severity Level</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10, marginTop: 8 }}>
                {SEV.map(s => (
                  <button key={s.value} type="button"
                    onClick={() => setForm(f => ({ ...f, severity: s.value }))}
                    style={{ padding: '14px 10px', border: `2px solid ${form.severity === s.value ? s.color : '#e5e7eb'}`, borderRadius: 12,
                      background: form.severity === s.value ? s.bg : '#f9fafb',
                      cursor: 'pointer', transition: 'all 0.2s', textAlign: 'left' }}>
                    <div style={{ fontWeight: 700, color: s.color, fontSize: 14, marginBottom: 4 }}>{s.value}</div>
                    <div style={{ fontSize: 11, color: '#6b7280', lineHeight: 1.3 }}>{s.desc}</div>
                  </button>
                ))}
              </div>
              {form.severity === 'Critical' && (
                <div style={{ marginTop: 8, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 8, fontSize: 12, color: '#dc2626', fontWeight: 600 }}>
                  ⚠️ Critical issues will mark your vehicle as Out of Service until repaired.
                </div>
              )}
            </div>

            {/* Description */}
            <div style={{ marginBottom: 24 }}>
              <label className="driver-form-label">
                Problem Description <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <textarea
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Describe the issue in detail — what happened, when it started, any unusual sounds, warning lights, or behaviour..."
                rows={5}
                className="driver-form-textarea"
                required
                style={{ marginTop: 8 }}
              />
              <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{form.description.length} / 500 characters</div>
            </div>

            {/* Summary */}
            {form.description.trim() && (
              <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '14px 16px', marginBottom: 20, fontSize: 13 }}>
                <div style={{ fontWeight: 700, color: '#1f2937', marginBottom: 8 }}>📋 Request Summary</div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', color: '#374151' }}>
                  <span>Issue: <strong>{form.issueType}</strong></span>
                  <span>Severity: <strong style={{ color: selectedSev?.color }}>{form.severity}</strong></span>
                  {vehicle && <span>Vehicle: <strong>{vehicle.plateNumber}</strong></span>}
                </div>
                <div style={{ marginTop: 8, color: '#6b7280', fontSize: 12 }}>Will notify: Maintenance Office + Transport Office</div>
              </div>
            )}

            <div className="driver-form-actions">
              <button type="button" className="driver-btn-secondary" onClick={onClose}>Cancel</button>
              <button type="submit" className="driver-btn-primary" disabled={submitting || !form.description.trim()}>
                {submitting ? '⏳ Submitting...' : '📤 Submit to Maintenance Office'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="driver-table-container">
          <div className="driver-table-header">
            <h3>📋 My Maintenance Requests</h3>
            <button onClick={loadHistory} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
          </div>
          {loadingHistory ? (
            <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
          ) : history.length === 0 ? (
            <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>No maintenance requests yet.</p>
          ) : (
            <div className="driver-table-wrapper">
              <table className="driver-table">
                <thead>
                  <tr><th>Vehicle</th><th>Issue Type</th><th>Severity</th><th>Status</th><th>Description</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {history.map(issue => {
                    const st = STATUS_BADGE[issue.status] || STATUS_BADGE.reported;
                    const sev = SEV.find(s => s.value === issue.severity);
                    return (
                      <tr key={issue._id}>
                        <td><strong>{issue.vehicle?.plateNumber || '—'}</strong><br /><small style={{ color: '#6b7280' }}>{issue.vehicle?.model || ''}</small></td>
                        <td>{issue.issueType}</td>
                        <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: sev?.bg || '#f3f4f6', color: sev?.color || '#374151' }}>{issue.severity}</span></td>
                        <td><span style={{ padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, background: st.bg, color: st.color }}>{st.label}</span></td>
                        <td style={{ maxWidth: 200, fontSize: 12, color: '#374151' }}>{issue.description?.slice(0, 60)}{issue.description?.length > 60 ? '...' : ''}</td>
                        <td style={{ color: '#6b7280', fontSize: 12, whiteSpace: 'nowrap' }}>{new Date(issue.createdAt).toLocaleDateString()}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VehicleIssueReport;
