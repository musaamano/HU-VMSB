import { useState } from 'react';
import './VehicleVerification.css';

const VehicleVerification = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResult, setSearchResult] = useState(null);

  // Mock vehicle database
  const vehicleDatabase = [
    {
      plateNumber: 'HU-2045',
      vehicleModel: 'Toyota Hilux 2022',
      department: 'Engineering',
      assignedDriver: 'John Smith',
      fuelType: 'Diesel',
      status: 'Active',
      registrationDate: '2022-05-15',
      lastMaintenance: '2026-02-20',
      mileage: '45,230 km'
    },
    {
      plateNumber: 'HU-3021',
      vehicleModel: 'Isuzu D-Max 2021',
      department: 'Agriculture',
      assignedDriver: 'Sarah Johnson',
      fuelType: 'Diesel',
      status: 'Active',
      registrationDate: '2021-08-10',
      lastMaintenance: '2026-01-15',
      mileage: '67,890 km'
    },
    {
      plateNumber: 'HU-1567',
      vehicleModel: 'Toyota Land Cruiser 2023',
      department: 'Administration',
      assignedDriver: 'Mike Wilson',
      fuelType: 'Petrol',
      status: 'Active',
      registrationDate: '2023-01-20',
      lastMaintenance: '2026-03-01',
      mileage: '23,450 km'
    },
    {
      plateNumber: 'HU-4532',
      vehicleModel: 'Nissan Patrol 2020',
      department: 'Security',
      assignedDriver: 'David Lee',
      fuelType: 'Diesel',
      status: 'Maintenance',
      registrationDate: '2020-11-05',
      lastMaintenance: '2026-03-05',
      mileage: '89,120 km'
    }
  ];

  const handleSearch = (e) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      alert('Please enter a plate number');
      return;
    }

    const result = vehicleDatabase.find(
      vehicle => vehicle.plateNumber.toLowerCase() === searchQuery.toLowerCase()
    );

    if (result) {
      setSearchResult(result);
    } else {
      setSearchResult({ notFound: true });
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResult(null);
  };

  const getStatusBadge = (status) => {
    const statusClass = status?.toLowerCase();
    return <span className={`gate-status-badge ${statusClass}`}>{status}</span>;
  };

  const handleAuthorizeEntry = () => {
    const timestamp = new Date().toLocaleString();
    alert(`✅ ENTRY AUTHORIZED\n\nPlate: ${searchResult.plateNumber}\nVehicle: ${searchResult.vehicleModel}\nDriver: ${searchResult.assignedDriver}\nTime: ${timestamp}\n\nVehicle has been granted entry to campus.`);

    // Log the entry
    console.log('Entry authorized:', {
      plate: searchResult.plateNumber,
      time: timestamp,
      officer: 'Gate Officer'
    });
  };

  const handleViewDetails = () => {
    const details = `
VEHICLE DETAILS
═══════════════════════════════════

Plate Number: ${searchResult.plateNumber}
Vehicle Model: ${searchResult.vehicleModel}
Department: ${searchResult.department}
Assigned Driver: ${searchResult.assignedDriver}
Fuel Type: ${searchResult.fuelType}
Status: ${searchResult.status}

REGISTRATION INFO
═══════════════════════════════════
Registration Date: ${searchResult.registrationDate}
Last Maintenance: ${searchResult.lastMaintenance}
Current Mileage: ${searchResult.mileage}
    `;
    alert(details);
  };

  return (
    <div className="vehicle-verification-page">
      <div className="gate-page-header">
        <h2>Vehicle Verification</h2>
        <p>Search and verify vehicle information by plate number</p>
      </div>

      {/* Search Bar */}
      <div className="verification-search-container">
        <form onSubmit={handleSearch} className="verification-search-form">
          <div className="search-input-group">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder="Enter plate number (e.g., HU-2045)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="verification-search-input"
            />
            {searchQuery && (
              <button
                type="button"
                className="search-clear-btn"
                onClick={handleClearSearch}
              >
                ×
              </button>
            )}
          </div>
          <button type="submit" className="gate-btn-primary">
            Search Vehicle
          </button>
        </form>
      </div>

      {/* Search Result */}
      {searchResult && (
        <div className="verification-result-container">
          {searchResult.notFound ? (
            <div className="vehicle-not-found">
              <span className="not-found-icon">❌</span>
              <h3>Vehicle Not Found</h3>
              <p>No vehicle found with plate number: <strong>{searchQuery}</strong></p>
              <p className="not-found-hint">This vehicle is not registered in the university system</p>
              <button className="gate-btn-secondary" onClick={handleClearSearch}>
                Search Again
              </button>
            </div>
          ) : (
            <div className="vehicle-info-card">
              <div className="vehicle-card-header">
                <div className="vehicle-plate-display">
                  {searchResult.plateNumber}
                </div>
                {getStatusBadge(searchResult.status)}
              </div>

              <div className="vehicle-info-grid">
                <div className="info-section">
                  <h4>Vehicle Information</h4>
                  <div className="info-row">
                    <span className="info-label">Plate Number:</span>
                    <span className="info-value">{searchResult.plateNumber}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Vehicle Model:</span>
                    <span className="info-value">{searchResult.vehicleModel}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Fuel Type:</span>
                    <span className="info-value">{searchResult.fuelType}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Registration Date:</span>
                    <span className="info-value">{searchResult.registrationDate}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Assignment Details</h4>
                  <div className="info-row">
                    <span className="info-label">Department:</span>
                    <span className="info-value">{searchResult.department}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Assigned Driver:</span>
                    <span className="info-value">{searchResult.assignedDriver}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Status:</span>
                    <span className="info-value">{searchResult.status}</span>
                  </div>
                </div>

                <div className="info-section">
                  <h4>Maintenance Information</h4>
                  <div className="info-row">
                    <span className="info-label">Last Maintenance:</span>
                    <span className="info-value">{searchResult.lastMaintenance}</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Current Mileage:</span>
                    <span className="info-value">{searchResult.mileage}</span>
                  </div>
                </div>
              </div>

              <div className="vehicle-card-actions">
                <button className="gate-btn-success" onClick={handleAuthorizeEntry}>
                  <span>✓</span> Authorize Entry
                </button>
                <button className="gate-btn-info" onClick={handleViewDetails}>
                  <span>📋</span> View Full Details
                </button>
                <button className="gate-btn-secondary" onClick={handleClearSearch}>
                  <span>🔍</span> Search Another
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Access Vehicles */}
      {!searchResult && (
        <div className="quick-access-section">
          <h3>Quick Access - Recent Vehicles</h3>
          <div className="quick-access-grid">
            {vehicleDatabase.slice(0, 4).map((vehicle) => (
              <div
                key={vehicle.plateNumber}
                className="quick-access-card"
                onClick={() => {
                  setSearchQuery(vehicle.plateNumber);
                  setSearchResult(vehicle);
                }}
              >
                <div className="quick-plate">{vehicle.plateNumber}</div>
                <div className="quick-model">{vehicle.vehicleModel}</div>
                <div className="quick-driver">{vehicle.assignedDriver}</div>
                {getStatusBadge(vehicle.status)}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleVerification;
