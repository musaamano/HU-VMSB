import { useState, useEffect } from 'react';
import driverService from '../../../services/driverService';
import VehicleIssueReport from '../vehicle-report/VehicleIssueReport';
import './VehicleInfo.css';

const VehicleInfo = () => {
  const [vehicle, setVehicle]         = useState(null);
  const [showReport, setShowReport]   = useState(false);
  const [loading, setLoading]         = useState(true);

  const loadVehicleInfo = async () => {
    try {
      const data = await driverService.getVehicleInfo();
      setVehicle(data);
    } catch (err) {
      console.error('Failed to load vehicle info:', err);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadVehicleInfo(); }, []);

  if (loading) return <div className="loading">Loading vehicle info...</div>;
  if (!vehicle) return <div className="no-data">No vehicle assigned to you yet.</div>;

  const fuelLevel = vehicle.fuelLevel ?? 0;
  const isFuelLow = fuelLevel < 20;

  const nextMaint = vehicle.nextMaintenanceDue ? new Date(vehicle.nextMaintenanceDue) : null;
  const daysUntilMaint = nextMaint ? Math.ceil((nextMaint - Date.now()) / 86400000) : null;
  const isMaintDue = daysUntilMaint !== null && daysUntilMaint <= 7;

  return (
    <div className="vehicle-info">
      <h2>My Vehicle</h2>

      <div className="vehicle-card">
        <div className="vehicle-header">
          <h3>{vehicle.model}</h3>
          <span className="vehicle-id">{vehicle.plateNumber}</span>
        </div>

        <div className="vehicle-details">
          <div className="detail-row">
            <span>Vehicle ID:</span>
            <strong>{vehicle.vehicleId}</strong>
          </div>
          <div className="detail-row">
            <span>Type:</span>
            <strong>{vehicle.type}</strong>
          </div>
          <div className="detail-row">
            <span>Fuel Type:</span>
            <strong>{vehicle.fuelType}</strong>
          </div>
          <div className="detail-row">
            <span>Fuel Level:</span>
            <div className="fuel-indicator">
              <div className={`fuel-bar ${isFuelLow ? 'low' : ''}`} style={{ width: `${fuelLevel}%` }} />
              <span>{fuelLevel}%</span>
            </div>
          </div>
          {isFuelLow && <div className="warning">⚠️ Low fuel — request a refill</div>}

          <div className="detail-row">
            <span>Odometer:</span>
            <strong>{vehicle.odometer?.toLocaleString()} km</strong>
          </div>
          <div className="detail-row">
            <span>Status:</span>
            <strong>{vehicle.status}</strong>
          </div>
          {vehicle.lastMaintenance && (
            <div className="detail-row">
              <span>Last Maintenance:</span>
              <strong>{new Date(vehicle.lastMaintenance).toLocaleDateString()}</strong>
            </div>
          )}
          {nextMaint && (
            <div className="detail-row">
              <span>Next Maintenance:</span>
              <strong className={isMaintDue ? 'warning-text' : ''}>
                {nextMaint.toLocaleDateString()} {daysUntilMaint !== null && `(${daysUntilMaint}d)`}
              </strong>
            </div>
          )}
          {isMaintDue && <div className="warning">⚠️ Maintenance due soon</div>}
        </div>

        <button onClick={() => setShowReport(true)} className="btn-report-issue">
          🔧 Report Issue
        </button>
      </div>

      {showReport && (
        <VehicleIssueReport
          vehicleId={vehicle._id}
          onClose={() => setShowReport(false)}
          onSubmit={loadVehicleInfo}
        />
      )}
    </div>
  );
};

export default VehicleInfo;
