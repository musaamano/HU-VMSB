import { useState } from 'react';
import './VehicleMovement.css';

const VehicleMovement = () => {
    const [movementType, setMovementType] = useState('entry');
    const [formData, setFormData] = useState({
        plateNumber: '',
        driverName: '',
        driverPhone: '',
        purpose: '',
        destination: '',
        passengers: '',
        notes: ''
    });

    const [todayMovements, setTodayMovements] = useState([
        {
            id: 1,
            plateNumber: 'HU-2045',
            vehicle: 'Toyota Hilux',
            driver: 'John Smith',
            type: 'Entry',
            entryTime: '2026-03-09 08:15:23',
            exitTime: null,
            duration: null,
            status: 'Inside Campus'
        },
        {
            id: 2,
            plateNumber: 'HU-3021',
            vehicle: 'Isuzu D-Max',
            driver: 'Sarah Johnson',
            type: 'Entry',
            entryTime: '2026-03-09 07:30:45',
            exitTime: '2026-03-09 16:20:12',
            duration: '8h 49m',
            status: 'Completed'
        },
        {
            id: 3,
            plateNumber: 'HU-1567',
            vehicle: 'Toyota Land Cruiser',
            driver: 'Mike Wilson',
            type: 'Entry',
            entryTime: '2026-03-09 06:45:30',
            exitTime: null,
            duration: null,
            status: 'Inside Campus'
        },
        {
            id: 4,
            plateNumber: 'HU-4532',
            vehicle: 'Nissan Patrol',
            driver: 'David Lee',
            type: 'Entry',
            entryTime: '2026-03-09 09:10:15',
            exitTime: '2026-03-09 11:30:45',
            duration: '2h 20m',
            status: 'Completed'
        }
    ]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        if (!formData.plateNumber.trim() || !formData.driverName.trim()) {
            alert('Please fill in required fields');
            return;
        }

        const currentTime = new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        alert(`Vehicle Movement Registered\n\nPlate: ${formData.plateNumber}\nDriver: ${formData.driverName}\nType: ${movementType.toUpperCase()}\nTime: ${currentTime}\n\nRecorded successfully!`);

        // Reset form
        setFormData({
            plateNumber: '',
            driverName: '',
            driverPhone: '',
            purpose: '',
            destination: '',
            passengers: '',
            notes: ''
        });
    };

    const getStatusBadge = (status) => {
        const statusClass = status === 'Inside Campus' ? 'inside' : 'completed';
        return <span className={`movement-status-badge ${statusClass}`}>{status}</span>;
    };

    const getTypeBadge = (type) => {
        const typeClass = type.toLowerCase();
        return <span className={`movement-type-badge ${typeClass}`}>{type}</span>;
    };

    const handleRegisterExit = (movement) => {
        const exitTime = new Date().toLocaleString('en-GB', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit'
        });

        // Calculate duration
        const entryDate = new Date(movement.entryTime);
        const exitDate = new Date();
        const durationMs = exitDate - entryDate;
        const hours = Math.floor(durationMs / (1000 * 60 * 60));
        const minutes = Math.floor((durationMs % (1000 * 60 * 60)) / (1000 * 60));
        const duration = `${hours}h ${minutes}m`;

        // Update movement
        setTodayMovements(prev => prev.map(m =>
            m.id === movement.id
                ? { ...m, exitTime, duration, status: 'Completed' }
                : m
        ));

        alert(`✅ EXIT REGISTERED\n\nPlate: ${movement.plateNumber}\nDriver: ${movement.driver}\nEntry: ${movement.entryTime}\nExit: ${exitTime}\nDuration: ${duration}`);
    };

    return (
        <div className="vehicle-movement-page">
            <div className="gate-page-header">
                <h2>Vehicle Movement Registration</h2>
                <p>Record vehicle entry and exit times manually</p>
            </div>

            <div className="movement-layout">
                {/* Registration Form */}
                <div className="movement-form-section">
                    <div className="movement-type-selector">
                        <button
                            className={`type-btn ${movementType === 'entry' ? 'active' : ''}`}
                            onClick={() => setMovementType('entry')}
                        >
                            <span className="type-icon">→</span>
                            <span>Entry</span>
                        </button>
                        <button
                            className={`type-btn ${movementType === 'exit' ? 'active' : ''}`}
                            onClick={() => setMovementType('exit')}
                        >
                            <span className="type-icon">←</span>
                            <span>Exit</span>
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="movement-form">
                        <div className="form-section">
                            <h3>Vehicle & Driver Information</h3>
                            <div className="form-group">
                                <label>Plate Number *</label>
                                <input
                                    type="text"
                                    name="plateNumber"
                                    value={formData.plateNumber}
                                    onChange={handleInputChange}
                                    placeholder="e.g., HU-2045"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Driver Name *</label>
                                <input
                                    type="text"
                                    name="driverName"
                                    value={formData.driverName}
                                    onChange={handleInputChange}
                                    placeholder="Enter driver's full name"
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Driver Phone</label>
                                <input
                                    type="tel"
                                    name="driverPhone"
                                    value={formData.driverPhone}
                                    onChange={handleInputChange}
                                    placeholder="e.g., +251912345678"
                                />
                            </div>
                        </div>

                        {movementType === 'entry' && (
                            <div className="form-section">
                                <h3>Trip Details</h3>
                                <div className="form-group">
                                    <label>Purpose of Visit</label>
                                    <input
                                        type="text"
                                        name="purpose"
                                        value={formData.purpose}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Official meeting, Delivery, etc."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Destination (on campus)</label>
                                    <input
                                        type="text"
                                        name="destination"
                                        value={formData.destination}
                                        onChange={handleInputChange}
                                        placeholder="e.g., Administration Building, Library, etc."
                                    />
                                </div>

                                <div className="form-group">
                                    <label>Number of Passengers</label>
                                    <input
                                        type="number"
                                        name="passengers"
                                        value={formData.passengers}
                                        onChange={handleInputChange}
                                        placeholder="0"
                                        min="0"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="form-section">
                            <h3>Additional Notes</h3>
                            <div className="form-group">
                                <label>Notes</label>
                                <textarea
                                    name="notes"
                                    value={formData.notes}
                                    onChange={handleInputChange}
                                    placeholder="Any additional information..."
                                    rows="3"
                                />
                            </div>
                        </div>

                        <div className="timestamp-display">
                            <span className="timestamp-label">Registration Time:</span>
                            <span className="timestamp-value">{new Date().toLocaleString()}</span>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="gate-btn-primary">
                                <span>✓</span> Register {movementType === 'entry' ? 'Entry' : 'Exit'}
                            </button>
                            <button
                                type="button"
                                className="gate-btn-secondary"
                                onClick={() => setFormData({
                                    plateNumber: '',
                                    driverName: '',
                                    driverPhone: '',
                                    purpose: '',
                                    destination: '',
                                    passengers: '',
                                    notes: ''
                                })}
                            >
                                <span>↺</span> Clear Form
                            </button>
                        </div>
                    </form>
                </div>

                {/* Today's Movements */}
                <div className="movements-list-section">
                    <h3>Today's Vehicle Movements</h3>

                    <div className="movements-stats">
                        <div className="stat-item">
                            <span className="stat-value">{todayMovements.filter(m => m.status === 'Inside Campus').length}</span>
                            <span className="stat-label">Inside Campus</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{todayMovements.filter(m => m.status === 'Completed').length}</span>
                            <span className="stat-label">Completed</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-value">{todayMovements.length}</span>
                            <span className="stat-label">Total Today</span>
                        </div>
                    </div>

                    <div className="movements-list">
                        {todayMovements.map((movement) => (
                            <div key={movement.id} className="movement-card">
                                <div className="movement-card-header">
                                    <span className="movement-plate">{movement.plateNumber}</span>
                                    {getStatusBadge(movement.status)}
                                </div>
                                <div className="movement-card-body">
                                    <div className="movement-info">
                                        <span className="info-label">Vehicle:</span>
                                        <span className="info-value">{movement.vehicle}</span>
                                    </div>
                                    <div className="movement-info">
                                        <span className="info-label">Driver:</span>
                                        <span className="info-value">{movement.driver}</span>
                                    </div>
                                    <div className="movement-info">
                                        <span className="info-label">Entry Time:</span>
                                        <span className="info-value">{movement.entryTime}</span>
                                    </div>
                                    {movement.exitTime && (
                                        <>
                                            <div className="movement-info">
                                                <span className="info-label">Exit Time:</span>
                                                <span className="info-value">{movement.exitTime}</span>
                                            </div>
                                            <div className="movement-info">
                                                <span className="info-label">Duration:</span>
                                                <span className="info-value">{movement.duration}</span>
                                            </div>
                                        </>
                                    )}
                                </div>
                                {movement.status === 'Inside Campus' && (
                                    <button
                                        className="register-exit-btn"
                                        onClick={() => handleRegisterExit(movement)}
                                    >
                                        Register Exit
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VehicleMovement;
