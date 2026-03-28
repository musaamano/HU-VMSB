import React, { useState, useEffect } from 'react';
import { getCurrentUser } from '../../api/api';
import { useNavigate } from 'react-router-dom';
import './RequestStatus.css';

const BASE = '/api';
const authReq = async (url) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, { headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const STATUS_COLORS = {
  pending:    { bg: '#fef3c7', color: '#92400e', label: 'Pending' },
  approved:   { bg: '#d1fae5', color: '#065f46', label: 'Approved' },
  rejected:   { bg: '#fee2e2', color: '#991b1b', label: 'Rejected' },
  cancelled:  { bg: '#f3f4f6', color: '#6b7280', label: 'Cancelled' },
  assigned:   { bg: '#dbeafe', color: '#1e40af', label: 'Assigned' },
  accepted:   { bg: '#e0e7ff', color: '#3730a3', label: 'Accepted' },
  started:    { bg: '#fef3c7', color: '#92400e', label: 'In Progress' },
  completed:  { bg: '#dbeafe', color: '#1e40af', label: 'Completed' },
};

const PRIORITY_COLORS = {
  emergency: '#dc2626', high: '#f59e0b', normal: '#3b82f6', low: '#22c55e',
};

const getProgressSteps = (status) => [
  { name: 'Submitted',    done: true },
  { name: 'Under Review', done: ['approved', 'rejected', 'cancelled', 'assigned', 'accepted', 'started', 'completed'].includes(status) },
  { name: 'Decision',     done: ['approved', 'rejected', 'cancelled', 'assigned', 'accepted', 'started', 'completed'].includes(status) },
  { name: 'Completed',    done: status === 'completed' },
];

const RequestStatus = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    authReq(`${BASE}/user/requests`)
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(err => console.error('Failed to load requests:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: '#6b7280' }}>Loading your requests...</div>
  );

  return (
    <div className="request-status-page">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 className="page-title" style={{ margin: 0 }}>My Requests</h1>
        <button className="btn-primary" onClick={() => navigate('/user/request-vehicle')}>
          + New Request
        </button>
      </div>

      {requests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">🚗</span>
          <h3>No Requests Yet</h3>
          <p>You haven't submitted any vehicle requests yet.</p>
          <button className="btn-primary" onClick={() => navigate('/user/request-vehicle')}>
            Submit Your First Request
          </button>
        </div>
      ) : (
        <div className="requests-container">
          {requests.map(req => {
            const st = STATUS_COLORS[req.status] || STATUS_COLORS.pending;
            const steps = getProgressSteps(req.status);
            const doneCount = steps.filter(s => s.done).length;
            const isExpanded = expanded === req._id;

            return (
              <div key={req._id} className="request-status-card">
                {/* Header */}
                <div className="request-header" style={{ background: st.bg, borderLeft: `4px solid ${st.color}` }}>
                  <div className="request-header-left">
                    <div>
                      <h2 className="request-id" style={{ color: st.color }}>
                        {req.purpose}
                      </h2>
                      <p className="request-purpose" style={{ color: '#6b7280', fontSize: 13 }}>
                        {req.destination} · {req.scheduledTime ? new Date(req.scheduledTime).toLocaleDateString() : '—'} · {req.passengerCount} passenger{req.passengerCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <span style={{
                      background: PRIORITY_COLORS[req.priority] + '22',
                      color: PRIORITY_COLORS[req.priority],
                      padding: '3px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600,
                    }}>
                      {req.priority?.toUpperCase()}
                    </span>
                    <span className={`status-badge`} style={{ background: st.color, color: '#fff', padding: '4px 12px', borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                      {st.label}
                    </span>
                    <button
                      onClick={() => setExpanded(isExpanded ? null : req._id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: '#6b7280' }}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{ padding: '14px 20px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 0, position: 'relative' }}>
                    {steps.map((step, i) => (
                      <React.Fragment key={i}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: i < steps.length - 1 ? 1 : 0 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%',
                            background: step.done ? '#22c55e' : '#e5e7eb',
                            color: step.done ? '#fff' : '#9ca3af',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 13, fontWeight: 700, zIndex: 1,
                          }}>
                            {step.done ? '✓' : i + 1}
                          </div>
                          <span style={{ fontSize: 11, color: step.done ? '#15803d' : '#9ca3af', marginTop: 4, whiteSpace: 'nowrap' }}>
                            {step.name}
                          </span>
                        </div>
                        {i < steps.length - 1 && (
                          <div style={{
                            flex: 1, height: 3, marginBottom: 18,
                            background: steps[i + 1].done ? '#22c55e' : '#e5e7eb',
                          }} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="request-details-section" style={{ padding: '16px 20px 20px' }}>
                    <div className="details-grid">
                      <div className="detail-item"><span className="detail-icon">🚗</span><span className="detail-text">{req.vehicleType || 'Any'}</span></div>
                      <div className="detail-item"><span className="detail-icon">📅</span><span className="detail-text">{req.scheduledTime ? new Date(req.scheduledTime).toLocaleString() : '—'}</span></div>
                      <div className="detail-item"><span className="detail-icon">📍</span><span className="detail-text">{req.destination}</span></div>
                      <div className="detail-item"><span className="detail-icon">🚏</span><span className="detail-text">From: {req.pickupLocation}</span></div>
                      <div className="detail-item"><span className="detail-icon">👥</span><span className="detail-text">{req.passengerCount} Passenger(s)</span></div>
                    </div>

                    {/* Transport Officer Response */}
                    {req.status === 'approved' && (
                      <div style={{ marginTop: 16, padding: '14px 16px', borderRadius: 10, background: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                        <div style={{ fontWeight: 700, color: '#15803d', marginBottom: 8 }}>✅ Approved by Transport Officer</div>
                        {req.assignedVehicle && (
                          <div style={{ fontSize: 13, color: '#374151' }}>🚌 Vehicle: <strong>{req.assignedVehicle.plateNumber} — {req.assignedVehicle.model}</strong></div>
                        )}
                        {req.assignedDriver && (
                          <div style={{ fontSize: 13, color: '#374151', marginTop: 4 }}>👨‍✈️ Driver: <strong>{req.assignedDriver.name}</strong></div>
                        )}
                      </div>
                    )}

                    {req.status === 'cancelled' && (
                      <div style={{
                        marginTop: 16, padding: '14px 16px', borderRadius: 10,
                        background: '#f9fafb', border: '1px solid #e5e7eb',
                      }}>
                        <div style={{ fontWeight: 700, color: '#6b7280', marginBottom: 6 }}>❌ Trip Cancelled</div>
                        {req.rejectionReason && (
                          <div style={{ fontSize: 13, color: '#374151' }}>Reason: {req.rejectionReason}</div>
                        )}
                        <div style={{ fontSize: 13, color: '#6b7280', marginTop: 4 }}>
                          This trip has been cancelled by the transport officer.
                        </div>
                        <button
                          onClick={() => navigate('/user/request-vehicle')}
                          style={{
                            marginTop: 10, padding: '7px 16px', borderRadius: 8,
                            background: '#3b82f6', color: '#fff', border: 'none',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Submit New Request
                        </button>
                      </div>
                    )}

                    {req.status === 'rejected' && (
                      <div style={{
                        marginTop: 16, padding: '14px 16px', borderRadius: 10,
                        background: '#fef2f2', border: '1px solid #fecaca',
                      }}>
                        <div style={{ fontWeight: 700, color: '#991b1b', marginBottom: 6 }}>❌ Request Rejected</div>
                        {req.rejectionReason && (
                          <div style={{ fontSize: 13, color: '#374151' }}>Reason: {req.rejectionReason}</div>
                        )}
                        <button
                          onClick={() => navigate('/user/request-vehicle')}
                          style={{
                            marginTop: 10, padding: '7px 16px', borderRadius: 8,
                            background: '#3b82f6', color: '#fff', border: 'none',
                            fontSize: 13, fontWeight: 600, cursor: 'pointer',
                          }}
                        >
                          Submit New Request
                        </button>
                      </div>
                    )}

                    {req.status === 'pending' && (
                      <div style={{
                        marginTop: 16, padding: '12px 16px', borderRadius: 10,
                        background: '#fffbeb', border: '1px solid #fde68a',
                        fontSize: 13, color: '#92400e',
                      }}>
                        ⏳ Waiting for transport officer review. You'll see the decision here once processed.
                      </div>
                    )}

                    {req.notes && (
                      <div style={{ marginTop: 12 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: '#6b7280', marginBottom: 4 }}>NOTES</div>
                        <p style={{ fontSize: 13, color: '#374151', margin: 0 }}>{req.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default RequestStatus;
