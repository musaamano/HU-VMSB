import { useState, useEffect } from 'react';
import './GateSecuritySettings.css';

const GateSecuritySettings = () => {
  const [activeTab, setActiveTab] = useState('account');
  const [message, setMessage] = useState({ type: '', text: '' });
  const [profileDisplay, setProfileDisplay] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@university.edu.et',
    employeeId: 'GS-2024-001',
    avatar: null
  });
  
  const [accountSettings, setAccountSettings] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@university.edu.et',
    employeeId: 'GS-2024-001',
    phone: '+251-911-234567',
    gateLocation: 'Main Gate',
    shiftSchedule: 'Morning (6:00 AM - 2:00 PM)',
    emergencyContact: '+251-911-987654',
    avatar: null
  });

  const [passwordSettings, setPasswordSettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [securitySettings, setSecuritySettings] = useState({
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
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    vehicleEntryAlerts: true,
    unauthorizedAccessAlerts: true,
    systemMaintenance: true,
    shiftReminders: true,
    reportGeneration: false,
    emergencyAlerts: true,
    authorizationUpdates: true
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: 'light',
    language: 'en',
    timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY',
    timeFormat: '24-hour',
    autoLogout: '15',
    screenSaver: '5',
    soundAlerts: true
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'organization',
    activityTracking: true,
    dataSharing: false,
    analyticsOptIn: true,
    locationTracking: false,
    cameraAccess: true,
    microphoneAccess: false
  });

  useEffect(() => {
    const savedSettings = localStorage.getItem('gateSecuritySettings');
    const savedProfilePhoto = localStorage.getItem('gateSecurityProfilePhoto');
    
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      if (parsed.account) {
        const accountData = {
          ...parsed.account,
          avatar: savedProfilePhoto || parsed.account.avatar
        };
        setAccountSettings(accountData);
        setProfileDisplay({
          name: accountData.name,
          email: accountData.email,
          employeeId: accountData.employeeId,
          avatar: accountData.avatar
        });
        applySystemSettings(parsed.system || systemSettings);
      }
      if (parsed.security) setSecuritySettings(parsed.security);
      if (parsed.notifications) setNotificationSettings(parsed.notifications);
      if (parsed.system) {
        setSystemSettings(parsed.system);
        applySystemSettings(parsed.system);
      }
      if (parsed.privacy) setPrivacySettings(parsed.privacy);
    } else if (savedProfilePhoto) {
      // If no settings but profile photo exists
      setAccountSettings(prev => ({
        ...prev,
        avatar: savedProfilePhoto
      }));
      setProfileDisplay(prev => ({
        ...prev,
        avatar: savedProfilePhoto
      }));
    }
  }, []);

  // Apply theme changes
  useEffect(() => {
    applySystemSettings(systemSettings);
  }, [systemSettings.theme]);

  const applySystemSettings = (settings) => {
    // Apply theme
    if (settings.theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else if (settings.theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '#ffffff';
      document.body.style.color = '#000000';
    } else if (settings.theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', prefersDark ? 'dark' : 'light');
      document.body.style.backgroundColor = prefersDark ? '#1a1a1a' : '#ffffff';
      document.body.style.color = prefersDark ? '#ffffff' : '#000000';
    }

    // Apply language (you can expand this with actual i18n)
    document.documentElement.setAttribute('lang', settings.language);

    // Store in localStorage for persistence
    localStorage.setItem('appTheme', settings.theme);
    localStorage.setItem('appLanguage', settings.language);
  };

  const saveAllSettings = () => {
    const allSettings = {
      account: accountSettings,
      security: securitySettings,
      notifications: notificationSettings,
      system: systemSettings,
      privacy: privacySettings
    };
    localStorage.setItem('gateSecuritySettings', JSON.stringify(allSettings));
    
    // Play sound if enabled
    if (systemSettings.soundAlerts) {
      playNotificationSound();
    }
  };

  const playNotificationSound = () => {
    // Create a simple beep sound
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.value = 800;
    oscillator.type = 'sine';
    
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.1);
  };

  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountSettings(prev => ({ ...prev, [name]: value }));
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordSettings(prev => ({ ...prev, [name]: value }));
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
    setSystemSettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAccount = () => {
    saveAllSettings();
    
    // Update the profile display immediately
    setProfileDisplay({
      name: accountSettings.name,
      email: accountSettings.email,
      employeeId: accountSettings.employeeId,
      avatar: accountSettings.avatar
    });
    
    // Dispatch custom event to update header immediately
    const event = new CustomEvent('gateAccountSettingsUpdated', {
      detail: { account: accountSettings }
    });
    window.dispatchEvent(event);
    
    // Also dispatch a storage event manually for same-tab updates
    window.dispatchEvent(new StorageEvent('storage', {
      key: 'gateSecuritySettings',
      newValue: localStorage.getItem('gateSecuritySettings')
    }));
    
    console.log('Account saved:', accountSettings.name);
    
    setMessage({ type: 'success', text: 'Account settings saved successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSavePassword = () => {
    const validation = validatePassword(passwordSettings.newPassword);
    if (!Object.values(validation).every(v => v)) {
      setMessage({ type: 'error', text: 'Password does not meet all requirements!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) {
      setMessage({ type: 'error', text: 'Passwords do not match!' });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
      return;
    }
    setMessage({ type: 'success', text: 'Password changed successfully!' });
    setPasswordSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveSecurity = () => {
    saveAllSettings();
    setMessage({ type: 'success', text: 'Security settings saved successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveNotifications = () => {
    saveAllSettings();
    // Show a demo notification if browser notifications are enabled
    if (notificationSettings.pushNotifications && 'Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification('Settings Updated', {
          body: 'Your notification preferences have been saved successfully!',
          icon: '/favicon.png'
        });
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification('Settings Updated', {
              body: 'Your notification preferences have been saved successfully!',
              icon: '/favicon.png'
            });
          }
        });
      }
    }
    setMessage({ type: 'success', text: 'Notification preferences saved successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleSaveSystem = () => {
    saveAllSettings();
    applySystemSettings(systemSettings);
    setMessage({ type: 'success', text: 'System settings saved and applied successfully!' });
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
    link.download = `gate-security-settings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    setMessage({ type: 'success', text: 'Settings exported successfully!' });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const handleResetSettings = () => {
    if (window.confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      localStorage.removeItem('gateSecuritySettings');
      window.location.reload();
    }
  };

  const passwordValidation = validatePassword(passwordSettings.newPassword);

  return (
    <div className="gate-settings-container">
      <div className="gate-settings-header">
        <div className="settings-profile-card">
          <div className="settings-profile-avatar">
            {profileDisplay.avatar ? (
              <img src={profileDisplay.avatar} alt={profileDisplay.name} />
            ) : (
              <div className="avatar-placeholder">
                {profileDisplay.name.split(' ').map(n => n[0]).join('').toUpperCase()}
              </div>
            )}
          </div>
          <div className="settings-profile-info">
            <h2>{profileDisplay.name}</h2>
            <p>{profileDisplay.email}</p>
            <span className="employee-badge">{profileDisplay.employeeId}</span>
          </div>
        </div>
        <div className="settings-header-title">
          <h1>⚙️ Settings</h1>
          <p>Manage your account, security, and preferences</p>
        </div>
      </div>

      {message.text && (
        <div className={`gate-settings-message ${message.type}`}>
          <span className="message-icon">{message.type === 'success' ? '✓' : '⚠'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="gate-settings-content">
        <div className="gate-settings-tabs">
          <button className={`gate-settings-tab ${activeTab === 'account' ? 'active' : ''}`} onClick={() => setActiveTab('account')}>
            <span className="tab-icon">👤</span> Account
          </button>
          <button className={`gate-settings-tab ${activeTab === 'password' ? 'active' : ''}`} onClick={() => setActiveTab('password')}>
            <span className="tab-icon">🔒</span> Password
          </button>
          <button className={`gate-settings-tab ${activeTab === 'security' ? 'active' : ''}`} onClick={() => setActiveTab('security')}>
            <span className="tab-icon">🛡️</span> Security
          </button>
          <button className={`gate-settings-tab ${activeTab === 'notifications' ? 'active' : ''}`} onClick={() => setActiveTab('notifications')}>
            <span className="tab-icon">🔔</span> Notifications
          </button>
          <button className={`gate-settings-tab ${activeTab === 'system' ? 'active' : ''}`} onClick={() => setActiveTab('system')}>
            <span className="tab-icon">💻</span> System
          </button>
          <button className={`gate-settings-tab ${activeTab === 'privacy' ? 'active' : ''}`} onClick={() => setActiveTab('privacy')}>
            <span className="tab-icon">🔐</span> Privacy
          </button>
        </div>

        <div className="gate-settings-panel">
          {activeTab === 'account' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>Account Information</h2>
                <p>Update your personal and professional details</p>
              </div>
              <form className="gate-settings-form">
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
                    <label>Employee ID</label>
                    <input type="text" name="employeeId" value={accountSettings.employeeId} className="readonly" readOnly />
                  </div>
                  <div className="form-group">
                    <label>Phone Number</label>
                    <input type="tel" name="phone" value={accountSettings.phone} onChange={handleAccountChange} />
                  </div>
                  <div className="form-group">
                    <label>Gate Location</label>
                    <input type="text" name="gateLocation" value={accountSettings.gateLocation} onChange={handleAccountChange} />
                  </div>
                  <div className="form-group">
                    <label>Shift Schedule</label>
                    <select name="shiftSchedule" value={accountSettings.shiftSchedule} onChange={handleAccountChange}>
                      <option>Morning (6:00 AM - 2:00 PM)</option>
                      <option>Afternoon (2:00 PM - 10:00 PM)</option>
                      <option>Night (10:00 PM - 6:00 AM)</option>
                    </select>
                  </div>
                  <div className="form-group full-width">
                    <label>Emergency Contact</label>
                    <input type="tel" name="emergencyContact" value={accountSettings.emergencyContact} onChange={handleAccountChange} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveAccount}>
                    <span className="btn-icon">💾</span> Save Changes
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'password' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>Change Password</h2>
                <p>Update your password to keep your account secure</p>
              </div>
              <form className="gate-settings-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Current Password</label>
                    <input type="password" name="currentPassword" value={passwordSettings.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" />
                  </div>
                  <div className="form-group full-width">
                    <label>New Password</label>
                    <input type="password" name="newPassword" value={passwordSettings.newPassword} onChange={handlePasswordChange} placeholder="Enter new password" />
                  </div>
                  <div className="form-group full-width">
                    <label>Confirm New Password</label>
                    <input type="password" name="confirmPassword" value={passwordSettings.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" />
                  </div>
                </div>
                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={passwordValidation.length ? 'valid' : ''}>At least 8 characters long</li>
                    <li className={passwordValidation.uppercase ? 'valid' : ''}>Contains at least one uppercase letter</li>
                    <li className={passwordValidation.lowercase ? 'valid' : ''}>Contains at least one lowercase letter</li>
                    <li className={passwordValidation.number ? 'valid' : ''}>Contains at least one number</li>
                    <li className={passwordValidation.special ? 'valid' : ''}>Contains at least one special character</li>
                  </ul>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSavePassword}>
                    <span className="btn-icon">🔒</span> Update Password
                  </button>
                </div>
              </form>
            </div>
          )}
          
          {activeTab === 'security' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>Security Settings</h2>
                <p>Manage your account security and authentication</p>
              </div>
              <form className="gate-settings-form">
                <div className="security-options">
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Two-Factor Authentication</h4>
                      <p>Add an extra layer of security to your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="twoFactorAuth" checked={securitySettings.twoFactorAuth} onChange={handleSecurityChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Login Notifications</h4>
                      <p>Get notified when someone logs into your account</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="loginNotifications" checked={securitySettings.loginNotifications} onChange={handleSecurityChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <select name="sessionTimeout" value={securitySettings.sessionTimeout} onChange={handleSecurityChange}>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                      <option value="120">2 hours</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Allowed IP Addresses</label>
                    <input type="text" name="allowedIPs" value={securitySettings.allowedIPs} onChange={handleSecurityChange} placeholder="e.g., 192.168.1.1" />
                  </div>
                </div>
                <div className="security-questions">
                  <h4>Security Questions</h4>
                  <div className="form-grid">
                    <div className="form-group full-width">
                      <label>Question 1</label>
                      <input type="text" name="securityQuestion1" value={securitySettings.securityQuestion1} onChange={handleSecurityChange} placeholder="What was your first pet's name?" />
                    </div>
                    <div className="form-group full-width">
                      <label>Answer 1</label>
                      <input type="text" name="securityAnswer1" value={securitySettings.securityAnswer1} onChange={handleSecurityChange} />
                    </div>
                    <div className="form-group full-width">
                      <label>Question 2</label>
                      <input type="text" name="securityQuestion2" value={securitySettings.securityQuestion2} onChange={handleSecurityChange} placeholder="What city were you born in?" />
                    </div>
                    <div className="form-group full-width">
                      <label>Answer 2</label>
                      <input type="text" name="securityAnswer2" value={securitySettings.securityAnswer2} onChange={handleSecurityChange} />
                    </div>
                    <div className="form-group full-width">
                      <label>Question 3</label>
                      <input type="text" name="securityQuestion3" value={securitySettings.securityQuestion3} onChange={handleSecurityChange} placeholder="What is your mother's maiden name?" />
                    </div>
                    <div className="form-group full-width">
                      <label>Answer 3</label>
                      <input type="text" name="securityAnswer3" value={securitySettings.securityAnswer3} onChange={handleSecurityChange} />
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveSecurity}>
                    <span className="btn-icon">🛡️</span> Save Security Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'notifications' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>Notification Preferences</h2>
                <p>Choose how you want to receive notifications</p>
              </div>
              <form className="gate-settings-form">
                <div className="notification-channels">
                  <h4>Notification Channels</h4>
                  <div className="security-options">
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Email Notifications</h4>
                        <p>Receive notifications via email</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="emailNotifications" checked={notificationSettings.emailNotifications} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>SMS Notifications</h4>
                        <p>Receive notifications via text message</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="smsNotifications" checked={notificationSettings.smsNotifications} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Push Notifications</h4>
                        <p>Receive push notifications in your browser</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="pushNotifications" checked={notificationSettings.pushNotifications} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="notification-types">
                  <h4>Notification Types</h4>
                  <div className="security-options">
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Vehicle Entry Alerts</h4>
                        <p>New vehicle entries and approvals</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="vehicleEntryAlerts" checked={notificationSettings.vehicleEntryAlerts} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Unauthorized Access Alerts</h4>
                        <p>Alerts for unauthorized access attempts</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="unauthorizedAccessAlerts" checked={notificationSettings.unauthorizedAccessAlerts} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>System Maintenance</h4>
                        <p>Scheduled maintenance and updates</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="systemMaintenance" checked={notificationSettings.systemMaintenance} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Shift Reminders</h4>
                        <p>Reminders about upcoming shifts</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="shiftReminders" checked={notificationSettings.shiftReminders} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Report Generation</h4>
                        <p>Notifications when reports are ready</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="reportGeneration" checked={notificationSettings.reportGeneration} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Emergency Alerts</h4>
                        <p>Critical emergency notifications</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="emergencyAlerts" checked={notificationSettings.emergencyAlerts} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                    <div className="security-option">
                      <div className="option-info">
                        <h4>Authorization Updates</h4>
                        <p>Changes to your permissions and access</p>
                      </div>
                      <label className="toggle-switch">
                        <input type="checkbox" name="authorizationUpdates" checked={notificationSettings.authorizationUpdates} onChange={handleNotificationChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveNotifications}>
                    <span className="btn-icon">🔔</span> Save Notification Preferences
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'system' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>System Preferences</h2>
                <p>Customize your system settings and preferences</p>
              </div>
              <form className="gate-settings-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Theme</label>
                    <select name="theme" value={systemSettings.theme} onChange={handleSystemChange}>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                      <option value="auto">Auto (System)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Language</label>
                    <select name="language" value={systemSettings.language} onChange={handleSystemChange}>
                      <option value="en">English</option>
                      <option value="am">Amharic</option>
                      <option value="or">Oromo</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Timezone</label>
                    <select name="timezone" value={systemSettings.timezone} onChange={handleSystemChange}>
                      <option value="Africa/Addis_Ababa">East Africa Time (EAT)</option>
                      <option value="UTC">UTC</option>
                      <option value="America/New_York">Eastern Time (ET)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Date Format</label>
                    <select name="dateFormat" value={systemSettings.dateFormat} onChange={handleSystemChange}>
                      <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                      <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                      <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Time Format</label>
                    <select name="timeFormat" value={systemSettings.timeFormat} onChange={handleSystemChange}>
                      <option value="24-hour">24-hour</option>
                      <option value="12-hour">12-hour (AM/PM)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Auto Logout (minutes)</label>
                    <select name="autoLogout" value={systemSettings.autoLogout} onChange={handleSystemChange}>
                      <option value="5">5 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="30">30 minutes</option>
                      <option value="60">1 hour</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Screen Saver (minutes)</label>
                    <select name="screenSaver" value={systemSettings.screenSaver} onChange={handleSystemChange}>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="15">15 minutes</option>
                      <option value="never">Never</option>
                    </select>
                  </div>
                </div>
                <div className="security-options">
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Sound Alerts</h4>
                      <p>Play sound for notifications and alerts</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="soundAlerts" checked={systemSettings.soundAlerts} onChange={handleSystemChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveSystem}>
                    <span className="btn-icon">💻</span> Save System Settings
                  </button>
                </div>
              </form>
            </div>
          )}

          {activeTab === 'privacy' && (
            <div className="gate-settings-section">
              <div className="section-header">
                <h2>Privacy Settings</h2>
                <p>Control your privacy and data sharing preferences</p>
              </div>
              <form className="gate-settings-form">
                <div className="form-grid">
                  <div className="form-group full-width">
                    <label>Profile Visibility</label>
                    <select name="profileVisibility" value={privacySettings.profileVisibility} onChange={handlePrivacyChange} className="privacy-select">
                      <option value="public">Public - Visible to everyone</option>
                      <option value="organization">Organization - Visible to HU staff only</option>
                      <option value="private">Private - Only visible to you</option>
                    </select>
                  </div>
                </div>
                <div className="security-options">
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Activity Tracking</h4>
                      <p>Allow system to track your activity for analytics</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="activityTracking" checked={privacySettings.activityTracking} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Data Sharing</h4>
                      <p>Share anonymized data with third parties</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="dataSharing" checked={privacySettings.dataSharing} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Analytics Opt-In</h4>
                      <p>Help improve the system by sharing usage data</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="analyticsOptIn" checked={privacySettings.analyticsOptIn} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Location Tracking</h4>
                      <p>Allow system to access your location</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="locationTracking" checked={privacySettings.locationTracking} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Camera Access</h4>
                      <p>Allow system to access your camera</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="cameraAccess" checked={privacySettings.cameraAccess} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                  <div className="security-option">
                    <div className="option-info">
                      <h4>Microphone Access</h4>
                      <p>Allow system to access your microphone</p>
                    </div>
                    <label className="toggle-switch">
                      <input type="checkbox" name="microphoneAccess" checked={privacySettings.microphoneAccess} onChange={handlePrivacyChange} />
                      <span className="toggle-slider"></span>
                    </label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSavePrivacy}>
                    <span className="btn-icon">🔐</span> Save Privacy Settings
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      <div className="gate-settings-footer">
        <div className="footer-actions">
          <button className="btn-secondary" onClick={handleExportSettings}>
            <span className="btn-icon">📥</span> Export Settings
          </button>
          <button className="btn-danger" onClick={handleResetSettings}>
            <span className="btn-icon">🔄</span> Reset to Defaults
          </button>
        </div>
      </div>
    </div>
  );
};

export default GateSecuritySettings;