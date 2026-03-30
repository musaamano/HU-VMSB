import { useState, useEffect } from 'react';
import { getVehicleIssues, updateVehicleIssue } from '../../api/api';
import './MaintenanceMonitor.css';

const SEVERITY_COLOR = { Minor: '#f59e0b', Moderate: '#f97316', Critical: '#ef4444' };
const STATUS_STEPS   = ['reported', 'acknowledged', 'in_repair', 'resolved'];
const STATUS_LABEL   = { reported: 'Reported', acknowledged: 'Acknowledged', in_repair: 'In Repair', resolved: 'Resolved' };
const STATUS_ICON    = { reported: '📋', acknowledged: '👁️', in_repair: '🔧', resolved: '✅' };

export default function MaintenanceMonitor() {
  const [issues, setIssues]     = useState([]);
  const [loading, setLoading]   = useState(true);
  const [tab, setTab]           = useState('reported');
  const [selected, setSelected] = useState(null);
  const [acting, setActing]     = useState(null);
  const [costForm, setCostForm] = useState({ parts: '', labor: '', downtime: '', notes: '' });
  const [toast, setToast]       = useState('');

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const load = async () => {
    setLoading(true);
    try {
      const data = await getVehicleIssues().catch(() => []);
      setIssues(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const advance = async (issue, extra = {}) => {
    const next = STATUS_STEPS[STATUS_STEPS.indexOf(issue.status) + 1];
    if (!next) return;
    setActing(issue._id);
    try {
      const res = await updateVehicleIssue(issue._id, {
        status: next,
        ...extra,
        ...(next === 'resolved' ? { resolutionNotes: extra.resolutionNotes || `Resolved on ${new Date().toLocaleDateString()}` } : {}),
      });
      setIssues(prev => prev.map(i => i._id === res.issue._id ? res.issue : i));
      if (selected?._id === issue._id) setSelected(res.issue);
      notify(next === 'resolved' ? '✅ Repair complete! Report sent to Admin.' : `Status updated to: ${STATUS_LABEL[next]}`);
    } catch (e) { notify('Error: ' + e.message); }
    finally { setActing(null); }
  };

  const counts = {
    reported:     issues.filter(i => i.status === 'reported').length,
    acknowledged: issues.filter(i => i.status === 'acknowledged').length,
    in_repair:    issues.filter(i => i.status === 'in_repair').length,
    resolved:     issues.filter(i => i.status === 'resolved').length,
  };

  const filtered = issues.filter(i => i.status === tab);

  return (
    <div className="maint-page">
      {toast && <div className="maint-toast">{toast}</div>}

      <div className="maint-header">
        <div>
          <h2>🛠️ Maintenance Management</h2>
          <p>Track active repairs, log fixes, and notify drivers of downtime</p>
        </div>
        <button className="maint-refresh-btn" onClick={load}>↻ Refresh</button>
      </div>

      {/* Stats */}
      <div className="maint-stats-grid">
        {[
          { key: 'reported',     icon: '📋', label: 'Active Requests',  color: '#ef4444' },
          { key: 'acknowledged', icon: '👁️', label: 'Acknowledged',     color: '#f59e0b' },
          { key: 'in_repair',    icon: '🔧', label: 'In Repair',        color: '#3b82f6' },
          { key: 'resolved',     icon: '✅', label: 'Completed',        color: '#22c55e' },
        ].map(s => (
          <div key={s.key} className={`maint-stat-card ${tab === s.key ? 'active' : ''}`}
            onClick={() => setTab(s.key)} style={{ '--accent': s.color }}>
            <div className="maint-stat-icon">{s.icon}</div>
            <div className="maint-stat-value" style={{ color: s.color }}>{counts[s.key]}</div>
            <div className="maint-stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tab bar */}
      <div className="maint-tabs">
        {STATUS_STEPS.map(s => (
          <button key={s} className={`maint-tab ${tab === s ? 'active' : ''}`} onClick={() => setTab(s)}>
            {STATUS_ICON[s]} {STATUS_LABEL[s]}
            {counts[s] > 0 && <span className="maint-tab-badge">{counts[s]}</span>}
          </button>
        ))}
      </div>

      <div className="maint-workspace">
        {/* Issues list */}
        <div className="maint-list-col">
          <div className="maint-table-container">
            <div className="maint-table-header">
              <h3>{STATUS_ICON[tab]} {STATUS_LABEL[tab]} Issues ({filtered.length})</h3>
            </div>
            {loading ? (
              <p className="maint-empty">Loading...</p>
            ) : filtered.length === 0 ? (
              <p className="maint-empty">No {STATUS_LABEL[tab].toLowerCase()} issues.</p>
            ) : (
              <div className="maint-table-wrapper">
                <table className="maint-table">
                  <thead>
                    <tr>
                      <th>Vehicle</th><th>Issue Type</th><th>Severity</th><th>Reported By</th><th>Date</th><th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map(issue => (
                      <tr key={issue._id} className={selected?._id === issue._id ? 'selected-row' : ''}
                        onClick={() => { setSelected(issue); setCostForm({ parts: '', labor: '', downtime: '', notes: '' }); }}>
                        <td><strong>{issue.vehicle?.plateNumber || '—'}</strong><br /><small>{issue.vehicle?.model || ''}</small></td>
                        <td>{issue.issueType}</td>
                        <td>
                          <span className="maint-severity-badge" style={{ background: `${SEVERITY_COLOR[issue.severity]}22`, color: SEVERITY_COLOR[issue.severity] }}>
                            {issue.severity}
                          </span>
                        </td>
                        <td>{issue.reportedBy?.name || '—'}</td>
                        <td>{new Date(issue.createdAt).toLocaleDateString()}</td>
                        <td>
                          {issue.status !== 'resolved' && (
                            <button className="maint-action-btn"
                              disabled={acting === issue._id}
                              onClick={e => { e.stopPropagation(); advance(issue); }}>
                              {acting === issue._id ? '...' : {
                                reported:     '✓ Acknowledge',
                                acknowledged: '🔧 Start Repair',
                                in_repair:    '✅ Complete',
                              }[issue.status]}
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
        {selected && (
          <div className="maint-detail-col">
            <div className="maint-table-container">
              <div className="maint-table-header">
                <h3>🔍 Issue Details</h3>
              </div>
              <div className="maint-detail-body">
                {/* Issue info */}
                <div className="maint-detail-section">
                  <div className="maint-detail-row"><span>Vehicle</span><strong>{selected.vehicle?.plateNumber} — {selected.vehicle?.model}</strong></div>
                  <div className="maint-detail-row"><span>Issue Type</span><strong>{selected.issueType}</strong></div>
                  <div className="maint-detail-row">
                    <span>Severity</span>
                    <strong style={{ color: SEVERITY_COLOR[selected.severity] }}>{selected.severity}</strong>
                  </div>
                  <div className="maint-detail-row"><span>Reported By</span><strong>{selected.reportedBy?.name || '—'}</strong></div>
                  <div className="maint-detail-row"><span>Date</span><strong>{new Date(selected.createdAt).toLocaleString()}</strong></div>
                  <div className="maint-detail-row"><span>Status</span>
                    <span className="maint-status-badge">{STATUS_ICON[selected.status]} {STATUS_LABEL[selected.status]}</span>
                  </div>
                </div>

                <div className="maint-description-box">
                  <label>Problem Description</label>
                  <p>{selected.description}</p>
                </div>

                {/* Repair costing — show when in_repair or acknowledged */}
                {(selected.status === 'acknowledged' || selected.status === 'in_repair') && (
                  <div className="maint-cost-section">
                    <h4>💰 Repair Costing</h4>
                    <div className="maint-cost-grid">
                      <div className="maint-form-group">
                        <label>Parts Cost (ETB)</label>
                        <input type="number" placeholder="e.g. 1500" value={costForm.parts}
                          onChange={e => setCostForm(f => ({ ...f, parts: e.target.value }))}
                          className="maint-input" />
                      </div>
                      <div className="maint-form-group">
                        <label>Labor Cost (ETB)</label>
                        <input type="number" placeholder="e.g. 500" value={costForm.labor}
                          onChange={e => setCostForm(f => ({ ...f, labor: e.target.value }))}
                          className="maint-input" />
                      </div>
                      <div className="maint-form-group">
                        <label>Estimated Downtime (days)</label>
                        <input type="number" placeholder="e.g. 2" value={costForm.downtime}
                          onChange={e => setCostForm(f => ({ ...f, downtime: e.target.value }))}
                          className="maint-input" />
                      </div>
                      <div className="maint-form-group" style={{ gridColumn: 'span 2' }}>
                        <label>Fix Notes / Parts Used</label>
                        <textarea placeholder="Describe what was fixed and parts replaced..." value={costForm.notes}
                          onChange={e => setCostForm(f => ({ ...f, notes: e.target.value }))}
                          className="maint-textarea" rows={3} />
                      </div>
                    </div>
                    {costForm.parts && costForm.labor && (
                      <div className="maint-cost-total">
                        Total Estimated Cost: <strong>ETB {(Number(costForm.parts) + Number(costForm.labor)).toLocaleString()}</strong>
                        {costForm.downtime && <span> · Downtime: {costForm.downtime} day(s)</span>}
                      </div>
                    )}
                  </div>
                )}

                {/* Resolution notes for resolved */}
                {selected.status === 'resolved' && selected.resolutionNotes && (
                  <div className="maint-description-box" style={{ background: '#f0fdf4', borderColor: '#bbf7d0' }}>
                    <label style={{ color: '#15803d' }}>✅ Resolution Notes</label>
                    <p>{selected.resolutionNotes}</p>
                  </div>
                )}

                {/* Action buttons */}
                {selected.status !== 'resolved' && (
                  <div className="maint-action-row">
                    {selected.status === 'reported' && (
                      <button className="maint-btn primary" disabled={acting === selected._id}
                        onClick={() => advance(selected)}>
                        👁️ {acting === selected._id ? 'Processing...' : 'Acknowledge & Prioritize'}
                      </button>
                    )}
                    {selected.status === 'acknowledged' && (
                      <button className="maint-btn primary" disabled={acting === selected._id}
                        onClick={() => advance(selected, { repairNotes: costForm.notes })}>
                        🔧 {acting === selected._id ? 'Processing...' : 'Start Repair'}
                      </button>
                    )}
                    {selected.status === 'in_repair' && (
                      <button className="maint-btn success" disabled={acting === selected._id || !costForm.notes}
                        onClick={() => advance(selected, {
                          resolutionNotes: `${costForm.notes}${costForm.parts ? ` | Parts: ETB ${costForm.parts}` : ''}${costForm.labor ? ` | Labor: ETB ${costForm.labor}` : ''}${costForm.downtime ? ` | Downtime: ${costForm.downtime}d` : ''}`,
                        })}>
                        ✅ {acting === selected._id ? 'Completing...' : 'Mark Repair Complete & Notify Admin'}
                      </button>
                    )}
                    {selected.status === 'in_repair' && !costForm.notes && (
                      <p style={{ fontSize: 12, color: '#f59e0b', margin: '8px 0 0' }}>⚠️ Please fill in fix notes before completing.</p>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
