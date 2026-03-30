import { useState } from 'react';
import './VehicleInspection.css';

const VehicleInspection = () => {
    const [plateNumber, setPlateNumber] = useState('');
    const [direction, setDirection] = useState('entry');
    const [inspectionData, setInspectionData] = useState({
        exteriorCondition: '',
        interiorCleanliness: '',
        tiresCondition: '',
        lightsWorking: '',
        windshieldCondition: '',
        mirrorsCondition: '',
        fuelLevel: '',
        odometerReading: '',
        damageNotes: '',
        cleanlinessNotes: '',
        safetyIssues: ''
    });

    const [inspectionHistory] = useState([
        {
            id: 1,
            plateNumber: 'HU-2045',
            vehicle: 'Toyota Hilux',
            direction: 'Entry',
            timestamp: '2026-03-08 09:15:23',
            inspector: 'Officer A',
            overallStatus: 'Good',
            issues: 'None'
        },
        {
            id: 2,
            plateNumber: 'HU-3021',
            vehicle: 'Isuzu D-Max',
            direction: 'Exit',
            timestamp: '2026-03-08 09:08:12',
            inspector: 'Officer B',
            overallStatus: 'Fair',
            issues: 'Minor scratch on rear bumper'
        },
        {
            id: 3,
            plateNumber: 'HU-1567',
            vehicle: 'Toyota Land Cruiser',
            direction: 'Entry',
            timestamp: '2026-03-08 09:05:34',
            inspector: 'Officer A',
            overallStatus: 'Excellent',
            issues: 'None'
        }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setInspectionData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!plateNumber.trim()) {
            alert('Please enter a plate number');
            return;
        }

        // Check if all required fields are filled
        const requiredFields = ['exteriorCondition', 'interiorCleanliness', 'tiresCondition', 'lightsWorking', 'windshieldCondition', 'mirrorsCondition'];
        const missingFields = requiredFields.filter(field => !inspectionData[field]);

        if (missingFields.length > 0) {
            alert('Please complete all inspection checkpoints');
            return;
        }

        alert(`Inspection completed for ${plateNumber}\nDirection: ${direction}\nStatus: Recorded successfully`);

        // Reset form
        setPlateNumber('');
        setDirection('entry');
        setInspectionData({
            exteriorCondition: '',
            interiorCleanliness: '',
            tiresCondition: '',
            lightsWorking: '',
            windshieldCondition: '',
            mirrorsCondition: '',
            fuelLevel: '',
            odometerReading: '',
            damageNotes: '',
            cleanlinessNotes: '',
            safetyIssues: ''
        });
    };

    const getStatusBadge = (status) => {
        const statusMap = {
            'Excellent': 'excellent',
            'Good': 'good',
            'Fair': 'fair',
            'Poor': 'poor'
        };
        return <span className={`inspection-status-badge ${statusMap[status]}`}>{status}</span>;
    };

    return (
        <div className="vehicle-inspection-page">
            <div className="gate-page-header">
                <h2>Vehicle Condition Inspection</h2>
                <p>Inspect vehicle condition, cleanliness, and safety before entry/exit</p>
            </div>

            <div className="inspection-layout">
                {/* Inspection Form */}
                <div className="inspection-form-section">
                    <form onSubmit={handleSubmit} className="inspection-form">
                        {/* Basic Information */}
                        <div className="form-section">
                            <h3>Basic Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Plate Number *</label>
                                    <input
                                        type="text"
                                        value={plateNumber}
                                        onChange={(e) => setPlateNumber(e.target.value)}
                                        placeholder="e.g., HU-2045"
                                        required
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Direction *</label>
                                    <select value={direction} onChange={(e) => setDirection(e.target.value)} required>
                                        <option value="entry">Entry</option>
                                        <option value="exit">Exit</option>
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Exterior Condition */}
                        <div className="form-section">
                            <h3>Exterior Condition</h3>
                            <div className="form-group">
                                <label>Overall Exterior Condition *</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="exteriorCondition"
                                            value="Excellent"
                                            checked={inspectionData.exteriorCondition === 'Excellent'}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <span>Excellent</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="exteriorCondition"
                                            value="Good"
                                            checked={inspectionData.exteriorCondition === 'Good'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Good</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="exteriorCondition"
                                            value="Fair"
                                            checked={inspectionData.exteriorCondition === 'Fair'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Fair</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="exteriorCondition"
                                            value="Poor"
                                            checked={inspectionData.exteriorCondition === 'Poor'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Poor</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Damage Notes (if any)</label>
                                <textarea
                                    name="damageNotes"
                                    value={inspectionData.damageNotes}
                                    onChange={handleInputChange}
                                    placeholder="Describe any scratches, dents, or damage..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        {/* Interior Cleanliness */}
                        <div className="form-section">
                            <h3>Interior Cleanliness</h3>
                            <div className="form-group">
                                <label>Interior Cleanliness *</label>
                                <div className="radio-group">
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="interiorCleanliness"
                                            value="Excellent"
                                            checked={inspectionData.interiorCleanliness === 'Excellent'}
                                            onChange={handleInputChange}
                                            required
                                        />
                                        <span>Excellent</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="interiorCleanliness"
                                            value="Good"
                                            checked={inspectionData.interiorCleanliness === 'Good'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Good</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="interiorCleanliness"
                                            value="Fair"
                                            checked={inspectionData.interiorCleanliness === 'Fair'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Fair</span>
                                    </label>
                                    <label className="radio-label">
                                        <input
                                            type="radio"
                                            name="interiorCleanliness"
                                            value="Poor"
                                            checked={inspectionData.interiorCleanliness === 'Poor'}
                                            onChange={handleInputChange}
                                        />
                                        <span>Poor</span>
                                    </label>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Cleanliness Notes</label>
                                <textarea
                                    name="cleanlinessNotes"
                                    value={inspectionData.cleanlinessNotes}
                                    onChange={handleInputChange}
                                    placeholder="Note any cleanliness issues..."
                                    rows="2"
                                />
                            </div>
                        </div>

                        {/* Safety Checks */}
                        <div className="form-section">
                            <h3>Safety Checks</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Tires Condition *</label>
                                    <select
                                        name="tiresCondition"
                                        value={inspectionData.tiresCondition}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="Good">Good</option>
                                        <option value="Fair">Fair</option>
                                        <option value="Needs Replacement">Needs Replacement</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Lights Working *</label>
                                    <select
                                        name="lightsWorking"
                                        value={inspectionData.lightsWorking}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="All Working">All Working</option>
                                        <option value="Some Issues">Some Issues</option>
                                        <option value="Not Working">Not Working</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Windshield Condition *</label>
                                    <select
                                        name="windshieldCondition"
                                        value={inspectionData.windshieldCondition}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="Clear">Clear</option>
                                        <option value="Minor Cracks">Minor Cracks</option>
                                        <option value="Needs Repair">Needs Repair</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Mirrors Condition *</label>
                                    <select
                                        name="mirrorsCondition"
                                        value={inspectionData.mirrorsCondition}
                                        onChange={handleInputChange}
                                        required
                                    >
                                        <option value="">Select...</option>
                                        <option value="All Good">All Good</option>
                                        <option value="Damaged">Damaged</option>
                                        <option value="Missing">Missing</option>
                                    </select>
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Safety Issues</label>
                                <textarea
                                    name="safetyIssues"
                                    value={inspectionData.safetyIssues}
                                    onChange={handleInputChange}
                                    placeholder="Note any safety concerns..."
                                    rows="2"
                                />
                            </div>
                        </div>

                        {/* Additional Information */}
                        <div className="form-section">
                            <h3>Additional Information</h3>
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Fuel Level</label>
                                    <select
                                        name="fuelLevel"
                                        value={inspectionData.fuelLevel}
                                        onChange={handleInputChange}
                                    >
                                        <option value="">Select...</option>
                                        <option value="Full">Full</option>
                                        <option value="3/4">3/4</option>
                                        <option value="1/2">1/2</option>
                                        <option value="1/4">1/4</option>
                                        <option value="Empty">Empty</option>
                                    </select>
                                </div>

                                <div className="form-group">
                                    <label>Odometer Reading (km)</label>
                                    <input
                                        type="number"
                                        name="odometerReading"
                                        value={inspectionData.odometerReading}
                                        onChange={handleInputChange}
                                        placeholder="e.g., 45230"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="form-actions">
                            <button type="submit" className="gate-btn-primary">
                                <span>✓</span> Complete Inspection
                            </button>
                            <button type="button" className="gate-btn-secondary" onClick={() => {
                                setPlateNumber('');
                                setDirection('entry');
                                setInspectionData({
                                    exteriorCondition: '',
                                    interiorCleanliness: '',
                                    tiresCondition: '',
                                    lightsWorking: '',
                                    windshieldCondition: '',
                                    mirrorsCondition: '',
                                    fuelLevel: '',
                                    odometerReading: '',
                                    damageNotes: '',
                                    cleanlinessNotes: '',
                                    safetyIssues: ''
                                });
                            }}>
                                <span>↺</span> Reset Form
                            </button>
                        </div>
                    </form>
                </div>

                {/* Recent Inspections */}
                <div className="inspection-history-section">
                    <h3>Recent Inspections</h3>
                    <div className="inspection-history-list">
                        {inspectionHistory.map((inspection) => (
                            <div key={inspection.id} className="inspection-history-card">
                                <div className="history-card-header">
                                    <span className="history-plate">{inspection.plateNumber}</span>
                                    {getStatusBadge(inspection.overallStatus)}
                                </div>
                                <div className="history-card-body">
                                    <div className="history-info">
                                        <span className="history-label">Vehicle:</span>
                                        <span className="history-value">{inspection.vehicle}</span>
                                    </div>
                                    <div className="history-info">
                                        <span className="history-label">Direction:</span>
                                        <span className="history-value">{inspection.direction}</span>
                                    </div>
                                    <div className="history-info">
                                        <span className="history-label">Inspector:</span>
                                        <span className="history-value">{inspection.inspector}</span>
                                    </div>
                                    <div className="history-info">
                                        <span className="history-label">Time:</span>
                                        <span className="history-value">{inspection.timestamp}</span>
                                    </div>
                                    {inspection.issues !== 'None' && (
                                        <div className="history-issues">
                                            <span className="issues-label">Issues:</span>
                                            <span className="issues-text">{inspection.issues}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleInspection;
