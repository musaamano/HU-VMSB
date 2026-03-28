import { useState, useEffect } from 'react';
import './ALPRCamera.css';

const ALPRCamera = () => {
  const [isDetecting, setIsDetecting] = useState(false);
  const [detectedPlate, setDetectedPlate] = useState(null);
  const [detectionHistory, setDetectionHistory] = useState([]);
  const [autoDetect, setAutoDetect] = useState(false);

  // Mock vehicle database
  const vehicleDatabase = [
    {
      plateNumber: 'HU-2045',
      vehicleName: 'Toyota Hilux',
      vehicleType: 'Pickup Truck',
      driver: 'John Smith',
      department: 'Engineering',
      ownership: 'University Vehicle',
      status: 'active'
    },
    {
      plateNumber: 'HU-3021',
      vehicleName: 'Isuzu D-Max',
      vehicleType: 'Pickup Truck',
      driver: 'Sarah Johnson',
      department: 'Agriculture',
      ownership: 'University Vehicle',
      status: 'active'
    },
    {
      plateNumber: 'HU-1567',
      vehicleName: 'Toyota Land Cruiser',
      vehicleType: 'SUV',
      driver: 'Mike Wilson',
      department: 'Administration',
      ownership: 'University Vehicle',
      status: 'active'
    },
    {
      plateNumber: 'AA-1234-ET',
      vehicleName: 'Honda Civic',
      vehicleType: 'Sedan',
      driver: 'Unknown',
      department: 'N/A',
      ownership: 'External Vehicle',
      status: 'unknown'
    }
  ];

  const simulateDetection = () => {
    setIsDetecting(true);

    // Simulate detection delay
    setTimeout(() => {
      // Randomly select a vehicle from database
      const randomVehicle = vehicleDatabase[Math.floor(Math.random() * vehicleDatabase.length)];

      const detection = {
        ...randomVehicle,
        detectionTime: new Date().toLocaleString(),
        confidence: (Math.random() * (99 - 85) + 85).toFixed(1) + '%'
      };

      setDetectedPlate(detection);
      setDetectionHistory(prev => [detection, ...prev].slice(0, 5));
      setIsDetecting(false);
    }, 2000);
  };

  const handleStartDetection = () => {
    simulateDetection();
  };

  const handleStopDetection = () => {
    setIsDetecting(false);
  };

  const handleAllowEntry = () => {
    const timestamp = new Date().toLocaleString();
    alert(`✅ ENTRY APPROVED\n\nPlate: ${detectedPlate.plateNumber}\nVehicle: ${detectedPlate.vehicleName}\nDriver: ${detectedPlate.driver}\nTime: ${timestamp}\n\nVehicle granted entry to campus.`);
    setDetectedPlate(null);
  };

  const handleAllowExit = () => {
    const timestamp = new Date().toLocaleString();
    alert(`✅ EXIT APPROVED\n\nPlate: ${detectedPlate.plateNumber}\nVehicle: ${detectedPlate.vehicleName}\nDriver: ${detectedPlate.driver}\nTime: ${timestamp}\n\nVehicle exit recorded.`);
    setDetectedPlate(null);
  };

  const handleReject = () => {
    const timestamp = new Date().toLocaleString();
    alert(`❌ ACCESS REJECTED\n\nPlate: ${detectedPlate.plateNumber}\nVehicle: ${detectedPlate.vehicleName}\nReason: Unauthorized vehicle\nTime: ${timestamp}\n\nSecurity has been notified.`);
    setDetectedPlate(null);
  };

  const handleClearResult = () => {
    setDetectedPlate(null);
  };

  const toggleAutoDetect = () => {
    setAutoDetect(!autoDetect);
    if (!autoDetect) {
      alert('🤖 Auto-detection enabled\n\nCamera will automatically scan for vehicles every 20 seconds.');
    } else {
      alert('⏸️ Auto-detection disabled');
    }
  };

  // Auto-detection feature
  useEffect(() => {
    if (autoDetect && !isDetecting && !detectedPlate) {
      const interval = setInterval(() => {
        simulateDetection();
      }, 20000); // Auto-detect every 20 seconds

      return () => clearInterval(interval);
    }
  }, [autoDetect, isDetecting, detectedPlate]);

  return (
    <div className="alpr-camera-page">
      <div className="gate-page-header">
        <h2>ALPR Camera Detection</h2>
        <p>Automatic License Plate Recognition System</p>
      </div>

      <div className="alpr-camera-layout">
        {/* Left Side - Camera Preview */}
        <div className="camera-section">
          <div className="camera-preview-box">
            <div className="camera-overlay">
              <div className="camera-grid">
                <div className="grid-line horizontal"></div>
                <div className="grid-line horizontal"></div>
                <div className="grid-line vertical"></div>
                <div className="grid-line vertical"></div>
              </div>

              {isDetecting && (
                <div className="scanning-animation">
                  <div className="scan-line"></div>
                  <p className="scanning-text">Scanning for license plates...</p>
                </div>
              )}

              {!isDetecting && !detectedPlate && (
                <div className="camera-placeholder">
                  <span className="camera-icon">📷</span>
                  <p>Camera Feed - Gate Entrance</p>
                  <p className="camera-status">Ready to detect</p>
                </div>
              )}

              {detectedPlate && (
                <div className="detection-overlay">
                  <div className="detected-plate-box">
                    <div className="plate-highlight">{detectedPlate.plateNumber}</div>
                    <p className="confidence-score">Confidence: {detectedPlate.confidence}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="camera-controls">
            <button
              className="gate-btn-primary"
              onClick={handleStartDetection}
              disabled={isDetecting}
            >
              <span>▶️</span> Start Detection
            </button>
            <button
              className="gate-btn-secondary"
              onClick={handleStopDetection}
              disabled={!isDetecting}
            >
              <span>⏹️</span> Stop Detection
            </button>
            <button
              className={`gate-btn-auto ${autoDetect ? 'active' : ''}`}
              onClick={toggleAutoDetect}
            >
              <span>🤖</span> {autoDetect ? 'Auto: ON' : 'Auto: OFF'}
            </button>
          </div>

          {/* Detection History */}
          {detectionHistory.length > 0 && (
            <div className="detection-history">
              <h4>Recent Detections</h4>
              <div className="history-list">
                {detectionHistory.map((item, index) => (
                  <div key={index} className="history-item">
                    <span className="history-plate">{item.plateNumber}</span>
                    <span className="history-time">{item.detectionTime}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Side - Detection Result */}
        <div className="detection-result-section">
          {detectedPlate ? (
            <div className="detection-result-card">
              <div className="result-header">
                <h3>Detection Result</h3>
                <button className="btn-close-result" onClick={handleClearResult}>×</button>
              </div>

              <div className="result-plate-display">
                <div className="plate-visual">
                  {detectedPlate.plateNumber}
                </div>
                <p className="detection-confidence">Confidence: {detectedPlate.confidence}</p>
              </div>

              <div className="result-details">
                <div className="result-row">
                  <span className="result-label">Plate Number:</span>
                  <span className="result-value">{detectedPlate.plateNumber}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Vehicle Name:</span>
                  <span className="result-value">{detectedPlate.vehicleName}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Vehicle Type:</span>
                  <span className="result-value">{detectedPlate.vehicleType}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Driver:</span>
                  <span className="result-value">{detectedPlate.driver}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Department:</span>
                  <span className="result-value">{detectedPlate.department}</span>
                </div>
                <div className="result-row">
                  <span className="result-label">Ownership Status:</span>
                  <span className={`ownership-badge ${detectedPlate.ownership === 'University Vehicle' ? 'university' : 'external'}`}>
                    {detectedPlate.ownership}
                  </span>
                </div>
              </div>

              <div className={`status-indicator ${detectedPlate.ownership === 'University Vehicle' ? 'green' : 'red'}`}>
                <span className="status-icon">
                  {detectedPlate.ownership === 'University Vehicle' ? '✓' : '✗'}
                </span>
                <span className="status-text">
                  {detectedPlate.ownership === 'University Vehicle' ? 'Authorized Vehicle' : 'Unauthorized Vehicle'}
                </span>
              </div>

              <div className="result-actions">
                <button className="gate-btn-success" onClick={handleAllowEntry}>
                  <span>✓</span> Allow Entry
                </button>
                <button className="gate-btn-info" onClick={handleAllowExit}>
                  <span>→</span> Allow Exit
                </button>
                <button className="gate-btn-danger" onClick={handleReject}>
                  <span>✗</span> Reject
                </button>
              </div>
            </div>
          ) : (
            <div className="no-detection-placeholder">
              <span className="placeholder-icon">🔍</span>
              <p>No vehicle detected</p>
              <p className="placeholder-hint">Click "Start Detection" to scan for license plates</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ALPRCamera;
