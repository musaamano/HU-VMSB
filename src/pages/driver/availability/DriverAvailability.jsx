import { useState } from 'react';
import driverService from '../../../services/driverService';
import './DriverAvailability.css';

const DriverAvailability = ({ currentStatus, onUpdate }) => {
    const [status, setStatus] = useState(currentStatus || 'available');
    const [updating, setUpdating] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);

    const statuses = [
        { value: 'available', label: 'Available', color: '#28a745' },
        { value: 'on-break', label: 'On Break', color: '#ffc107' },
        { value: 'off-duty', label: 'Off Duty', color: '#dc3545' },
        { value: 'on-trip', label: 'On Trip', color: '#17a2b8' }
    ];

    const currentStatusObj = statuses.find(s => s.value === status) || statuses[0];

    const handleStatusChange = async (newStatus) => {
        if (newStatus === status) {
            setShowDropdown(false);
            return;
        }

        setUpdating(true);
        try {
            await driverService.updateAvailability(newStatus);
            setStatus(newStatus);
            setShowDropdown(false);
            if (onUpdate) onUpdate();
        } catch (error) {
            console.error('Failed to update availability:', error);
            alert('Failed to update availability');
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="driver-availability-dropdown">
            <button
                className="status-dropdown-btn"
                onClick={() => setShowDropdown(!showDropdown)}
                disabled={updating}
            >
                <div className="status-circle-small" style={{ background: currentStatusObj.color }}></div>
                <span className="status-label">{currentStatusObj.label}</span>
                <span className="dropdown-arrow">{showDropdown ? '▲' : '▼'}</span>
            </button>

            {showDropdown && (
                <div className="status-dropdown-menu">
                    {statuses.map(s => (
                        <button
                            key={s.value}
                            className={`status-option ${status === s.value ? 'active' : ''}`}
                            onClick={() => handleStatusChange(s.value)}
                            disabled={updating}
                        >
                            <div className="status-circle-large" style={{ background: s.color }}>
                                <div className="circle-shine"></div>
                            </div>
                            <span className="option-label">{s.label}</span>
                            {status === s.value && <span className="check-mark">✓</span>}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};

export default DriverAvailability;
