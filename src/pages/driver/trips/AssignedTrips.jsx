import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import './AssignedTrips.css';

const STATUS_COLOR = {
  assigned: '#6366f1', accepted: '#3b82f6', started: '#22c55e',
};

const AssignedTrips = ({ onTripUpdate }) => {
  const [trips, setTrips]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing]   = useState(null);
  const [toast, setToast]     = useState('');

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadTrips = async () => {
    try {
      const data = await driverService.getAssignedTrips();
      setTrips(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load trips:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadTrips(); }, []);

  const handleAccept = async (tripId) => {
    setActing(tripId);
    try {
      await driverService.acceptTrip(tripId);
      notify('Trip accepted.');
      loadTrips();
      if (onTripUpdate) onTripUpdate();
    } catch (err) {
      notify('Failed to accept: ' + err.message);
    } finally { setActing(null); }
  };

  const handleReject = async (tripId) => {
    const reason = prompt('Reason for rejection:');
    if (!reason) return;
    setActing(tripId);
    try {
      await driverService.rejectTrip(tripId, reason);
      notify('Trip rejected.');
      loadTrips();
      if (onTripUpdate) onTripUpdate();
    } catch (err) {
      notify('Failed to reject: ' + err.message);
    } finally { setActing(null); }
  };

  const handleStart = async (tripId) => {
    setActing(tripId);
    try {
      await driverService.updateTripStatus(tripId, 'started');
      notify('Trip started.');
      loadTrips();
      if (onTripUpdate) onTripUpdate();
    } catch (err) {
      notify('Failed: ' + err.message);
    } finally { setActing(null); }
  };

  const handleComplete = async (tripId) => {
    setActing(tripId);
    try {
      await driverService.updateTripStatus(tripId, 'completed');
      notify('Trip completed.');
      loadTrips();
      if (onTripUpdate) onTripUpdate();
    } catch (err) {
      notify('Failed: ' + err.message);
    } finally { setActing(null); }
  };

  if (loading) return <div className="loading">Loading trips...</div>;

  return (
    <div className="assigned-trips">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <h2>Assigned Trips</h2>

      {trips.length === 0 ? (
        <p className="no-trips">No trips currently assigned to you.</p>
      ) : (
        <div className="trips-list">
          {trips.map(trip => (
            <div key={trip._id} className={`trip-card ${trip.status}`}>
              <div className="trip-header">
                <span className="trip-id">Trip #{trip.tripId || trip._id.slice(-6).toUpperCase()}</span>
                <span className="trip-status" style={{ background: `${STATUS_COLOR[trip.status]}22`, color: STATUS_COLOR[trip.status] }}>
                  {trip.status}
                </span>
              </div>

              <div className="trip-details">
                <div className="trip-info">
                  <p><strong>From:</strong> {trip.pickupLocation}</p>
                  <p><strong>To:</strong> {trip.destination}</p>
                  <p><strong>Scheduled:</strong> {trip.scheduledTime ? new Date(trip.scheduledTime).toLocaleString() : '—'}</p>
                  <p><strong>Purpose:</strong> {trip.purpose || '—'}</p>
                  <p><strong>Passengers:</strong> {trip.passengerCount}</p>
                  {trip.assignedVehicle && (
                    <p><strong>Vehicle:</strong> {trip.assignedVehicle.plateNumber} — {trip.assignedVehicle.model}</p>
                  )}
                </div>

                <div className="trip-actions">
                  {trip.status === 'assigned' && (
                    <>
                      <button onClick={() => handleAccept(trip._id)} disabled={acting === trip._id} className="btn-accept">
                        {acting === trip._id ? '...' : '✓ Accept'}
                      </button>
                      <button onClick={() => handleReject(trip._id)} disabled={acting === trip._id} className="btn-reject">
                        ✗ Reject
                      </button>
                    </>
                  )}
                  {trip.status === 'accepted' && (
                    <button onClick={() => handleStart(trip._id)} disabled={acting === trip._id} className="btn-accept">
                      {acting === trip._id ? '...' : '🚀 Start Trip'}
                    </button>
                  )}
                  {trip.status === 'started' && (
                    <button onClick={() => handleComplete(trip._id)} disabled={acting === trip._id} className="btn-accept" style={{ background: '#22c55e' }}>
                      {acting === trip._id ? '...' : '✅ Complete Trip'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AssignedTrips;
