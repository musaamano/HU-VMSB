import { useState } from 'react';
import './UserProfile.css';

const UserProfile = () => {
  const [activeTab, setActiveTab] = useState('personal');
  const [profileData, setProfileData] = useState({
    // Personal Information
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    department: 'Engineering',
    employeeId: 'EMP-001',
    
    // Address
    address: '123 Main Street',
    city: 'New York',
    state: 'NY',
    zipCode: '10001',
    
    // Password
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    
    // Profile Picture
    profilePicture: null
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setProfileData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleProfilePictureChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfileData(prev => ({
          ...prev,
          profilePicture: reader.result
        }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePersonalInfoSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!profileData.firstName) newErrors.firstName = 'First name is required';
    if (!profileData.lastName) newErrors.lastName = 'Last name is required';
    if (!profileData.email) newErrors.email = 'Email is required';
    if (!profileData.phone) newErrors.phone = 'Phone is required';
    
    if (Object.keys(newErrors).length === 0) {
      alert('Personal information updated successfully!');
    } else {
      setErrors(newErrors);
    }
  };

  const handlePasswordSubmit = (e) => {
    e.preventDefault();
    const newErrors = {};
    
    if (!profileData.currentPassword) newErrors.currentPassword = 'Current password is required';
    if (!profileData.newPassword) newErrors.newPassword = 'New password is required';
    if (!profileData.confirmPassword) newErrors.confirmPassword = 'Confirm password is required';
    if (profileData.newPassword !== profileData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (profileData.newPassword && profileData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (Object.keys(newErrors).length === 0) {
      alert('Password changed successfully!');
      setProfileData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));
    } else {
      setErrors(newErrors);
    }
  };

  return (
    <div className="user-profile-page">
      <h1 className="profile-page-title">My Account</h1>
      
      <div className="profile-container">
        {/* Profile Header with Picture */}
        <div className="profile-header">
          <div className="profile-picture-section">
            <div className="profile-picture">
              {profileData.profilePicture ? (
                <img src={profileData.profilePicture} alt="Profile" />
              ) : (
                <span className="profile-initials">
                  {profileData.firstName[0]}{profileData.lastName[0]}
                </span>
              )}
            </div>
            <input
              type="file"
              id="profilePictureInput"
              accept="image/*"
              onChange={handleProfilePictureChange}
              style={{ display: 'none' }}
            />
            <button
              type="button"
              className="btn-upload-picture"
              onClick={() => document.getElementById('profilePictureInput').click()}
            >
              Change Picture
            </button>
          </div>
          <div className="profile-header-info">
            <h2>{profileData.firstName} {profileData.lastName}</h2>
            <p className="profile-email">{profileData.email}</p>
            <p className="profile-department">{profileData.department} • {profileData.employeeId}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'personal' ? 'active' : ''}`}
            onClick={() => setActiveTab('personal')}
          >
            <span>👤</span> Personal Information
          </button>
          <button
            className={`profile-tab ${activeTab === 'password' ? 'active' : ''}`}
            onClick={() => setActiveTab('password')}
          >
            <span>🔒</span> Change Password
          </button>
          <button
            className={`profile-tab ${activeTab === 'preferences' ? 'active' : ''}`}
            onClick={() => setActiveTab('preferences')}
          >
            <span>⚙️</span> Preferences
          </button>
        </div>

        {/* Tab Content */}
        <div className="profile-content">
          {/* Personal Information Tab */}
          {activeTab === 'personal' && (
            <form onSubmit={handlePersonalInfoSubmit} className="profile-form">
              <h3 className="section-title">Personal Information</h3>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">First Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="firstName"
                    value={profileData.firstName}
                    onChange={handleChange}
                    className={`form-input ${errors.firstName ? 'error' : ''}`}
                  />
                  {errors.firstName && <p className="error-message">{errors.firstName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Last Name <span className="required">*</span></label>
                  <input
                    type="text"
                    name="lastName"
                    value={profileData.lastName}
                    onChange={handleChange}
                    className={`form-input ${errors.lastName ? 'error' : ''}`}
                  />
                  {errors.lastName && <p className="error-message">{errors.lastName}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Email <span className="required">*</span></label>
                  <input
                    type="email"
                    name="email"
                    value={profileData.email}
                    onChange={handleChange}
                    className={`form-input ${errors.email ? 'error' : ''}`}
                  />
                  {errors.email && <p className="error-message">{errors.email}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Phone <span className="required">*</span></label>
                  <input
                    type="tel"
                    name="phone"
                    value={profileData.phone}
                    onChange={handleChange}
                    className={`form-input ${errors.phone ? 'error' : ''}`}
                  />
                  {errors.phone && <p className="error-message">{errors.phone}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    name="department"
                    value={profileData.department}
                    onChange={handleChange}
                    className="form-input"
                    disabled
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Employee ID</label>
                  <input
                    type="text"
                    name="employeeId"
                    value={profileData.employeeId}
                    onChange={handleChange}
                    className="form-input"
                    disabled
                  />
                </div>
              </div>

              <h3 className="section-title">Address</h3>
              
              <div className="form-grid">
                <div className="form-group full-width">
                  <label className="form-label">Street Address</label>
                  <input
                    type="text"
                    name="address"
                    value={profileData.address}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    type="text"
                    name="city"
                    value={profileData.city}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">State</label>
                  <input
                    type="text"
                    name="state"
                    value={profileData.state}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Zip Code</label>
                  <input
                    type="text"
                    name="zipCode"
                    value={profileData.zipCode}
                    onChange={handleChange}
                    className="form-input"
                  />
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">Save Changes</button>
              </div>
            </form>
          )}

          {/* Change Password Tab */}
          {activeTab === 'password' && (
            <form onSubmit={handlePasswordSubmit} className="profile-form">
              <h3 className="section-title">Change Password</h3>
              
              <div className="form-grid-single">
                <div className="form-group">
                  <label className="form-label">Current Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={profileData.currentPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.currentPassword ? 'error' : ''}`}
                  />
                  {errors.currentPassword && <p className="error-message">{errors.currentPassword}</p>}
                </div>

                <div className="form-group">
                  <label className="form-label">New Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="newPassword"
                    value={profileData.newPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.newPassword ? 'error' : ''}`}
                  />
                  {errors.newPassword && <p className="error-message">{errors.newPassword}</p>}
                  <p className="input-hint">Password must be at least 8 characters long</p>
                </div>

                <div className="form-group">
                  <label className="form-label">Confirm New Password <span className="required">*</span></label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={profileData.confirmPassword}
                    onChange={handleChange}
                    className={`form-input ${errors.confirmPassword ? 'error' : ''}`}
                  />
                  {errors.confirmPassword && <p className="error-message">{errors.confirmPassword}</p>}
                </div>
              </div>

              <div className="form-actions">
                <button type="submit" className="btn-submit">Change Password</button>
              </div>
            </form>
          )}

          {/* Preferences Tab */}
          {activeTab === 'preferences' && (
            <div className="profile-form">
              <h3 className="section-title">Notification Preferences</h3>
              
              <div className="preference-item">
                <div className="preference-info">
                  <h4>Email Notifications</h4>
                  <p>Receive email updates about your requests</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <h4>Request Status Updates</h4>
                  <p>Get notified when your request status changes</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="preference-item">
                <div className="preference-info">
                  <h4>Complaint Updates</h4>
                  <p>Receive updates on your submitted complaints</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" defaultChecked />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <h3 className="section-title">Display Preferences</h3>

              <div className="preference-item">
                <div className="preference-info">
                  <h4>Dark Mode</h4>
                  <p>Use dark theme for the interface</p>
                </div>
                <label className="toggle-switch">
                  <input type="checkbox" />
                  <span className="toggle-slider"></span>
                </label>
              </div>

              <div className="form-actions">
                <button type="button" className="btn-submit" onClick={() => alert('Preferences saved!')}>
                  Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfile;
