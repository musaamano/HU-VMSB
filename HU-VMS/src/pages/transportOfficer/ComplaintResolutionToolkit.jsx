import { useState, useEffect } from 'react';
import {
  X, Upload, AlertTriangle, CheckCircle, User, Car, Hash,
  FileText, Zap, Bell, ShieldAlert, ChevronRight, Sparkles
} from 'lucide-react';
import './complaints.css';

// ─── Resolution actions per category ───────────────────────────────────────
const CATEGORY_ACTIONS = {
  Resource: [
    { id: 'fuel_deduction',    label: 'Fuel Deduction',    auto: false, keywords: ['fuel', 'theft', 'missing', 'stolen', 'deduct', 'resource', 'misuse'] },
    { id: 'security_referral', label: 'Security Referral', auto: false, keywords: ['theft', 'stolen', 'security', 'police', 'report', 'missing'] },
    { id: 'audit',             label: 'Conduct Audit',     auto: false, keywords: ['audit', 'check', 'verify', 'discrepancy', 'record', 'log'] },
  ],
  Safety: [
    { id: 'warning_issued', label: 'Issue Warning',             auto: false, keywords: ['warning', 'reckless', 'speed', 'fast', 'dangerous', 'unsafe', 'risk'] },
    { id: 'suspension',     label: 'Driver Suspension',         auto: false, keywords: ['suspend', 'serious', 'accident', 'injury', 'drunk', 'assault', 'critical'] },
    { id: 'training',       label: 'Schedule Safety Training',  auto: false, keywords: ['training', 'unsafe', 'reckless', 'speed', 'dangerous', 'careless'] },
    { id: 'inspection',     label: 'Vehicle Inspection',        auto: false, keywords: ['brake', 'tire', 'vehicle', 'mechanical', 'inspection', 'fault', 'defect'] },
  ],
  Mechanical: [
    { id: 'out_of_service',     label: 'Mark Vehicle Out of Service', auto: true,  keywords: ['breakdown', 'broken', 'engine', 'accident', 'severe', 'critical'] },
    { id: 'maintenance_ticket', label: 'Create Maintenance Ticket',   auto: true,  keywords: ['repair', 'fix', 'maintenance', 'service', 'fault', 'issue'] },
  ],
  Behavioral: [
    { id: 'driver_file_record',  label: 'Add to Driver File Record',  auto: false, keywords: ['record', 'repeat', 'again', 'history', 'pattern', 'multiple'] },
    { id: 'counseling',          label: 'Schedule Counseling',        auto: false, keywords: ['rude', 'attitude', 'behavior', 'disrespect', 'argue', 'aggressive', 'counseling'] },
    { id: 'warning_behavioral',  label: 'Issue Behavioral Warning',   auto: false, keywords: ['late', 'absent', 'unprofessional', 'rude', 'disrespect', 'behavior', 'conduct'] },
  ],
  Service: [
    { id: 'route_optimization',  label: 'Route Optimization',   auto: false, keywords: ['route', 'wrong', 'detour', 'long', 'path', 'direction', 'lost'] },
    { id: 'schedule_adjustment', label: 'Schedule Adjustment',  auto: false, keywords: ['late', 'delay', 'time', 'schedule', 'slow', 'waiting', 'early', 'missed'] },
  ],
};

// ─── Smart recommendation engine ───────────────────────────────────────────
function getSmartRecommendations(complaint) {
  const text = `${complaint.description} ${complaint.category} ${complaint.priority}`.toLowerCase();
  const actions = CATEGORY_ACTIONS[complaint.category] || [];

  return actions
    .filter(a => !a.auto)
    .map(action => {
      const hits = action.keywords.filter(kw => text.includes(kw)).length;
      // Boost score for high/critical priority
      const priorityBoost = complaint.priority === 'Critical' ? 2
        : complaint.priority === 'High' ? 1 : 0;
      return { ...action, score: hits + priorityBoost };
    })
    .sort((a, b) => b.score - a.score);
}

// Returns ids of actions that should be pre-selected (score > 0, top 2 max)
function getPreselectedIds(complaint) {
  const recs = getSmartRecommendations(complaint);
  return recs.filter(a => a.score > 0).slice(0, 2).map(a => a.id);
}

// ─── Message generators ─────────────────────────────────────────────────────
function generateUserMessage(complaint, selectedActions) {
  const actionLabels = selectedActions.map(a => a.label).join(', ');
  const apology = ['Behavioral', 'Safety'].includes(complaint.category)
    ? 'We sincerely apologize for the inconvenience and distress this situation has caused you. '
    : '';
  const operational = ['Mechanical', 'Service'].includes(complaint.category)
    ? 'We have initiated the necessary operational updates to prevent recurrence. '
    : '';

  return `Dear ${complaint.sender},

Thank you for submitting complaint ${complaint.id} regarding "${complaint.description}".

${apology}${operational}We have reviewed your complaint and taken the following actions: ${actionLabels || 'under review'}.

Your feedback is important to us and helps improve our transport services. We are committed to resolving this matter promptly.

Regards,
Transport Officer — Haramaya University VMS`;
}

function generateDriverWarning(complaint, selectedActions, driverAtFault) {
  const actionLabels = selectedActions.map(a => a.label).join(', ');
  const penaltyNote = driverAtFault
    ? '\n⚠️  PENALTY NOTICE: You have been marked at fault. Finance department has been notified for applicable deductions.'
    : '';

  return `FORMAL WARNING NOTICE
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Driver: ${complaint.driver}
Vehicle: ${complaint.vehicle}
Trip ID: ${complaint.tripId}
Date: ${new Date().toLocaleDateString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLAINT REFERENCE: ${complaint.id}
Category: ${complaint.category}

DESCRIPTION:
${complaint.description}

REQUIRED CORRECTIVE ACTIONS:
${actionLabels || 'To be determined'}
${penaltyNote}

This notice is placed on your official driver record. Repeated violations may result in suspension or termination.

Transport Officer — Haramaya University VMS`;
}

// ─── Main Component ─────────────────────────────────────────────────────────
export default function ComplaintResolutionToolkit({ complaint, onClose, onResolve }) {
  const [activeTab, setActiveTab] = useState('actions');
  const [selectedActions, setSelectedActions] = useState([]);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [evidenceFiles, setEvidenceFiles] = useState([]);
  const [driverAtFault, setDriverAtFault] = useState(false);
  const [userMessage, setUserMessage] = useState('');
  const [driverWarning, setDriverWarning] = useState('');
  const [confirmStep, setConfirmStep] = useState(false);
  const [error, setError] = useState('');

  const actions = CATEGORY_ACTIONS[complaint.category] || [];
  const autoActions = actions.filter(a => a.auto);
  const manualActions = actions.filter(a => !a.auto);

  // Auto-select automatic actions + smart pre-selected manual actions on mount
  useEffect(() => {
    const preIds = getPreselectedIds(complaint);
    const preManual = manualActions.filter(a => preIds.includes(a.id));
    setSelectedActions([...autoActions, ...preManual]);
  }, [complaint._id || complaint.id]);

  // Regenerate messages whenever relevant state changes
  useEffect(() => {
    const all = [...autoActions, ...selectedActions.filter(a => !a.auto)];
    setUserMessage(generateUserMessage(complaint, all));
    setDriverWarning(generateDriverWarning(complaint, all, driverAtFault));
  }, [selectedActions, driverAtFault, complaint]);

  const toggleAction = (action) => {
    if (action.auto) return;
    setSelectedActions(prev =>
      prev.find(a => a.id === action.id)
        ? prev.filter(a => a.id !== action.id)
        : [...prev, action]
    );
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    setEvidenceFiles(prev => [...prev, ...files]);
  };

  const handleResolve = () => {
    const manualSelected = selectedActions.filter(a => !a.auto);
    if (manualSelected.length === 0 && autoActions.length === 0) {
      setError('Please select at least one resolution action.');
      return;
    }
    setError('');
    setConfirmStep(true);
  };

  const confirmResolve = () => {
    const allActions = [...autoActions, ...selectedActions.filter(a => !a.auto)];

    // Simulate automatic action execution
    autoActions.forEach(a => {
      console.log(`[AUTO ACTION] Executing: ${a.label} for complaint ${complaint.id}`);
    });

    if (driverAtFault) {
      console.log(`[FINANCE NOTIFICATION] Driver ${complaint.driver} marked at fault — penalty triggered.`);
      alert(`Finance notification sent: Driver ${complaint.driver} marked at fault for complaint ${complaint.id}.`);
    }

    console.log(`[NOTIFICATION] User message sent to ${complaint.sender}`);
    console.log(`[WARNING] Driver warning issued to ${complaint.driver}`);

    onResolve({
      complaintId: complaint._id || complaint.id,
      actions: allActions,
      notes: resolutionNotes,
      driverAtFault,
      userMessage,
      driverWarning,
      evidenceCount: evidenceFiles.length,
      resolvedAt: new Date().toISOString(),
    });
  };

  const priorityColors = { High: '#ef4444', Medium: '#f59e0b', Low: '#22c55e', Critical: '#dc2626' };

  return (
    <div className="rtk-overlay" onClick={onClose}>
      <div className="rtk-modal" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="rtk-header">
          <div className="rtk-header-left">
            <ShieldAlert size={20} />
            <div>
              <h2>Resolution Toolkit</h2>
              <span className="rtk-complaint-id">{complaint.tripId || complaint._id?.slice(-8)}</span>
            </div>
          </div>
          <button className="rtk-close" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Complaint Summary */}
        <div className="rtk-summary">
          <div className="rtk-summary-grid">
            <div className="rtk-summary-item">
              <span className="rtk-label"><User size={12} /> Sender</span>
              <span className="rtk-val">{complaint.sender} <em className="rtk-role">({complaint.role})</em></span>
            </div>
            <div className="rtk-summary-item">
              <span className="rtk-label"><Car size={12} /> Vehicle / Driver</span>
              <span className="rtk-val">{complaint.vehicle || '—'} / {complaint.driver || '—'}</span>
            </div>
            <div className="rtk-summary-item">
              <span className="rtk-label"><Hash size={12} /> Trip ID</span>
              <span className="rtk-val">{complaint.tripId || '—'}</span>
            </div>
            <div className="rtk-summary-item">
              <span className="rtk-label"><FileText size={12} /> Description</span>
              <span className="rtk-val rtk-desc">{complaint.description}</span>
            </div>
          </div>
          <div className="rtk-summary-badges">
            <span className="rtk-badge category">{complaint.category}</span>
            <span className="rtk-badge priority" style={{ color: priorityColors[complaint.priority], borderColor: priorityColors[complaint.priority] }}>
              {complaint.priority}
            </span>
          </div>
        </div>

        {/* Tabs */}
        <div className="rtk-tabs">
          {['actions', 'user-notification', 'driver-warning'].map(tab => (
            <button
              key={tab}
              className={`rtk-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === 'actions' && <Zap size={14} />}
              {tab === 'user-notification' && <Bell size={14} />}
              {tab === 'driver-warning' && <AlertTriangle size={14} />}
              {tab === 'actions' ? 'Actions' : tab === 'user-notification' ? 'User Notification' : 'Driver Warning'}
            </button>
          ))}
        </div>

        <div className="rtk-body">

          {/* ── ACTIONS TAB ── */}
          {activeTab === 'actions' && (
            <div className="rtk-actions-tab">

              {/* Auto Actions */}
              {autoActions.length > 0 && (
                <div className="rtk-action-group">
                  <div className="rtk-group-label auto">
                    <Zap size={13} /> Automatic Actions <span className="rtk-auto-badge">AUTO</span>
                  </div>
                  {autoActions.map(action => (
                    <label key={action.id} className="rtk-action-item auto">
                      <input type="checkbox" checked disabled />
                      <span className="rtk-action-label">{action.label}</span>
                      <span className="rtk-auto-tag">Triggered automatically</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Manual Actions — Smart Recommendations */}
              {manualActions.length > 0 && (() => {
                const scored = getSmartRecommendations(complaint);
                const topIds = scored.filter(a => a.score > 0).slice(0, 2).map(a => a.id);
                return (
                  <div className="rtk-action-group">
                    <div className="rtk-group-label">
                      <Sparkles size={13} /> Smart Resolution Actions
                      <span className="rtk-smart-hint">AI-ranked by complaint analysis</span>
                    </div>
                    {scored.map((action, idx) => {
                      const isSelected = !!selectedActions.find(a => a.id === action.id);
                      const isTop = topIds.includes(action.id);
                      return (
                        <label
                          key={action.id}
                          className={`rtk-action-item ${isSelected ? 'selected' : ''} ${isTop ? 'smart-pick' : ''}`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => toggleAction(action)}
                          />
                          <span className="rtk-action-label">{action.label}</span>
                          <div className="rtk-action-meta">
                            {isTop && (
                              <span className="rtk-smart-badge">
                                <Sparkles size={10} /> Suggested
                              </span>
                            )}
                            {action.score > 0 && (
                              <span className="rtk-score-bar">
                                {[...Array(Math.min(action.score, 4))].map((_, i) => (
                                  <span key={i} className="rtk-score-dot filled" />
                                ))}
                                {[...Array(Math.max(0, 4 - action.score))].map((_, i) => (
                                  <span key={i} className="rtk-score-dot" />
                                ))}
                              </span>
                            )}
                          </div>
                        </label>
                      );
                    })}
                  </div>
                );
              })()}

              {/* Driver at Fault */}
              <div className="rtk-fault-toggle">
                <div className="rtk-fault-info">
                  <AlertTriangle size={16} className="rtk-fault-icon" />
                  <div>
                    <div className="rtk-fault-title">Mark Driver at Fault</div>
                    <div className="rtk-fault-sub">Triggers finance notification for penalty processing</div>
                  </div>
                </div>
                <label className="rtk-toggle">
                  <input type="checkbox" checked={driverAtFault} onChange={e => setDriverAtFault(e.target.checked)} />
                  <span className="rtk-toggle-slider" />
                </label>
              </div>

              {/* Evidence Upload */}
              <div className="rtk-evidence">
                <div className="rtk-group-label">Evidence Upload</div>
                <label className="rtk-upload-area">
                  <Upload size={20} />
                  <span>Click to upload images or PDFs</span>
                  <input type="file" multiple accept="image/*,.pdf" onChange={handleFileUpload} hidden />
                </label>
                {evidenceFiles.length > 0 && (
                  <div className="rtk-file-list">
                    {evidenceFiles.map((f, i) => (
                      <div key={i} className="rtk-file-item">
                        <FileText size={13} />
                        <span>{f.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Resolution Notes */}
              <div className="rtk-notes">
                <div className="rtk-group-label">Resolution Notes</div>
                <textarea
                  className="rtk-textarea"
                  placeholder="Add internal notes about this resolution..."
                  value={resolutionNotes}
                  onChange={e => setResolutionNotes(e.target.value)}
                  rows={3}
                />
              </div>

              {error && <div className="rtk-error"><AlertTriangle size={14} /> {error}</div>}
            </div>
          )}

          {/* ── USER NOTIFICATION TAB ── */}
          {activeTab === 'user-notification' && (
            <div className="rtk-message-tab">
              <div className="rtk-message-header">
                <Bell size={16} />
                <span>Auto-generated message to <strong>{complaint.sender}</strong></span>
              </div>
              <textarea
                className="rtk-textarea message"
                value={userMessage}
                onChange={e => setUserMessage(e.target.value)}
                rows={14}
              />
              <p className="rtk-message-hint">You can edit this message before resolving.</p>
            </div>
          )}

          {/* ── DRIVER WARNING TAB ── */}
          {activeTab === 'driver-warning' && (
            <div className="rtk-message-tab">
              <div className="rtk-message-header warning">
                <AlertTriangle size={16} />
                <span>Formal warning notice for <strong>{complaint.driver}</strong></span>
              </div>
              <textarea
                className="rtk-textarea message"
                value={driverWarning}
                onChange={e => setDriverWarning(e.target.value)}
                rows={16}
              />
              <p className="rtk-message-hint">This notice will be added to the driver's official record.</p>
            </div>
          )}
        </div>

        {/* Confirm Step */}
        {confirmStep && (
          <div className="rtk-confirm">
            <div className="rtk-confirm-title"><CheckCircle size={16} /> Confirm Resolution</div>
            <div className="rtk-confirm-summary">
              <div>Actions: <strong>{[...autoActions, ...selectedActions.filter(a => !a.auto)].map(a => a.label).join(', ') || 'None'}</strong></div>
              <div>Driver at fault: <strong>{driverAtFault ? 'Yes — Finance notified' : 'No'}</strong></div>
              <div>Evidence files: <strong>{evidenceFiles.length}</strong></div>
            </div>
            <div className="rtk-confirm-actions">
              <button className="rtk-btn secondary" onClick={() => setConfirmStep(false)}>Back</button>
              <button className="rtk-btn resolve" onClick={confirmResolve}>
                <CheckCircle size={15} /> Confirm & Resolve
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        {!confirmStep && (
          <div className="rtk-footer">
            <button className="rtk-btn secondary" onClick={onClose}>Cancel</button>
            <button className="rtk-btn resolve" onClick={handleResolve}>
              <ChevronRight size={15} /> Resolve Complaint
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
