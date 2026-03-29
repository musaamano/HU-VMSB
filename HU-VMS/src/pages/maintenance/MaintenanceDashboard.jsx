import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout as apiLogout, getCurrentUser } from '../../api/api';
import MaintenanceSettings from './MaintenanceSettings';
import MaintenanceReports from './MaintenanceReports';
import '../driver/DriverDashboard.css';
import '../driver/driver-shared.css';
import '../transportOfficer/MaintenanceMonitor.css';

const BASE = '/api/maintenance';
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

const SEVERITY_COLOR = { Minor: '#f59e0b', Moderate: '#f97316', Critical: '#ef4444' };
const STATUS_STEPS = ['reported', 'acknowledged', 'in_repair', 'resolved'];
const STATUS_LABEL = { reported: 'Reported', acknowledged: 'Acknowledged', in_repair: 'In Repair', resolved: 'Resolved' };
const STATUS_ICON = { reported: '📋', acknowledged: '👁️', in_repair: '🔧', resolved: '✅' };

const NAV_ITEMS = [
  { key: 'overview', icon: '📊', label: 'Dashboard' },
  { key: 'reported', icon: '📋', label: 'Active Requests' },
  { key: 'acknowledged', icon: '👁️', label: 'Acknowledged' },
  { key: 'in_repair', icon: '🔧', label: 'In Repair' },
  { key: 'resolved', icon: '✅', label: 'Completed' },
  { key: 'driver_response', icon: '✉️', label: 'Driver Response' },
  { key: 'reports', icon: '📄', label: 'Reports' },
];

const ACTION_CONFIG = {
  vehicle_alert: { view: 'reported', label: 'View Request' },
  maintenance_update: { view: 'reported', label: 'View Update' },
  system: null
};

export default function MaintenanceDashboard() {
  const navigate = useNavigate();
  const user = getCurrentUser();
  const [activeView, setActiveView] = useState('overview');
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);
  const [acting, setActing] = useState(null);
  const [costForm, setCostForm] = useState({ parts: '', labor: '', downtime: '', notes: '' });
  const [messageToDriver, setMessageToDriver] = useState('');
  const [driverMessageFeedback, setDriverMessageFeedback] = useState('');
  const [toast, setToast] = useState('');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [selectedNotif, setSelectedNotif] = useState(null);
  const [prevUnread, setPrevUnread] = useState(0);
  const [profileImage, setProfileImage] = useState(
    () => localStorage.getItem('maintenanceProfilePhoto') || null
  );

  // Sync profile photo when updated from Settings
  useEffect(() => {
    const handleStorage = () => {
      const img = localStorage.getItem('maintenanceProfilePhoto');
      if (img) setProfileImage(img);
    };
    window.addEventListener('storage', handleStorage);
    window.addEventListener('maintenanceProfileUpdated', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('maintenanceProfileUpdated', handleStorage);
    };
  }, []);

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const playAlertSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      // Two-tone alert: high then low
      [880, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.4, ctx.currentTime + i * 0.15);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.15 + 0.2);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.2);
      });
    } catch (e) { /* audio not available */ }
  };
  const playDriverMessageSound = () => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const sequence = [1046, 784, 1046];
      sequence.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'triangle';
        gain.gain.setValueAtTime(0.3, ctx.currentTime + i * 0.16);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.16 + 0.12);
        osc.start(ctx.currentTime + i * 0.16);
        osc.stop(ctx.currentTime + i * 0.16 + 0.12);
      });
    } catch (e) { /* audio not available */ }
  };
  const load = async () => {
    setLoading(true);
    try {
      const [data, notifs] = await Promise.all([
        authReq(`${BASE}/issues`).catch(() => []),
        authReq(`${BASE}/notifications`).catch(() => []),
      ]);
      setIssues(Array.isArray(data) ? data : []);
      const notifList = Array.isArray(notifs) ? notifs : [];
      const newUnread = notifList.filter(n => !n.read).length;

      // Play sound if new unread notifications arrived
      setPrevUnread(prev => {
        if (newUnread > prev) playAlertSound();
        return newUnread;
      });

      setNotifications(notifList);
      setUnreadCount(newUnread);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (activeView === 'driver_response' && !selected && issues.length > 0) {
      setSelected(issues[0]);
    }
  }, [activeView, selected, issues]);

  const handleLogout = () => { apiLogout(); navigate('/'); };

  const advance = async (issue, extra = {}) => {
    const next = STATUS_STEPS[STATUS_STEPS.indexOf(issue.status) + 1];
    if (!next) return;
    setActing(issue._id);
    try {
      const res = await authReq(`${BASE}/issues/${issue._id}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: next, ...extra,
          ...(next === 'resolved' ? { resolutionNotes: extra.resolutionNotes || `Resolved on ${new Date().toLocaleDateString()}` } : {}),
        }),
      });
      setIssues(prev => prev.map(i => i._id === res.issue._id ? res.issue : i));
      if (selected?._id === issue._id) setSelected(res.issue);
      notify(next === 'resolved' ? '✅ Repair complete! Admin & Transport notified.' : `Updated to: ${STATUS_LABEL[next]}`);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setActing(null); }
  };

  const markAllRead = async () => {
    await authReq(`${BASE}/notifications/read-all`, { method: 'PUT' }).catch(() => { });
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const markRead = async (id) => {
    await authReq(`${BASE}/notifications/${id}/read`, { method: 'PUT' }).catch(() => { });
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const sendMessageToDriver = async () => {
    if (!selected) {
      setDriverMessageFeedback('No issue selected. Please select a case first.');
      return;
    }
    if (!messageToDriver.trim()) {
      setDriverMessageFeedback('Please enter a message to send to the driver.');
      return;
    }

    setActing(selected._id);
    try {
      const res = await authReq(`${BASE}/issues/${selected._id}/message-driver`, {
        method: 'POST',
        body: JSON.stringify({ message: messageToDriver, updateStatus: selected.status }),
      });

      if (!res.success) {
        setDriverMessageFeedback(`Failed to send: ${res.message || 'Unknown server response'}`);
        notify('Error sending driver message.');
        return;
      }

      const confirmationMessage = res.responseToDriver || `Maintenance message sent: ${messageToDriver}`;
      setSelected(prev => ({ ...prev, driverNotification: confirmationMessage }));
      setDriverMessageFeedback('Driver notified successfully with sound.');
      setMessageToDriver('');
      notify(`Message sent to ${res.driverName || 'driver'}.`);
      playDriverMessageSound();
    } catch (e) {
      setDriverMessageFeedback('Failed to send message: ' + (e.message || 'Network error'));
      notify('Error sending driver message.');
    } finally {
      setActing(null);
    }
  };

  const counts = {
    reported: issues.filter(i => i.status === 'reported').length,
    acknowledged: issues.filter(i => i.status === 'acknowledged').length,
    in_repair: issues.filter(i => i.status === 'in_repair').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
  };

  const tab = activeView === 'overview' ? null : activeView;
  const filtered = tab ? issues.filter(i => i.status === tab) : [];

  const initials = (user?.name || 'MO').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  const renderContent = () => {
    if (activeView === 'overview') return renderOverview();
    if (activeView === 'profile') return renderProfile();
    if (activeView === 'settings') return renderSettings();
    if (activeView === 'performance') return renderPerformance(); if (activeView === 'driver_response') return renderDriverResponse(); if (activeView === 'reports') return <MaintenanceReports />;
    return renderIssueList(activeView);
  };

  const renderProfile = () => (
    <div className="driver-page-wrapper">
      <div className="driver-page-header"><h2>👤 My Profile</h2><p>Your account information</p></div>
      <div className="driver-form-container">
        <div className="driver-form-header"><h3>Profile Information</h3><p>Maintenance Officer account details</p></div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 28 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', overflow: 'hidden', border: '3px solid rgba(139,92,246,0.3)', background: '#f3e8ff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>
            {profileImage ? <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : '👤'}
          </div>
          <div>
            <h3 style={{ margin: '0 0 4px', color: '#1f2937', fontSize: 20, fontWeight: 700 }}>{user?.name}</h3>
            <p style={{ margin: '0 0 4px', color: '#6b7280', fontSize: 13 }}>{user?.email || 'maintenance@hu.edu.et'}</p>
            <span style={{ background: '#ede9fe', color: '#7c3aed', padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>MAINTENANCE OFFICER</span>
          </div>
        </div>
        <div className="driver-form-grid">
          {[
            ['Full Name', user?.name || '—'],
            ['Username', user?.username || '—'],
            ['Email', user?.email || '—'],
            ['Phone', user?.phone || '—'],
            ['Department', user?.department || 'Maintenance'],
            ['Employee ID', user?.employeeId || user?._id?.slice(-6)?.toUpperCase() || '—'],
          ].map(([label, val]) => (
            <div key={label} className="driver-form-group">
              <label className="driver-form-label">{label}</label>
              <div style={{ padding: '12px 16px', background: '#f8fafc', border: '2px solid rgba(74,144,226,0.15)', borderRadius: 12, fontSize: 14, color: '#1f2937', fontWeight: 500 }}>{val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8 }}>
          <label className="driver-form-label" style={{ marginBottom: 8, display: 'block' }}>Upload Profile Photo</label>
          <input type="file" accept="image/*" onChange={e => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = ev => setProfileImage(ev.target.result);
            reader.readAsDataURL(file);
          }} style={{ fontSize: 13 }} />
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <MaintenanceSettings currentUser={user} />
  );

  const renderPerformance = () => {
    const total = issues.length;
    const resolved = issues.filter(i => i.status === 'resolved').length;
    const inRepair = issues.filter(i => i.status === 'in_repair').length;
    const rate = total > 0 ? Math.round((resolved / total) * 100) : 0;
    return (
      <div className="driver-page-wrapper">
        <div className="driver-page-header"><h2>📊 My Performance</h2><p>Repair statistics and completion rate</p></div>
        <div className="driver-stats-grid" style={{ marginBottom: 24 }}>
          {[
            { icon: '📋', label: 'Total Issues', value: total, color: '#6366f1' },
            { icon: '✅', label: 'Resolved', value: resolved, color: '#22c55e' },
            { icon: '🔧', label: 'In Progress', value: inRepair, color: '#3b82f6' },
            { icon: '📈', label: 'Completion Rate', value: `${rate}%`, color: '#f59e0b' },
          ].map((s, i) => (
            <div key={i} className="driver-stat-card">
              <div className="driver-stat-icon">{s.icon}</div>
              <div className="driver-stat-value" style={{ color: s.color }}>{s.value}</div>
              <div className="driver-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="driver-table-container">
          <div className="driver-table-header"><h3>✅ Recently Resolved</h3></div>
          <div className="driver-table-wrapper">
            <table className="driver-table">
              <thead><tr><th>Vehicle</th><th>Issue Type</th><th>Severity</th><th>Resolution</th><th>Date</th></tr></thead>
              <tbody>
                {issues.filter(i => i.status === 'resolved').slice(0, 10).map(issue => (
                  <tr key={issue._id}>
                    <td><strong>{issue.vehicle?.plateNumber || '—'}</strong></td>
                    <td>{issue.issueType}</td>
                    <td><span className="maint-severity-badge" style={{ background: `${SEVERITY_COLOR[issue.severity]}22`, color: SEVERITY_COLOR[issue.severity] }}>{issue.severity}</span></td>
                    <td style={{ fontSize: 12, color: '#6b7280', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{issue.resolutionNotes || '—'}</td>
                    <td>{issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
                {issues.filter(i => i.status === 'resolved').length === 0 && (
                  <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No resolved issues yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  const renderDriverResponse = () => {
    const issue = selected || issues.find(i => i.status === 'reported' || i.status === 'acknowledged' || i.status === 'in_repair');
    return (
      <div className="driver-page-wrapper">
        <div className="driver-page-header"><h2>✉️ Driver Response</h2><p>Select a case and send status/update instructions.</p></div>
        {!issue ? (
          <p style={{ color: '#6b7280', padding: 12 }}>No case selected. Please click an issue in the list to begin.</p>
        ) : (
          <div className="driver-table-container" style={{ padding: '16px 18px' }}>
            <h4>Case: {issue.reportReference} | Vehicle: {issue.vehicle?.plateNumber || 'N/A'} ({issue.vehicle?.model || 'N/A'})</h4>
            <p><strong>Issue:</strong> {issue.issueType || 'N/A'} ({issue.severity || 'N/A'})</p>
            <p><strong>Status:</strong> {STATUS_LABEL[issue.status] || issue.status} • <strong>Created:</strong> {issue.createdAt ? new Date(issue.createdAt).toLocaleDateString() : 'N/A'}</p>
            <p><strong>ETA / Fix Window:</strong> {issue.timeToResolve || 'pending diagnostics'}</p>
            <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #c7d2fe', borderRadius: 8, padding: 10, whiteSpace: 'pre-wrap' }}>
              <strong>Driver message preview</strong>
              <p>{issue.driverNotification || 'No message yet. Compose below to notify the driver with instructions and next steps.'}</p>
            </div>
            <textarea
              className="maint-textarea"
              rows={5}
              value={messageToDriver}
              onChange={e => setMessageToDriver(e.target.value)}
              placeholder="Compose the message with issue progress and expected wait time (e.g., 'Please wait 2 hours while we complete the brake replacement...')"
              style={{ width: '100%', marginTop: 14 }}
            />
            <button className="driver-btn-primary" style={{ marginTop: 8 }}
              disabled={acting === issue._id || !messageToDriver.trim()}
              onClick={sendMessageToDriver}>
              {acting === issue._id ? 'Sending…' : 'Send message to driver'}
            </button>
            {driverMessageFeedback && <p style={{ marginTop: 8, color: driverMessageFeedback.startsWith('Failed') ? '#dc2626' : '#16a34a' }}>{driverMessageFeedback}</p>}
          </div>
        )}
      </div>
    );
  };

  const renderOverview = () => (
    <div className="driver-dashboard-content">
      <div className="driver-dashboard-header">
        <h2>🔧 Maintenance Dashboard</h2>
        <p>Welcome, {user?.name || 'Maintenance Officer'} — {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
      </div>

      <div className="driver-stats-grid">
        {[
          { key: 'reported', icon: '📋', label: 'Active Requests', color: '#ef4444', cls: 'red' },
          { key: 'acknowledged', icon: '👁️', label: 'Acknowledged', color: '#f59e0b', cls: 'orange' },
          { key: 'in_repair', icon: '🔧', label: 'In Repair', color: '#3b82f6', cls: 'blue' },
          { key: 'resolved', icon: '✅', label: 'Completed', color: '#22c55e', cls: 'green' },
        ].map(s => (
          <div key={s.key} className={`driver-stat-card ${s.cls}`} onClick={() => setActiveView(s.key)} style={{ cursor: 'pointer' }}>
            <div className="driver-stat-icon">{s.icon}</div>
            <div className="driver-stat-value" style={{ color: s.color }}>{counts[s.key]}</div>
            <div className="driver-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {NAV_ITEMS.filter(n => n.key !== 'overview').map(n => (
          <button key={n.key} onClick={() => setActiveView(n.key)}
            className="driver-btn-primary" style={{ flex: 1, minWidth: 140, justifyContent: 'center' }}>
            {n.icon} {n.label}
            {counts[n.key] > 0 && <span style={{ background: '#ef4444', borderRadius: 10, padding: '1px 6px', fontSize: 11, marginLeft: 4 }}>{counts[n.key]}</span>}
          </button>
        ))}
      </div>

      {/* Recent issues */}
      <div className="driver-table-container">
        <div className="driver-table-header">
          <h3>📋 Recent Issues</h3>
          <button onClick={load} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>↻ Refresh</button>
        </div>
        {loading ? <p style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>Loading...</p> : (
          <div className="driver-table-wrapper">
            <table className="driver-table">
              <thead><tr><th>Vehicle</th><th>Issue</th><th>Severity</th><th>Status</th><th>Date</th></tr></thead>
              <tbody>
                {issues.slice(0, 5).map(issue => (
                  <tr key={issue._id} onClick={() => { setActiveView(issue.status); setSelected(issue); }} style={{ cursor: 'pointer' }}>
                    <td><strong>{issue.vehicle?.plateNumber || '—'}</strong></td>
                    <td>{issue.issueType}</td>
                    <td><span className="maint-severity-badge" style={{ background: `${SEVERITY_COLOR[issue.severity]}22`, color: SEVERITY_COLOR[issue.severity] }}>{issue.severity}</span></td>
                    <td><span className="driver-badge">{STATUS_ICON[issue.status]} {STATUS_LABEL[issue.status]}</span></td>
                    <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
                {issues.length === 0 && <tr><td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No issues found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  const renderIssueList = (status) => (
    <div className="driver-page-wrapper">
      <div className="driver-page-header">
        <h2>{STATUS_ICON[status]} {STATUS_LABEL[status]} Issues</h2>
        <p>Click a row to view details and take action</p>
      </div>

      <div style={{ display: 'flex', gap: 16 }}>
        {/* List */}
        <div style={{ flex: 1 }}>
          <div className="driver-table-container">
            <div className="driver-table-header">
              <h3>{STATUS_LABEL[status]} ({filtered.length})</h3>
              <button onClick={load} style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.3)', color: '#fff', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12 }}>↻</button>
            </div>
            {loading ? <p style={{ padding: '1.5rem', color: '#94a3b8', textAlign: 'center' }}>Loading...</p>
              : filtered.length === 0 ? <p style={{ padding: '2rem', color: '#94a3b8', textAlign: 'center' }}>No {STATUS_LABEL[status].toLowerCase()} issues.</p>
                : (
                  <div className="driver-table-wrapper">
                    <table className="driver-table">
                      <thead><tr><th>Vehicle</th><th>Issue Type</th><th>Severity</th><th>Reported By</th><th>Date</th><th>Action</th></tr></thead>
                      <tbody>
                        {filtered.map(issue => (
                          <tr key={issue._id} className={selected?._id === issue._id ? 'selected-row' : ''}
                            onClick={() => { setSelected(issue); setCostForm({ parts: '', labor: '', downtime: '', notes: '' }); }}>
                            <td><strong>{issue.vehicle?.plateNumber || '—'}</strong><br /><small style={{ color: '#6b7280' }}>{issue.vehicle?.model || ''}</small></td>
                            <td>{issue.issueType}</td>
                            <td><span className="maint-severity-badge" style={{ background: `${SEVERITY_COLOR[issue.severity]}22`, color: SEVERITY_COLOR[issue.severity] }}>{issue.severity}</span></td>
                            <td>{issue.reportedBy?.name || '—'}</td>
                            <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                            <td>
                              {issue.status !== 'resolved' && (
                                <button className="maint-action-btn" disabled={acting === issue._id}
                                  onClick={e => { e.stopPropagation(); advance(issue); }}>
                                  {acting === issue._id ? '...' : { reported: '✓ Acknowledge', acknowledged: '🔧 Start', in_repair: '✅ Complete' }[issue.status]}
                                </button>
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

        {/* Detail panel */}
        {selected && selected.status === status && (
          <div style={{ width: 380, flexShrink: 0 }}>
            <div className="driver-table-container">
              <div className="driver-table-header"><h3>🔍 Details</h3></div>
              <div className="maint-detail-body">
                <div className="maint-detail-section">
                  <div className="maint-detail-row"><span>Vehicle</span><strong>{selected.vehicle?.plateNumber} — {selected.vehicle?.model}</strong></div>
                  <div className="maint-detail-row"><span>Issue</span><strong>{selected.issueType}</strong></div>
                  <div className="maint-detail-row"><span>Severity</span><strong style={{ color: SEVERITY_COLOR[selected.severity] }}>{selected.severity}</strong></div>
                  <div className="maint-detail-row"><span>Reported By</span><strong>{selected.reportedBy?.name || '—'}</strong></div>
                  <div className="maint-detail-row"><span>Date</span><strong>{new Date(selected.createdAt).toLocaleString()}</strong></div>
                </div>
                <div className="maint-description-box">
                  <label>Description</label>
                  <p>{selected.description}</p>
                </div>

                {(selected.status === 'acknowledged' || selected.status === 'in_repair') && (
                  <div className="maint-cost-section">
                    <h4>💰 Repair Costing</h4>
                    <div className="maint-cost-grid">
                      <div className="maint-form-group"><label>Parts (ETB)</label><input type="number" placeholder="1500" value={costForm.parts} onChange={e => setCostForm(f => ({ ...f, parts: e.target.value }))} className="maint-input" /></div>
                      <div className="maint-form-group"><label>Labor (ETB)</label><input type="number" placeholder="500" value={costForm.labor} onChange={e => setCostForm(f => ({ ...f, labor: e.target.value }))} className="maint-input" /></div>
                      <div className="maint-form-group"><label>Downtime (days)</label><input type="number" placeholder="2" value={costForm.downtime} onChange={e => setCostForm(f => ({ ...f, downtime: e.target.value }))} className="maint-input" /></div>
                      <div className="maint-form-group" style={{ gridColumn: 'span 2' }}><label>Fix Notes *</label><textarea placeholder="Describe what was fixed..." value={costForm.notes} onChange={e => setCostForm(f => ({ ...f, notes: e.target.value }))} className="maint-textarea" rows={3} /></div>
                    </div>
                    {costForm.parts && costForm.labor && <div className="maint-cost-total">Total: <strong>ETB {(Number(costForm.parts) + Number(costForm.labor)).toLocaleString()}</strong></div>}
                  </div>
                )}

                {selected.status === 'resolved' && selected.resolutionNotes && (
                  <div className="maint-description-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <label style={{ color: '#15803d' }}>✅ Resolution</label>
                    <p>{selected.resolutionNotes}</p>
                  </div>
                )}

                {selected.status !== 'resolved' && (
                  <div className="maint-action-row">
                    {selected.status === 'reported' && (
                      <>
                        <div className="maint-form-group" style={{ marginBottom: 12 }}>
                          <label style={{ fontSize: 12, fontWeight: 700, color: '#374151', display: 'block', marginBottom: 4 }}>
                            Estimated Repair Time (tell the driver)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. 2-4 hours, 1-2 days, Under inspection..."
                            value={costForm.estimatedTime || ''}
                            onChange={e => setCostForm(f => ({ ...f, estimatedTime: e.target.value }))}
                            className="maint-input"
                          />
                        </div>
                        <button className="maint-btn primary" disabled={acting === selected._id}
                          onClick={() => advance(selected, { estimatedRepairTime: costForm.estimatedTime || 'To be determined after inspection' })}>
                          👁️ {acting === selected._id ? '...' : 'Acknowledge & Notify Driver'}
                        </button>
                      </>
                    )}
                    {selected.status === 'acknowledged' && (
                      <button className="maint-btn primary" disabled={acting === selected._id}
                        onClick={() => advance(selected, { repairNotes: costForm.notes, estimatedRepairTime: costForm.estimatedTime || 'In progress — you will be notified when complete' })}>
                        🔧 {acting === selected._id ? '...' : 'Start Repair & Notify Driver'}
                      </button>
                    )}
                    {selected.status === 'in_repair' && (
                      <>
                        <button className="maint-btn success" disabled={acting === selected._id || !costForm.notes}
                          onClick={() => advance(selected, {
                            resolutionNotes: `${costForm.notes}${costForm.parts ? ` | Parts: ETB ${costForm.parts}` : ''}${costForm.labor ? ` | Labor: ETB ${costForm.labor}` : ''}${costForm.downtime ? ` | Downtime: ${costForm.downtime}d` : ''}`,
                            partsUsed: costForm.parts ? `ETB ${costForm.parts}` : '',
                            laborHours: costForm.labor ? `ETB ${costForm.labor}` : '',
                            finalCost: costForm.parts && costForm.labor ? `ETB ${Number(costForm.parts) + Number(costForm.labor)}` : '',
                          })}>
                          ✅ {acting === selected._id ? '...' : 'Mark Complete — Notify Driver & Admin'}
                        </button>
                        {!costForm.notes && <p style={{ fontSize: 12, color: '#f59e0b', margin: '6px 0 0' }}>⚠️ Fill fix notes first.</p>}
                      </>
                    )}
                  </div>
                )}

                <div className="maint-action-row" style={{ marginTop: 16, borderTop: '1px solid #e5e7eb', paddingTop: 12 }}>
                  <h4 style={{ margin: '0 0 8px', fontSize: 14 }}>📩 Respond to Driver</h4>
                  <textarea
                    className="maint-textarea"
                    rows={4}
                    value={messageToDriver}
                    onChange={e => setMessageToDriver(e.target.value)}
                    placeholder="Compose reply to the driver about this issue..."
                    style={{ width: '100%', marginBottom: 8 }}
                  />
                  <button className="maint-btn primary" disabled={acting === selected._id || !messageToDriver.trim()} onClick={sendMessageToDriver}>
                    {acting === selected._id ? 'Sending…' : 'Send Response to Driver'}
                  </button>
                  {driverMessageFeedback && <p style={{ marginTop: 8, fontSize: 12, color: driverMessageFeedback.startsWith('Failed') ? '#dc2626' : '#16a34a' }}>{driverMessageFeedback}</p>}
                  {selected.driverNotification && (
                    <div style={{ marginTop: 10, background: '#f8fafc', border: '1px solid #c7d2fe', borderRadius: 8, padding: 10, whiteSpace: 'pre-wrap', fontSize: 13 }}>
                      <strong>Last message sent:</strong>
                      <p style={{ margin: '8px 0 0', lineHeight: 1.4 }}>{selected.driverNotification}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="driver-dashboard-wrapper">
      {toast && <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14, boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>{toast}</div>}

      {/* Sidebar */}
      <div className="driver-sidebar">
        <div className="driver-sidebar-header">
          <div className="driver-logo">
            <div className="driver-logo-icon">🔧</div>
            <span className="driver-logo-text">MAINTENANCE</span>
          </div>
        </div>

        <nav className="driver-sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button key={item.key}
              className={`driver-nav-item ${activeView === item.key ? 'active' : ''}`}
              onClick={() => { setActiveView(item.key); setSelected(null); }}>
              <span className="driver-nav-icon">{item.icon}</span>
              <span>{item.label}</span>
              {item.key !== 'overview' && counts[item.key] > 0 && (
                <span style={{ marginLeft: 'auto', background: '#ef4444', color: '#fff', borderRadius: 10, padding: '1px 7px', fontSize: 11, fontWeight: 700 }}>{counts[item.key]}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="driver-sidebar-footer">
          <button onClick={handleLogout} className="driver-logout-btn">
            <span className="driver-logout-icon">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="driver-main-content">
        {/* Header */}
        <div className="driver-header">
          <div className="driver-header-left">
            <h1>Maintenance Office</h1>
          </div>
          <div className="driver-header-right">
            {/* Notification bell */}
            <button className="driver-notification-bell"
              onClick={() => { setShowNotifications(!showNotifications); setShowProfileMenu(false); }}
              title="Notifications">
              🔔
              {unreadCount > 0 && <span className="driver-notification-badge">{unreadCount}</span>}
            </button>

            {/* Profile */}
            <div className="driver-profile-dropdown-container">
              <div className="driver-header-profile-section"
                onClick={() => { setShowProfileMenu(!showProfileMenu); setShowNotifications(false); }}>
                <div className="driver-header-profile-avatar">
                  {profileImage
                    ? <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                    : <div className="driver-header-avatar-placeholder"><span className="driver-avatar-icon">👤</span></div>}
                </div>
                <div className="driver-header-profile-info">
                  <span className="driver-header-profile-name">{user?.name?.split(' ')[0] || 'Maintenance'}</span>
                </div>
                <div className="driver-header-dropdown-arrow">
                  <span className={`driver-dropdown-icon ${showProfileMenu ? 'rotated' : ''}`}>▼</span>
                </div>
              </div>

              {showProfileMenu && (
                <>
                  <div className="driver-profile-overlay" onClick={() => setShowProfileMenu(false)} />
                  <div className="driver-profile-dropdown">
                    <div className="driver-profile-dropdown-header">
                      <div className="driver-profile-header-avatar">
                        {profileImage
                          ? <img src={profileImage} alt="profile" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%' }} />
                          : <div className="driver-profile-avatar-placeholder"><span>👤</span></div>}
                      </div>
                      <div className="driver-profile-header-info">
                        <h4 className="driver-profile-header-name">{user?.name || 'Maintenance Officer'}</h4>
                        <p className="driver-profile-header-email">{user?.email || 'maintenance@hu.edu.et'}</p>
                        <span className="driver-profile-header-id">ID: {user?.employeeId || user?._id?.slice(-6)?.toUpperCase() || 'MNT-001'}</span>
                      </div>
                    </div>
                    <div className="driver-profile-menu-items">
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('profile'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">👤</span><span>My Profile</span>
                      </button>
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('settings'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">⚙️</span><span>Settings</span>
                      </button>
                      <button className="driver-profile-menu-item" onClick={() => { setActiveView('performance'); setShowProfileMenu(false); }}>
                        <span className="driver-profile-menu-icon">📊</span><span>My Performance</span>
                      </button>
                      <div className="driver-profile-menu-divider" />
                      <button className="driver-profile-menu-item logout" onClick={() => { setShowProfileMenu(false); handleLogout(); }}>
                        <span className="driver-profile-menu-icon">🚪</span><span>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Notification dropdown */}
        {showNotifications && (
          <>
            <div className="driver-notification-overlay" onClick={() => { setShowNotifications(false); setSelectedNotif(null); }} />
            <div className="driver-notification-dropdown">
              <div className="driver-notification-dropdown-header">
                <h3>🔔 Notifications {unreadCount > 0 && <span style={{ fontSize: 13, background: '#ef4444', color: '#fff', borderRadius: 20, padding: '2px 8px', marginLeft: 6 }}>{unreadCount}</span>}</h3>
                <div className="driver-notification-actions">
                  {unreadCount > 0 && <button className="driver-mark-all-read" onClick={markAllRead}>✓ Mark all read</button>}
                  <button className="driver-notification-close" onClick={() => { setShowNotifications(false); setSelectedNotif(null); }}>✕</button>
                </div>
              </div>

              {/* Detail view */}
              {selectedNotif ? (
                <div style={{ padding: '16px 20px' }}>
                  <button onClick={() => setSelectedNotif(null)}
                    style={{ background: 'none', border: 'none', color: '#6366f1', cursor: 'pointer', fontSize: 13, fontWeight: 600, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 4 }}>
                    ← Back to list
                  </button>
                  <div style={{ background: '#f8fafc', borderRadius: 12, padding: '16px', border: '1px solid #e2e8f0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                      <span style={{ fontSize: 28, background: '#ede9fe', borderRadius: 10, width: 44, height: 44, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🔧</span>
                      <div>
                        <div style={{ fontWeight: 700, color: '#1f2937', fontSize: 14 }}>{selectedNotif.title}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(selectedNotif.createdAt).toLocaleString()}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, whiteSpace: 'pre-wrap', background: '#fff', borderRadius: 8, padding: '12px', border: '1px solid #e5e7eb' }}>
                      {selectedNotif.message}
                    </div>
                    <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
                      <span style={{
                        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
                        background: selectedNotif.severity === 'high' ? '#fee2e2' : selectedNotif.severity === 'medium' ? '#fef3c7' : '#ede9fe',
                        color: selectedNotif.severity === 'high' ? '#dc2626' : selectedNotif.severity === 'medium' ? '#d97706' : '#7c3aed'
                      }}>
                        {selectedNotif.severity?.toUpperCase() || 'NORMAL'}
                      </span>
                      {ACTION_CONFIG[selectedNotif.type] && (
                        <button
                          onClick={() => {
                            if (!selectedNotif.read) markRead(selectedNotif._id);
                            setActiveView(ACTION_CONFIG[selectedNotif.type].view);
                            setShowNotifications(false);
                            setSelectedNotif(null);
                          }}
                          style={{ fontSize: 12, fontWeight: 600, padding: '4px 14px', borderRadius: 20, background: '#6366f1', color: '#fff', border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                        >
                          {ACTION_CONFIG[selectedNotif.type].label} <span>→</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="driver-notification-list">
                  {notifications.length === 0 ? (
                    <div className="driver-no-notifications">
                      <span className="driver-no-notifications-icon">🔔</span>
                      <p>No notifications yet</p>
                      <p style={{ fontSize: 12, opacity: 0.6 }}>New maintenance requests will appear here with a sound alert.</p>
                    </div>
                  ) : notifications.slice(0, 8).map(n => (
                    <div key={n._id}
                      className={`driver-notification-item ${n.read ? 'read' : 'unread'}`}
                      style={{ cursor: 'pointer' }}
                      onClick={() => {
                        setSelectedNotif(n);
                        if (!n.read) markRead(n._id);
                      }}>
                      <div className="driver-notification-icon">🔧</div>
                      <div className="driver-notification-content">
                        <strong className="driver-notification-title">{n.title}</strong>
                        <p className="driver-notification-message" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                          {n.message?.slice(0, 70)}{n.message?.length > 70 ? '...' : ''}
                        </p>
                        <span className="driver-notification-time" style={{ display: 'block', marginBottom: 8 }}>{new Date(n.createdAt).toLocaleString()}</span>
                        {ACTION_CONFIG[n.type] && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!n.read) markRead(n._id);
                              setActiveView(ACTION_CONFIG[n.type].view);
                              setShowNotifications(false);
                            }}
                            style={{ padding: '6px 12px', background: '#6366f1', color: 'white', border: 'none', borderRadius: 4, cursor: 'pointer', fontSize: 11, fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}
                          >
                            {ACTION_CONFIG[n.type].label} <span>→</span>
                          </button>
                        )}
                      </div>
                      {!n.read && <div className="driver-notification-unread-dot" />}
                    </div>
                  ))}
                </div>
              )}

              {!selectedNotif && notifications.length > 0 && (
                <div className="driver-notification-footer">
                  <button className="driver-view-all-notifications"
                    onClick={() => { setActiveView('reported'); setShowNotifications(false); }}>
                    View All Active Requests
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Page content */}
        <div className="driver-page-content">
          {renderContent()}
        </div>
      </div>
    </div>
  );
}
