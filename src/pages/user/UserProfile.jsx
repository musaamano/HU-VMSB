import { useState, useEffect } from 'react';
import { getCurrentUser } from '../../api/api';
import './UserProfile.css';

const UserProfile = () => {
    const currentUser = getCurrentUser();
    const [activeTab, setActiveTab] = useState('account');
    const [message, setMessage] = useState({ type: '', text: '' });

    // Build real defaults from the logged-in user (falls back to empty strings)
    const realAccountDefaults = {
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        employeeId: currentUser?.employeeId || currentUser?.username || '',
        phone: currentUser?.phone || '',
        department: currentUser?.department || '',
        role: currentUser?.role || '',
        emergencyContact: currentUser?.emergencyContact || ''
    };

    const defaultSettings = {
        account: realAccountDefaults,
        password: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: ''
        },
        security: {
            twoFactorAuth: false,
            loginNotifications: true,
            sessionTimeout: '30',
            allowedIPs: '',
            securityQuestion1: '',
            securityAnswer1: '',
            securityQuestion2: '',
            securityAnswer2: '',
            securityQuestion3: '',
            securityAnswer3: ''
        },
        notifications: {
            emailNotifications: true,
            smsNotifications: false,
            pushNotifications: true,
            requestStatusAlerts: true,
            complaintUpdates: true,
            systemMaintenance: true,
            emergencyAlerts: true,
            authorizationUpdates: true
        },
        system: {
            theme: 'light',
            language: 'en',
            timezone: 'Africa/Addis_Ababa',
            dateFormat: 'DD/MM/YYYY',
            timeFormat: '24-hour',
            autoLogout: '30',
            screenSaver: 'never',
            soundAlerts: true
        },
        privacy: {
            profileVisibility: 'organization',
            activityTracking: true,
            dataSharing: false,
            analyticsOptIn: true,
            locationTracking: true,
            cameraAccess: false,
            microphoneAccess: false
        }
    };

    // Load settings: prefer saved userSettings, but NEVER let stale data override the real employeeId
    const [accountSettings, setAccountSettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        if (saved) {
            const parsed = JSON.parse(saved);
            return {
                ...realAccountDefaults,
                ...parsed.account,
                // employeeId is read-only — always use the real user's ID
                employeeId: realAccountDefaults.employeeId
            };
        }
        return realAccountDefaults;
    });
    const [passwordSettings, setPasswordSettings] = useState(defaultSettings.password);
    const [securitySettings, setSecuritySettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved).security : defaultSettings.security;
    });
    const [notificationSettings, setNotificationSettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved).notifications : defaultSettings.notifications;
    });
    const [systemSettings, setSystemSettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved).system : defaultSettings.system;
    });
    const [privacySettings, setPrivacySettings] = useState(() => {
        const saved = localStorage.getItem('userSettings');
        return saved ? JSON.parse(saved).privacy : defaultSettings.privacy;
    });

    // profileDisplay always mirrors the REAL logged-in user — same source as the header
    const [profileDisplay, setProfileDisplay] = useState({
        name: currentUser?.name || '',
        email: currentUser?.email || '',
        employeeId: currentUser?.employeeId || currentUser?.username || '',
        avatar: localStorage.getItem('userProfileImage') || null
    });

    useEffect(() => {
        // Keep profile card in sync whenever account settings are saved
        const handleProfileUpdate = (e) => {
            if (e.detail) {
                setProfileDisplay(prev => ({ ...prev, ...e.detail }));
            }
        };
        window.addEventListener('userProfileUpdated', handleProfileUpdate);
        return () => window.removeEventListener('userProfileUpdated', handleProfileUpdate);
    }, []);

    const saveAllSettings = (updatedAccount = accountSettings, 
                             updatedSecurity = securitySettings, 
                             updatedNotifications = notificationSettings, 
                             updatedSystem = systemSettings, 
                             updatedPrivacy = privacySettings) => {
        const allSettings = {
            account: updatedAccount,
            security: updatedSecurity,
            notifications: updatedNotifications,
            system: updatedSystem,
            privacy: updatedPrivacy
        };
        localStorage.setItem('userSettings', JSON.stringify(allSettings));
    };

    const handleAccountChange = (e) => {
        const { name, value } = e.target;
        setAccountSettings(prev => ({ ...prev, [name]: value }));
    };

    const handlePasswordChange = (e) => {
        const { name, value } = e.target;
        setPasswordSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleSecurityChange = (e) => {
        const { name, value, type, checked } = e.target;
        setSecuritySettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleNotificationChange = (e) => {
        const { name, checked } = e.target;
        setNotificationSettings(prev => ({ ...prev, [name]: checked }));
    };

    const handleSystemChange = (e) => {
        const { name, value, type, checked } = e.target;
        const val = type === 'checkbox' ? checked : value;
        setSystemSettings(prev => ({ ...prev, [name]: val }));
        
        if (name === 'theme') {
            document.documentElement.setAttribute('data-theme', val);
            localStorage.setItem('appTheme', val);
        }
    };

    const handlePrivacyChange = (e) => {
        const { name, value, type, checked } = e.target;
        setPrivacySettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2000000) {
                setMessage({ type: 'error', text: 'Image is too large (max 2MB)' });
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64 = reader.result;
                setProfileDisplay(prev => ({ ...prev, avatar: base64 }));
                localStorage.setItem('userProfileImage', base64);
                window.dispatchEvent(new CustomEvent('profileImageUpdated', { detail: { image: base64 } }));
                setMessage({ type: 'success', text: 'Profile picture updated successfully!' });
                setTimeout(() => setMessage({ type: '', text: '' }), 3000);
            };
            reader.readAsDataURL(file);
        }
    };

    const validatePassword = (password) => {
        return {
            length: password.length >= 8,
            uppercase: /[A-Z]/.test(password),
            lowercase: /[a-z]/.test(password),
            number: /[0-9]/.test(password),
            special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
        };
    };

    const handleSaveAccount = () => {
        saveAllSettings();
        // Sync the localStorage user object so the header name/email update immediately
        const storedUser = getCurrentUser();
        if (storedUser) {
            const updatedUser = { ...storedUser, name: accountSettings.name, email: accountSettings.email };
            localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        // Notify UserLayout header to refresh
        window.dispatchEvent(new CustomEvent('userProfileUpdated', {
            detail: { name: accountSettings.name, email: accountSettings.email }
        }));
        setMessage({ type: 'success', text: 'Account settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSavePassword = () => {
        const validation = validatePassword(passwordSettings.newPassword);
        if (!Object.values(validation).every(Boolean)) {
            setMessage({ type: 'error', text: 'Please meet all password requirements.' });
            return;
        }
        if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
            setMessage({ type: 'error', text: 'New passwords do not match.' });
            return;
        }
        setMessage({ type: 'success', text: 'Password updated successfully!' });
        setPasswordSettings(defaultSettings.password);
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSaveSecurity = () => {
        saveAllSettings();
        setMessage({ type: 'success', text: 'Security settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSaveNotifications = () => {
        saveAllSettings();
        setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSaveSystem = () => {
        saveAllSettings();
        setMessage({ type: 'success', text: 'System settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleSavePrivacy = () => {
        saveAllSettings();
        setMessage({ type: 'success', text: 'Privacy settings saved successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleExportSettings = () => {
        const allSettings = {
            account: accountSettings,
            security: securitySettings,
            notifications: notificationSettings,
            system: systemSettings,
            privacy: privacySettings,
            exportDate: new Date().toISOString()
        };
        const dataStr = JSON.stringify(allSettings, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `user-settings-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        URL.revokeObjectURL(url);
        setMessage({ type: 'success', text: 'Settings exported successfully!' });
        setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    };

    const handleResetSettings = () => {
        if (window.confirm('Reset all settings to defaults? This action cannot be undone.')) {
            localStorage.removeItem('userSettings');
            window.location.reload();
        }
    };

    const passReqs = validatePassword(passwordSettings.newPassword);

    return (
        <div className="user-settings-container">
            <div className="user-settings-header">
                <div className="settings-profile-card">
                    <div className="settings-profile-avatar" onClick={() => document.getElementById('avatar-input').click()} style={{cursor: 'pointer'}}>
                        {profileDisplay.avatar ? (
                            <img src={profileDisplay.avatar} alt="Profile" />
                        ) : (
                            <div className="avatar-placeholder">
                                {profileDisplay.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </div>
                        )}
                        <input type="file" id="avatar-input" hidden accept="image/*" onChange={handleAvatarChange} />
                    </div>
                    <div className="settings-profile-info">
                        <h2>{profileDisplay.name}</h2>
                        <p>{profileDisplay.email}</p>
                        <span className="employee-badge">{profileDisplay.employeeId}</span>
                    </div>
                </div>
                <div className="settings-header-title">
                    <h1>⚙️ Settings</h1>
                    <p>Command Hub Control Panel</p>
                </div>
            </div>

            {message.text && (
                <div className={`user-settings-message ${message.type}`}>
                    <span className="message-icon">{message.type === 'success' ? '✓' : '⚠'}</span>
                    <span>{message.text}</span>
                </div>
            )}

            <div className="user-settings-content">
                <div className="user-settings-tabs">
                    <button className={`user-settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
                        <span className="tab-icon">👤</span> Account
                    </button>
                    <button className={`user-settings-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
                        <span className="tab-icon">🔒</span> Password
                    </button>
                    <button className={`user-settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
                        <span className="tab-icon">🛡️</span> Security
                    </button>
                    <button className={`user-settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
                        <span className="tab-icon">🔔</span> Alerts
                    </button>
                    <button className={`user-settings-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
                        <span className="tab-icon">💻</span> System
                    </button>
                    <button className={`user-settings-tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
                        <span className="tab-icon">🔐</span> Privacy
                    </button>
                </div>

                <div className="user-settings-panel">
                    {activeTab === 'account' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Account Identity</h2>
                                <p>Manage your organizational profile and contact data</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Full Name</label>
                                        <input type="text" name="name" value={accountSettings.name} onChange={handleAccountChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Email Address</label>
                                        <input type="email" name="email" value={accountSettings.email} onChange={handleAccountChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>User ID Tag</label>
                                        <input type="text" name="employeeId" value={accountSettings.employeeId} className="readonly" readOnly />
                                    </div>
                                    <div className="form-group">
                                        <label>Phone Number</label>
                                        <input type="tel" name="phone" value={accountSettings.phone} onChange={handleAccountChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Department</label>
                                        <input type="text" name="department" value={accountSettings.department} onChange={handleAccountChange} />
                                    </div>
                                    <div className="form-group">
                                        <label>Designation</label>
                                        <input type="text" name="role" value={accountSettings.role} onChange={handleAccountChange} />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Emergency Contact</label>
                                        <input type="tel" name="emergencyContact" value={accountSettings.emergencyContact} onChange={handleAccountChange} />
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSaveAccount}>
                                        <span className="btn-icon">💾</span> Update Profile
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'password' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Access Control</h2>
                                <p>Update your authentication credentials</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Current Password</label>
                                        <input type="password" name="currentPassword" value={passwordSettings.currentPassword} onChange={handlePasswordChange} placeholder="Enter your current password" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>New Stealth Key</label>
                                        <input type="password" name="newPassword" value={passwordSettings.newPassword} onChange={handlePasswordChange} placeholder="Define new secure key" />
                                    </div>
                                    <div className="form-group full-width">
                                        <label>Verify Key</label>
                                        <input type="password" name="confirmPassword" value={passwordSettings.confirmPassword} onChange={handlePasswordChange} placeholder="Verify your new key" />
                                    </div>
                                </div>
                                <div className="password-requirements">
                                    <h4>Security Requirements:</h4>
                                    <ul>
                                        <li className={passReqs.length ? 'valid' : ''}>Minimum 8 characters</li>
                                        <li className={passReqs.uppercase ? 'valid' : ''}>Uppercase letter integration</li>
                                        <li className={passReqs.number ? 'valid' : ''}>Numerical digit inclusion</li>
                                        <li className={passReqs.special ? 'valid' : ''}>Special character usage</li>
                                    </ul>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSavePassword}>
                                        <span className="btn-icon">🔒</span> Rekey Account
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'security' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Security Layering</h2>
                                <p>Advanced protection protocols for your account</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="security-options">
                                    <div className="security-option">
                                        <div className="option-info">
                                            <h4>Biometric / 2FA Link</h4>
                                            <p>Enable multi-factor authentication for sensitive missions</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" name="twoFactorAuth" checked={securitySettings.twoFactorAuth} onChange={handleSecurityChange} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="security-option">
                                        <div className="option-info">
                                            <h4>Proactive Login Alerts</h4>
                                            <p>Real-time notifications for every successful authentication</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" name="loginNotifications" checked={securitySettings.loginNotifications} onChange={handleSecurityChange} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Session Auto-Expirations</label>
                                        <select name="sessionTimeout" value={securitySettings.sessionTimeout} onChange={handleSecurityChange}>
                                            <option value="15">15 Minutes of inactivity</option>
                                            <option value="30">30 Minutes of inactivity</option>
                                            <option value="60">1 Hour of inactivity</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Trusted IP Tunneling</label>
                                        <input type="text" name="allowedIPs" value={securitySettings.allowedIPs} onChange={handleSecurityChange} placeholder="e.g., 10.0.0.1" />
                                    </div>
                                </div>
                                <div className="security-questions">
                                    <h4>Authentication Recovery Questions</h4>
                                    <div className="form-grid">
                                        <div className="form-group full-width">
                                            <label>Question 1</label>
                                            <input type="text" name="securityQuestion1" value={securitySettings.securityQuestion1} onChange={handleSecurityChange} placeholder="First base of operations?" />
                                        </div>
                                        <div className="form-group full-width">
                                            <label>Response 1</label>
                                            <input type="text" name="securityAnswer1" value={securitySettings.securityAnswer1} onChange={handleSecurityChange} />
                                        </div>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSaveSecurity}>
                                        <span className="btn-icon">🛡️</span> Seal Security
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'notifications' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Alert Protocols</h2>
                                <p>Fine-tune how you receive mission critical data</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="notification-channels">
                                    <h4>Signal Channels</h4>
                                    <div className="security-options">
                                        <div className="security-option">
                                            <div className="option-info">
                                                <h4>Email Relay</h4>
                                                <p>Send standard alerts to encrypted inbox</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" name="emailNotifications" checked={notificationSettings.emailNotifications} onChange={handleNotificationChange} />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="security-option">
                                            <div className="option-info">
                                                <h4>Push Frequency</h4>
                                                <p>Actionable browser surface notifications</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" name="pushNotifications" checked={notificationSettings.pushNotifications} onChange={handleNotificationChange} />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="notification-types">
                                    <h4>Mission Events</h4>
                                    <div className="security-options">
                                        <div className="security-option">
                                            <div className="option-info">
                                                <h4>Request Dynamic Updates</h4>
                                                <p>Status changes for vehicle deployments</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" name="requestStatusAlerts" checked={notificationSettings.requestStatusAlerts} onChange={handleNotificationChange} />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                        <div className="security-option">
                                            <div className="option-info">
                                                <h4>Emergency Broadcaster</h4>
                                                <p>High-priority security bypass alerts</p>
                                            </div>
                                            <label className="toggle-switch">
                                                <input type="checkbox" name="emergencyAlerts" checked={notificationSettings.emergencyAlerts} onChange={handleNotificationChange} />
                                                <span className="toggle-slider"></span>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSaveNotifications}>
                                        <span className="btn-icon">🔔</span> Calibrate Alerts
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'system' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Interface Modifiers</h2>
                                <p>Personalize the Command Hub environment</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="form-grid">
                                    <div className="form-group">
                                        <label>Visual Mode</label>
                                        <select name="theme" value={systemSettings.theme} onChange={handleSystemChange}>
                                            <option value="light">Standard Command (Light)</option>
                                            <option value="dark">Stealth Mode (Dark)</option>
                                            <option value="auto">Sync with OS</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Operational Language</label>
                                        <select name="language" value={systemSettings.language} onChange={handleSystemChange}>
                                            <option value="en">English (Global)</option>
                                            <option value="am">Amharic (Ethiopia)</option>
                                        </select>
                                    </div>
                                    <div className="form-group">
                                        <label>Chronos (Timezone)</label>
                                        <select name="timezone" value={systemSettings.timezone} onChange={handleSystemChange}>
                                            <option value="Africa/Addis_Ababa">Addis Ababa (GMT+3)</option>
                                            <option value="UTC">Universal Coordinated</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="security-options">
                                    <div className="security-option">
                                        <div className="option-info">
                                            <h4>Audio Signal Feedback</h4>
                                            <p>Audible confirmations for system actions</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" name="soundAlerts" checked={systemSettings.soundAlerts} onChange={handleSystemChange} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSaveSystem}>
                                        <span className="btn-icon">💻</span> Apply Interface Settings
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}

                    {activeTab === 'privacy' && (
                        <div className="user-settings-section">
                            <div className="section-header">
                                <h2>Privacy Guard</h2>
                                <p>Manage your digital footprint and data exposure</p>
                            </div>
                            <form className="user-settings-form">
                                <div className="form-grid">
                                    <div className="form-group full-width">
                                        <label>Global Profile Visibility</label>
                                        <select name="profileVisibility" value={privacySettings.profileVisibility} onChange={handlePrivacyChange} className="privacy-select">
                                            <option value="organization">Internal - Visible to HUB Staff</option>
                                            <option value="private">Stealth - Restricted Visibility</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="security-options">
                                    <div className="security-option">
                                        <div className="option-info">
                                            <h4>GPS Telemetry Tracking</h4>
                                            <p>Allow system to monitor operational location</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" name="locationTracking" checked={privacySettings.locationTracking} onChange={handlePrivacyChange} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                    <div className="security-option">
                                        <div className="option-info">
                                            <h4>Opt-in for Analytics</h4>
                                            <p>Share anonymized usage logs to improve command response</p>
                                        </div>
                                        <label className="toggle-switch">
                                            <input type="checkbox" name="analyticsOptIn" checked={privacySettings.analyticsOptIn} onChange={handlePrivacyChange} />
                                            <span className="toggle-slider"></span>
                                        </label>
                                    </div>
                                </div>
                                <div className="form-actions">
                                    <button type="button" className="btn-primary" onClick={handleSavePrivacy}>
                                        <span className="btn-icon">🔐</span> Locking Privacy
                                    </button>
                                </div>
                            </form>
                        </div>
                    )}
                </div>
            </div>

            <div className="user-settings-footer">
                <div className="footer-actions">
                    <button className="btn-secondary" onClick={handleExportSettings}>
                        <span className="btn-icon">📥</span> Backup Hub Configuration
                    </button>
                    <button className="btn-danger" onClick={handleResetSettings}>
                        <span className="btn-icon">🔄</span> Factory Reset Settings
                    </button>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;
