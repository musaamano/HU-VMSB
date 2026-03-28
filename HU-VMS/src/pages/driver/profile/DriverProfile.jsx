import { useState, useEffect } from 'react';
import './DriverProfile.css';

const DriverProfile = () => {
    const [editing, setEditing] = useState(false);
    const [saved, setSaved] = useState(false);
    const [profileImage, setProfileImage] = useState(null);
    const [profileData, setProfileData] = useState({
        name: 'Ahmed Hassan',
        email: 'ahmed.hassan@university.edu',
        phone: '+1 234 567 8900',
        employeeId: 'DRV-001',
        licenseNumber: 'DL-123456789',
        address: '123 Main Street, City, State',
        emergencyContact: '+1 234 567 8901',
        emergencyName: 'Contact Person'
    });

    // Load saved profile image on component mount
    useEffect(() => {
        const savedImage = localStorage.getItem('driverProfileImage');
        if (savedImage) {
            setProfileImage(savedImage);
        }
    }, []);

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            // Check file size (max 2MB)
            if (file.size > 2 * 1024 * 1024) {
                alert('Image size should be less than 2MB');
                return;
            }

            const reader = new FileReader();
            reader.onloadend = () => {
                const imageData = reader.result;
                setProfileImage(imageData);
                // Save to localStorage
                localStorage.setItem('driverProfileImage', imageData);
                // Dispatch custom event to notify other components
                window.dispatchEvent(new Event('profileImageUpdated'));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleChange = (e) => {
        setProfileData({
            ...profileData,
            [e.target.name]: e.target.value
        });
    };

    const handleSave = () => {
        setEditing(false);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const getInitials = () => {
        return profileData.name.split(' ').map(n => n[0]).join('');
    };

    return (
        <div className="driver-profile">
            <div className="page-header">
                <h2>My Profile</h2>
                <p>Manage your personal information and settings</p>
            </div>

            {saved && (
                <div className="success-message">
                    ✓ Profile updated successfully!
                </div>
            )}

            <div className="profile-container">
                <div className="profile-card">
                    <div className="profile-header">
                        <div className="avatar-section">
                            <div className="avatar-display">
                                {profileImage ? (
                                    <img src={profileImage} alt={profileData.name} />
                                ) : (
                                    <div className="avatar-placeholder">
                                        {getInitials()}
                                    </div>
                                )}
                            </div>
                            <label className="upload-button">
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                />
                                <span className="upload-icon">📷</span>
                            </label>
                        </div>

                        <div className="profile-info">
                            <h3 className="profile-name">{profileData.name}</h3>
                            <p className="profile-role">Driver</p>
                            <span className="profile-id">{profileData.employeeId}</span>
                        </div>
                    </div>

                    {!editing ? (
                        <>
                            <div className="profile-details">
                                <div className="detail-item">
                                    <div className="detail-label">Email Address</div>
                                    <div className="detail-value">{profileData.email}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Phone Number</div>
                                    <div className="detail-value">{profileData.phone}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">License Number</div>
                                    <div className="detail-value">{profileData.licenseNumber}</div>
                                </div>

                                <div className="detail-item">
                                    <div className="detail-label">Address</div>
                                    <div className="detail-value">{profileData.address}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Emergency Contact</div>
                                    <div className="detail-value">{profileData.emergencyName}</div>
                                </div>
                                <div className="detail-item">
                                    <div className="detail-label">Emergency Phone</div>
                                    <div className="detail-value">{profileData.emergencyContact}</div>
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-edit" onClick={() => setEditing(true)}>
                                    Edit Profile
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="edit-form">
                            <div className="form-row">
                                <div className="form-group">
                                    <label>Full Name</label>
                                    <input type="text" name="name" value={profileData.name} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Email Address</label>
                                    <input type="email" name="email" value={profileData.email} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Phone Number</label>
                                    <input type="tel" name="phone" value={profileData.phone} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>License Number</label>
                                    <input type="text" name="licenseNumber" value={profileData.licenseNumber} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-group">
                                <label>Address</label>
                                <input type="text" name="address" value={profileData.address} onChange={handleChange} />
                            </div>

                            <div className="form-row">
                                <div className="form-group">
                                    <label>Emergency Contact Name</label>
                                    <input type="text" name="emergencyName" value={profileData.emergencyName} onChange={handleChange} />
                                </div>
                                <div className="form-group">
                                    <label>Emergency Contact Phone</label>
                                    <input type="tel" name="emergencyContact" value={profileData.emergencyContact} onChange={handleChange} />
                                </div>
                            </div>

                            <div className="form-actions">
                                <button className="btn-save" onClick={handleSave}>Save Changes</button>
                                <button className="btn-cancel" onClick={() => setEditing(false)}>Cancel</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DriverProfile;
