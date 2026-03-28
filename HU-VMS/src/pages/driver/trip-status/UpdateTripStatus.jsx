import { useState } from 'react';
import driverService from '../../../services/driverService';
import './UpdateTripStatus.css';

const UpdateTripStatus = ({ trip, onUpdate }) => {
  const [updating, setUpdating]   = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [showCancel, setShowCancel]     = useState(false);
  const [toast, setToast] = useState('');

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3000); };

  const handleStatus = async (status) => {
    setUpdating(true);
    try {
      await driverService.updateTripStatus(trip._id, status);
      notify(`Status updated to: ${status}`);
      if (onUpdate) onUpdate();
    } catch (err) {
      notify('Failed: ' + err.message);
    } finally { setUpdating(false); }
  };

  const handleCancel = async () => {
    if (!cancelReason.trim()) { notify('Please provide a reason.'); return; }
    setUpdating(true);
    try {
      await driverService.rejectTrip(trip._id, cancelReason);
      setShowCancel(false);
      if (onUpdate) onUpdate();
    } catch (err) {
      notify('Failed: ' + err.message);
    } finally { setUpdating(false); }
  };

  const actions = {
    assigned: [{ label: 'Accept Trip', status: 'accepted', icon: '✓' }],
    accepted: [
      { label: 'Start Trip', status: 'started', icon: '🚀' },
      { label: 'Cancel', action: () => setShowCancel(true), icon: '❌' },
    ],
    started: [{ label: 'Complete Trip', status: 'completed', icon: '✅' }],
  }[trip.status] || [];

  return (
    <div className="update-trip-status">
      {toast && (
        <div style={{ background: '#1e293b', color: '#fff', padding: '10px 16px', borderRadius: 8, marginBottom: 12, fontSize: 13 }}>
          {toast}
        </div>
      )}

      <h2>Update Trip Status</h2>

      <div className="current-trip-info">
        <h3>Trip #{trip.tripId || trip._id?.slice(-6).toUpperCase()}</h3>
        <p><strong>Status:</strong> <span className={`status ${trip.status}`}>{trip.status}</span></p>
        <p><strong>From:</strong> {trip.pickupLocation}</p>
        <p><strong>To:</strong> {trip.destination}</p>
        <p><strong>Scheduled:</strong> {trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleString() : '—'}</p>
        {trip.assignedVehicle && (
          <p><strong>Vehicle:</strong> {trip.assignedVehicle.plateNumber} — {trip.assignedVehicle.model}</p>
        )}
      </div>

      {showCancel ? (
        <div className="cancel-form">
          <h4>Cancel Trip</h4>
          <textarea value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Enter cancellation reason..." rows={4} />
          <div className="form-actions">
            <button onClick={handleCancel} disabled={updating} className="btn-danger">Confirm Cancel</button>
            <button onClick={() => setShowCancel(false)} className="btn-secondary">Back</button>
          </div>
        </div>
      ) : (
        <div className="status-actions">
          {actions.map((action, i) => (
            <button key={i}
              onClick={() => action.status ? handleStatus(action.status) : action.action()}
              disabled={updating}
              className="status-btn">
              <span className="icon">{action.icon}</span>
              {updating && action.status ? 'Updating...' : action.label}
            </button>
          ))}
          {actions.length === 0 && (
            <p style={{ color: '#94a3b8', fontSize: 14 }}>No actions available for status: {trip.status}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default UpdateTripStatus;
