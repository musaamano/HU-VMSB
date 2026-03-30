import { useState, useEffect } from 'react';
import './FuelStationProfile.css';

const FuelStationProfile = () => {
    const [profileData, setProfileData] = useState({
        fullName: 'Sarah Mohammed',
        employeeId: 'FS-2024-001',
        role: 'Fuel Station Officer',
        fuelStationName: 'Main Campus Fuel Station',
        phoneNumber: '+251-911-345678',
        email: 'sarah.mohammed@university.edu.et',
        profilePhoto: null,
        shiftStart: '08:00',
        shiftEnd: '16:00',
        joinDate: '2024-02-01',
        totalFuelDispensed: 15420,
        monthlyFuelDispensed: 2340,
        lastLogin: '2026-03-09 09:15:00'
    });

    const [isEditing, setIsEditing] = useState(false);
    const [editData, setEditData] = useState({ ...profileData });

    // Load saved profile photo on component mount
    useEffect(() => {
        const savedProfilePhoto = localStorage.getItem('fuelStationProfilePhoto');
        if (savedProfilePhoto) {
            setProfileData(prev => ({
                ...prev,
                profilePhoto: savedProfilePhoto
            }));
            setEditData(prev => ({
                ...prev,
                profilePhoto: savedProfilePhoto
            }));
        } else {
            // Set a default profile photo for demonstration
            const defaultPhoto = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMDAiIGhlaWdodD0iMTAwIiByeD0iNTAiIGZpbGw9IiM4YjVjZjYiLz4KPHN2ZyB4PSIyNSIgeT0iMjAiIHdpZHRoPSI1MCIgaGVpZ2h0PSI2MCIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJ3aGl0ZSI+CjxwYXRoIGQ9Ik0xMiAyQzEzLjEgMiAxNCAyLjkgMTQgNEMxNCA1LjEgMTMuMSA2IDEyIDZDMTAuOSA2IDEwIDUuMSAxMCA0QzEwIDIuOSAxMC45IDIgMTIgMlpNMjEgOVYyMkgzVjlDMyA4IDQgNyA1IDdIMTlDMjAgNyAyMSA4IDIxIDlaIi8+Cjwvc3ZnPgo8L3N2Zz4K';
            setProfileData(prev => ({
                ...prev,
                profilePhoto: defaultPhoto
            }));
            setEditData(prev => ({
                ...prev,
                profilePhoto: defaultPhoto
            }));
            localStorage.setItem('fuelStationProfilePhoto', defaultPhoto);

            // Notify the header about the default photo
            window.dispatchEvent(new CustomEvent('fuelProfilePhotoUpdated', {
                detail: { profilePhoto: defaultPhoto }
            }));
        }
    }, []);

    const handleEdit = () => {
        setIsEditing(true);
        setEditData({ ...profileData });
    };

    const handleSave = () => {
        setProfileData({ ...editData });

        // Save profile photo to localStorage
        if (editData.profilePhoto) {
            localStorage.setItem('fuelStationProfilePhoto', editData.profilePhoto);

            // Dispatch custom event to notify other components
            window.dispatchEvent(new CustomEvent('fuelProfilePhotoUpdated', {
                detail: { profilePhoto: editData.profilePhoto }
            }));
        }

        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditData({ ...profileData });
        setIsEditing(false);
    };

    const handleInputChange = (field, value) => {
        setEditData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handlePhotoUpload = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const photoData = e.target.result;
                setEditData(prev => ({
                    ...prev,
                    profilePhoto: photoData
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    return (
        <div className="fuel-profile-container">
            <div className="fuel-profile-header">
                <div className="fuel-profile-title">
                    <h2>⛽ Fuel Station Profile</h2>
                    <p>Fuel Officer Information & Account Management</p>
                </div>
                {!isEditing ? (
                    <button className="fuel-btn-edit" onClick={handleEdit}>
                        <span>✏️</span> Edit Profile
                    </button>
                ) : (
                    <div className="fuel-edit-actions">
                        <button className="fuel-btn-save" onClick={handleSave}>
                            <span>💾</span> Save
                        </button>
                        <button className="fuel-btn-cancel" onClick={handleCancel}>
                            <span>❌</span> Cancel
                        </button>
                    </div>
                )}
            </div>

            <div className="fuel-profile-content">
                {/* Profile Photo Section */}
                <div className="fuel-profile-photo-section">
                    <div className="fuel-profile-photo">
                        {profileData.profilePhoto ? (
                            <img src={profileData.profilePhoto} alt="Profile" />
                        ) : (
                            <div className="fuel-profile-photo-placeholder">
                                <span>👤</span>
                            </div>
                        )}
                    </div>
                    {isEditing && (
                        <div className="fuel-photo-upload">
                            <input
                                type="file"
                                id="fuelPhotoUpload"
                                accept="image/*"
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                            />
                            <label htmlFor="fuelPhotoUpload" className="fuel-photo-upload-btn">
                                <span>📷</span> Upload Photo
                            </label>
                        </div>
                    )}
                </div>

                {/* Profile Information */}
                <div className="fuel-profile-info-grid">
                    {/* Personal Information */}
                    <div className="fuel-info-section">
                        <h3>👤 Personal Information</h3>
                        <div className="fuel-info-grid">
                            <div className="fuel-info-item">
                                <label>Full Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.fullName}
                                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.fullName}</span>
                                )}
                            </div>

                            <div className="fuel-info-item">
                                <label>Employee ID</label>
                                <span className="fuel-info-value fuel-readonly">{profileData.employeeId}</span>
                            </div>

                            <div className="fuel-info-item">
                                <label>Role</label>
                                <span className="fuel-info-value fuel-readonly">{profileData.role}</span>
                            </div>

                            <div className="fuel-info-item">
                                <label>Fuel Station Name</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        value={editData.fuelStationName}
                                        onChange={(e) => handleInputChange('fuelStationName', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.fuelStationName}</span>
                                )}
                            </div>

                            <div className="fuel-info-item">
                                <label>Phone Number</label>
                                {isEditing ? (
                                    <input
                                        type="tel"
                                        value={editData.phoneNumber}
                                        onChange={(e) => handleInputChange('phoneNumber', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.phoneNumber}</span>
                                )}
                            </div>

                            <div className="fuel-info-item">
                                <label>Email (Optional)</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        value={editData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.email}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Work Information */}
                    <div className="fuel-info-section">
                        <h3>💼 Work Information</h3>
                        <div className="fuel-info-grid">
                            <div className="fuel-info-item">
                                <label>Shift Start</label>
                                {isEditing ? (
                                    <input
                                        type="time"
                                        value={editData.shiftStart}
                                        onChange={(e) => handleInputChange('shiftStart', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.shiftStart}</span>
                                )}
                            </div>

                            <div className="fuel-info-item">
                                <label>Shift End</label>
                                {isEditing ? (
                                    <input
                                        type="time"
                                        value={editData.shiftEnd}
                                        onChange={(e) => handleInputChange('shiftEnd', e.target.value)}
                                        className="fuel-input"
                                    />
                                ) : (
                                    <span className="fuel-info-value">{profileData.shiftEnd}</span>
                                )}
                            </div>

                            <div className="fuel-info-item">
                                <label>Join Date</label>
                                <span className="fuel-info-value fuel-readonly">{profileData.joinDate}</span>
                            </div>

                            <div className="fuel-info-item">
                                <label>Last Login</label>
                                <span className="fuel-info-value fuel-readonly">{profileData.lastLogin}</span>
                            </div>
                        </div>
                    </div>

                    {/* Performance Statistics */}
                    <div className="fuel-info-section">
                        <h3>📊 Performance Statistics</h3>
                        <div className="fuel-stats-grid">
                            <div className="fuel-stat-card">
                                <div className="fuel-stat-icon">⛽</div>
                                <div className="fuel-stat-info">
                                    <span className="fuel-stat-number">{profileData.totalFuelDispensed.toLocaleString()}L</span>
                                    <span className="fuel-stat-label">Total Fuel Dispensed</span>
                                </div>
                            </div>

                            <div className="fuel-stat-card">
                                <div className="fuel-stat-icon">📅</div>
                                <div className="fuel-stat-info">
                                    <span className="fuel-stat-number">{profileData.monthlyFuelDispensed.toLocaleString()}L</span>
                                    <span className="fuel-stat-label">This Month</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Information Notice */}
                <div className="fuel-profile-notice">
                    <div className="fuel-notice-icon">ℹ️</div>
                    <div className="fuel-notice-content">
                        <h4>Why This Information is Needed</h4>
                        <ul>
                            <li><strong>Fuel Officer Identification:</strong> To identify which officer dispensed fuel to vehicles</li>
                            <li><strong>Accountability & Tracking:</strong> To provide accountability and fuel distribution tracking</li>
                            <li><strong>Authentication:</strong> To allow secure login and system access</li>
                            <li><strong>Station Management:</strong> To manage fuel station operations and officer assignments</li>
                            <li><strong>Performance Monitoring:</strong> To track fuel dispensing performance and efficiency</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuelStationProfile;