import { useState, useEffect } from 'react';
import '../driver/DriverSettings.css';

const MaintenanceSettings = ({ currentUser }) => {
  const [activeTab, setActiveTab] = useState('account');
  const [message, setMessage] = useState({ type: '', text: '' });

  const [profileDisplay, setProfileDisplay] = useState({
    name: currentUser?.name || 'Maintenance Officer',
    email: currentUser?.email || 'maintenance@hu.edu.et',
    employeeId: currentUser?.employeeId || 'MNT-001',
    avatar: null,
  });

  const [accountSettings, setAccountSettings] = useState({
    name: currentUser?.name || 'Maintenance Officer',
    email: currentUser?.email || 'maintenance@hu.edu.et',
    employeeId: currentUser?.employeeId || 'MNT-001',
    phone: currentUser?.phone || '',
    department: currentUser?.department || 'Maintenance',
    shiftSchedule: 'Morning (6:00 AM - 2:00 PM)',
    emergencyContact: '',
    avatar: null,
  });

  const [passwordSettings, setPasswordSettings] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });

  const [securitySettings, setSecuritySettings] = useState({
    twoFactorAuth: false, loginNotifications: true,
    sessionTimeout: '30', allowedIPs: '',
    securityQuestion1: '', securityAnswer1: '',
    securityQuestion2: '', securityAnswer2: '',
    securityQuestion3: '', securityAnswer3: '',
  });

  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true, smsNotifications: false, pushNotifications: true,
    repairRequestAlerts: true, completionAlerts: true, systemMaintenance: true,
    shiftReminders: true, reportGeneration: false, emergencyAlerts: true,
    authorizationUpdates: true,
  });

  const [systemSettings, setSystemSettings] = useState({
    theme: 'light', language: 'en', timezone: 'Africa/Addis_Ababa',
    dateFormat: 'DD/MM/YYYY', timeFormat: '24-hour',
    autoLogout: '15', screenSaver: '5', soundAlerts: true,
  });

  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'organization', activityTracking: true,
    dataSharing: false, analyticsOptIn: true,
    locationTracking: false, cameraAccess: true, microphoneAccess: false,
  });

  useEffect(() => {
    const saved = localStorage.getItem('maintenanceSettings');
    const savedPhoto = localStorage.getItem('maintenanceProfilePhoto');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.account) {
        const acc = { ...parsed.account, avatar: savedPhoto || parsed.account.avatar };
        setAccountSettings(acc);
        setProfileDisplay({ name: acc.name, email: acc.email, employeeId: acc.employeeId, avatar: acc.avatar });
        applyTheme(parsed.system?.theme || 'light');
      }
      if (parsed.security)      setSecuritySettings(parsed.security);
      if (parsed.notifications)  setNotificationSettings(parsed.notifications);
      if (parsed.system)        { setSystemSettings(parsed.system); applyTheme(parsed.system.theme); }
      if (parsed.privacy)       setPrivacySettings(parsed.privacy);
    } else if (savedPhoto) {
      setAccountSettings(p => ({ ...p, avatar: savedPhoto }));
      setProfileDisplay(p => ({ ...p, avatar: savedPhoto }));
    }
  }, []);

  useEffect(() => { applyTheme(systemSettings.theme); }, [systemSettings.theme]);

  const applyTheme = (theme) => {
    if (theme === 'dark') {
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.style.backgroundColor = '#1a1a1a';
      document.body.style.color = '#ffffff';
    } else if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    } else {
      const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    }
    localStorage.setItem('appTheme', theme);
  };

  const saveAll = () => {
    localStorage.setItem('maintenanceSettings', JSON.stringify({
      account: accountSettings, security: securitySettings,
      notifications: notificationSettings, system: systemSettings, privacy: privacySettings,
    }));
  };

  const showMsg = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 3000);
  };

  const validatePassword = (pw) => ({
    length: pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number: /[0-9]/.test(pw),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(pw),
  });

  const handleAccountChange  = (e) => setAccountSettings(p => ({ ...p, [e.target.name]: e.target.value }));
  const handlePasswordChange = (e) => setPasswordSettings(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleSecurityChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const handleNotifChange = (e) => setNotificationSettings(p => ({ ...p, [e.target.name]: e.target.checked }));
  const handleSystemChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSystemSettings(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };
  const handlePrivacyChange = (e) => {
    const { name, value, type, checked } = e.target;
    setPrivacySettings(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSaveAccount = () => {
    saveAll();
    setProfileDisplay({ name: accountSettings.name, email: accountSettings.email, employeeId: accountSettings.employeeId, avatar: accountSettings.avatar });
    showMsg('success', 'Account settings saved successfully!');
  };

  const handleSavePassword = () => {
    const v = validatePassword(passwordSettings.newPassword);
    if (!Object.values(v).every(Boolean)) { showMsg('error', 'Password does not meet all requirements!'); return; }
    if (passwordSettings.newPassword !== passwordSettings.confirmPassword) { showMsg('error', 'Passwords do not match!'); return; }
    setPasswordSettings({ currentPassword: '', newPassword: '', confirmPassword: '' });
    showMsg('success', 'Password changed successfully!');
  };

  const handleSaveSecurity      = () => { saveAll(); showMsg('success', 'Security settings saved!'); };
  const handleSaveNotifications = () => { saveAll(); showMsg('success', 'Notification preferences saved!'); };
  const handleSaveSystem        = () => { saveAll(); applyTheme(systemSettings.theme); showMsg('success', 'System settings applied!'); };
  const handleSavePrivacy       = () => { saveAll(); showMsg('success', 'Privacy settings saved!'); };

  const handleExportSettings = () => {
    const data = JSON.stringify({ account: accountSettings, security: securitySettings, notifications: notificationSettings, system: systemSettings, privacy: privacySettings, exportDate: new Date().toISOString() }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href = url; a.download = `maintenance-settings-${new Date().toISOString().split('T')[0]}.json`;
    a.click(); URL.revokeObjectURL(url);
    showMsg('success', 'Settings exported!');
  };

  const handleResetSettings = () => {
    if (window.confirm('Reset all settings to defaults? This cannot be undone.')) {
      localStorage.removeItem('maintenanceSettings');
      window.location.reload();
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = ev.target.result;
      setAccountSettings(p => ({ ...p, avatar: img }));
      setProfileDisplay(p => ({ ...p, avatar: img }));
      localStorage.setItem('maintenanceProfilePhoto', img);
      // Notify the dashboard header to update immediately
      window.dispatchEvent(new Event('maintenanceProfileUpdated'));
    };
    reader.readAsDataURL(file);
  };

  const pwValidation = validatePassword(passwordSettings.newPassword);

  return (
    <div className="driver-settings-container">
      <div className="driver-settings-header">
        <div className="settings-profile-card">
          <div className="settings-profile-avatar">
            {profileDisplay.avatar
              ? <img src={profileDisplay.avatar} alt={profileDisplay.name} />
              : <div className="avatar-placeholder">{profileDisplay.name.split(' ').map(n => n[0]).join('').toUpperCase()}</div>}
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
        <div className={`driver-settings-message ${message.type}`}>
          <span className="message-icon">{message.type === 'success' ? '✓' : '⚠'}</span>
          <span>{message.text}</span>
        </div>
      )}

      <div className="driver-settings-content">
        <div className="driver-settings-tabs">
          {[
            { key: 'account',       icon: '👤', label: 'Account' },
            { key: 'password',      icon: '🔒', label: 'Password' },
            { key: 'security',      icon: '🛡️', label: 'Security' },
            { key: 'notifications', icon: '🔔', label: 'Notifications' },
            { key: 'system',        icon: '💻', label: 'System' },
            { key: 'privacy',       icon: '🔐', label: 'Privacy' },
          ].map(t => (
            <button key={t.key} className={`driver-settings-tab ${activeTab === t.key ? 'active' : ''}`} onClick={() => setActiveTab(t.key)}>
              <span className="tab-icon">{t.icon}</span> {t.label}
            </button>
          ))}
        </div>

        <div className="driver-settings-panel">

          {/* ── ACCOUNT ── */}
          {activeTab === 'account' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>Account Information</h2><p>Update your personal and professional details</p></div>
              <form className="driver-settings-form">
                <div className="form-grid">
                  <div className="form-group"><label>Full Name</label><input type="text" name="name" value={accountSettings.name} onChange={handleAccountChange} /></div>
                  <div className="form-group"><label>Email Address</label><input type="email" name="email" value={accountSettings.email} onChange={handleAccountChange} /></div>
                  <div className="form-group"><label>Employee ID</label><input type="text" name="employeeId" value={accountSettings.employeeId} className="readonly" readOnly /></div>
                  <div className="form-group"><label>Phone Number</label><input type="tel" name="phone" value={accountSettings.phone} onChange={handleAccountChange} /></div>
                  <div className="form-group"><label>Department</label><input type="text" name="department" value={accountSettings.department} onChange={handleAccountChange} /></div>
                  <div className="form-group">
                    <label>Shift Schedule</label>
                    <select name="shiftSchedule" value={accountSettings.shiftSchedule} onChange={handleAccountChange}>
                      <option>Morning (6:00 AM - 2:00 PM)</option>
                      <option>Afternoon (2:00 PM - 10:00 PM)</option>
                      <option>Night (10:00 PM - 6:00 AM)</option>
                    </select>
                  </div>
                  <div className="form-group full-width"><label>Emergency Contact</label><input type="tel" name="emergencyContact" value={accountSettings.emergencyContact} onChange={handleAccountChange} /></div>
                  <div className="form-group full-width">
                    <label>Profile Photo</label>
                    <input type="file" accept="image/*" onChange={handleAvatarChange} />
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveAccount}><span className="btn-icon">💾</span> Save Changes</button>
                </div>
              </form>
            </div>
          )}

          {/* ── PASSWORD ── */}
          {activeTab === 'password' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>Change Password</h2><p>Update your password to keep your account secure</p></div>
              <form className="driver-settings-form">
                <div className="form-grid">
                  <div className="form-group full-width"><label>Current Password</label><input type="password" name="currentPassword" value={passwordSettings.currentPassword} onChange={handlePasswordChange} placeholder="Enter current password" /></div>
                  <div className="form-group full-width"><label>New Password</label><input type="password" name="newPassword" value={passwordSettings.newPassword} onChange={handlePasswordChange} placeholder="Enter new password" /></div>
                  <div className="form-group full-width"><label>Confirm New Password</label><input type="password" name="confirmPassword" value={passwordSettings.confirmPassword} onChange={handlePasswordChange} placeholder="Confirm new password" /></div>
                </div>
                <div className="password-requirements">
                  <h4>Password Requirements:</h4>
                  <ul>
                    <li className={pwValidation.length    ? 'valid' : ''}>At least 8 characters long</li>
                    <li className={pwValidation.uppercase ? 'valid' : ''}>Contains at least one uppercase letter</li>
                    <li className={pwValidation.lowercase ? 'valid' : ''}>Contains at least one lowercase letter</li>
                    <li className={pwValidation.number    ? 'valid' : ''}>Contains at least one number</li>
                    <li className={pwValidation.special   ? 'valid' : ''}>Contains at least one special character</li>
                  </ul>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSavePassword}><span className="btn-icon">��</span> Update Password</button>
                </div>
              </form>
            </div>
          )}

          {/* ── SECURITY ── */}
          {activeTab === 'security' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>Security Settings</h2><p>Manage your account security and authentication</p></div>
              <form className="driver-settings-form">
                <div className="security-options">
                  {[
                    { name: 'twoFactorAuth',      label: 'Two-Factor Authentication', desc: 'Add an extra layer of security' },
                    { name: 'loginNotifications', label: 'Login Notifications',        desc: 'Get notified on new logins' },
                  ].map(o => (
                    <div key={o.name} className="security-option">
                      <div className="option-info"><h4>{o.label}</h4><p>{o.desc}</p></div>
                      <label className="toggle-switch">
                        <input type="checkbox" name={o.name} checked={securitySettings[o.name]} onChange={handleSecurityChange} />
                        <span className="toggle-slider"></span>
                      </label>
                    </div>
                  ))}
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label>Session Timeout (minutes)</label>
                    <select name="sessionTimeout" value={securitySettings.sessionTimeout} onChange={handleSecurityChange}>
                      <option value="15">15 minutes</option><option value="30">30 minutes</option>
                      <option value="60">1 hour</option><option value="120">2 hours</option>
                    </select>
                  </div>
                  <div className="form-group"><label>Allowed IP Addresses</label><input type="text" name="allowedIPs" value={securitySettings.allowedIPs} onChange={handleSecurityChange} placeholder="e.g., 192.168.1.1" /></div>
                </div>
                <div className="security-questions">
                  <h4>Security Questions</h4>
                  <div className="form-grid">
                    {[1,2,3].map(n => (
                      <>
                        <div key={`q${n}`} className="form-group full-width"><label>Question {n}</label><input type="text" name={`securityQuestion${n}`} value={securitySettings[`securityQuestion${n}`]} onChange={handleSecurityChange} placeholder={['What was your first pet\'s name?','What city were you born in?','What is your mother\'s maiden name?'][n-1]} /></div>
                        <div key={`a${n}`} className="form-group full-width"><label>Answer {n}</label><input type="text" name={`securityAnswer${n}`} value={securitySettings[`securityAnswer${n}`]} onChange={handleSecurityChange} /></div>
                      </>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveSecurity}><span className="btn-icon">🛡️</span> Save Security Settings</button>
                </div>
              </form>
            </div>
          )}

          {/* ── NOTIFICATIONS ── */}
          {activeTab === 'notifications' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>Notification Preferences</h2><p>Choose how you want to receive notifications</p></div>
              <form className="driver-settings-form">
                <div className="notification-channels">
                  <h4>Channels</h4>
                  <div className="security-options">
                    {[
                      { name: 'emailNotifications', label: 'Email Notifications',  desc: 'Receive notifications via email' },
                      { name: 'smsNotifications',   label: 'SMS Notifications',    desc: 'Receive notifications via text' },
                      { name: 'pushNotifications',  label: 'Push Notifications',   desc: 'Browser push notifications' },
                    ].map(o => (
                      <div key={o.name} className="security-option">
                        <div className="option-info"><h4>{o.label}</h4><p>{o.desc}</p></div>
                        <label className="toggle-switch"><input type="checkbox" name={o.name} checked={notificationSettings[o.name]} onChange={handleNotifChange} /><span className="toggle-slider"></span></label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="notification-types">
                  <h4>Notification Types</h4>
                  <div className="security-options">
                    {[
                      { name: 'repairRequestAlerts', label: 'Repair Request Alerts',  desc: 'New vehicle issues reported by drivers' },
                      { name: 'completionAlerts',    label: 'Completion Alerts',       desc: 'When repairs are marked complete' },
                      { name: 'systemMaintenance',   label: 'System Maintenance',      desc: 'Scheduled maintenance and updates' },
                      { name: 'shiftReminders',      label: 'Shift Reminders',         desc: 'Reminders about upcoming shifts' },
                      { name: 'reportGeneration',    label: 'Report Generation',        desc: 'Notifications when reports are ready' },
                      { name: 'emergencyAlerts',     label: 'Emergency Alerts',         desc: 'Critical emergency notifications' },
                      { name: 'authorizationUpdates',label: 'Authorization Updates',    desc: 'Changes to your permissions' },
                    ].map(o => (
                      <div key={o.name} className="security-option">
                        <div className="option-info"><h4>{o.label}</h4><p>{o.desc}</p></div>
                        <label className="toggle-switch"><input type="checkbox" name={o.name} checked={notificationSettings[o.name]} onChange={handleNotifChange} /><span className="toggle-slider"></span></label>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveNotifications}><span className="btn-icon">🔔</span> Save Notification Preferences</button>
                </div>
              </form>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {activeTab === 'system' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>System Preferences</h2><p>Customize your system settings</p></div>
              <form className="driver-settings-form">
                <div className="form-grid">
                  <div className="form-group"><label>Theme</label><select name="theme" value={systemSettings.theme} onChange={handleSystemChange}><option value="light">Light</option><option value="dark">Dark</option><option value="auto">Auto (System)</option></select></div>
                  <div className="form-group"><label>Language</label><select name="language" value={systemSettings.language} onChange={handleSystemChange}><option value="en">English</option><option value="am">Amharic</option><option value="or">Oromo</option></select></div>
                  <div className="form-group"><label>Timezone</label><select name="timezone" value={systemSettings.timezone} onChange={handleSystemChange}><option value="Africa/Addis_Ababa">East Africa Time (EAT)</option><option value="UTC">UTC</option></select></div>
                  <div className="form-group"><label>Date Format</label><select name="dateFormat" value={systemSettings.dateFormat} onChange={handleSystemChange}><option value="DD/MM/YYYY">DD/MM/YYYY</option><option value="MM/DD/YYYY">MM/DD/YYYY</option><option value="YYYY-MM-DD">YYYY-MM-DD</option></select></div>
                  <div className="form-group"><label>Time Format</label><select name="timeFormat" value={systemSettings.timeFormat} onChange={handleSystemChange}><option value="24-hour">24-hour</option><option value="12-hour">12-hour (AM/PM)</option></select></div>
                  <div className="form-group"><label>Auto Logout (minutes)</label><select name="autoLogout" value={systemSettings.autoLogout} onChange={handleSystemChange}><option value="5">5 minutes</option><option value="15">15 minutes</option><option value="30">30 minutes</option><option value="60">1 hour</option></select></div>
                  <div className="form-group"><label>Screen Saver (minutes)</label><select name="screenSaver" value={systemSettings.screenSaver} onChange={handleSystemChange}><option value="5">5 minutes</option><option value="10">10 minutes</option><option value="15">15 minutes</option><option value="never">Never</option></select></div>
                </div>
                <div className="security-options">
                  <div className="security-option">
                    <div className="option-info"><h4>Sound Alerts</h4><p>Play sound for notifications and alerts</p></div>
                    <label className="toggle-switch"><input type="checkbox" name="soundAlerts" checked={systemSettings.soundAlerts} onChange={handleSystemChange} /><span className="toggle-slider"></span></label>
                  </div>
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSaveSystem}><span className="btn-icon">💻</span> Save System Settings</button>
                </div>
              </form>
            </div>
          )}

          {/* ── PRIVACY ── */}
          {activeTab === 'privacy' && (
            <div className="driver-settings-section">
              <div className="section-header"><h2>Privacy Settings</h2><p>Control your privacy and data sharing preferences</p></div>
              <form className="driver-settings-form">
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
                  {[
                    { name: 'activityTracking', label: 'Activity Tracking',  desc: 'Allow system to track your activity' },
                    { name: 'dataSharing',      label: 'Data Sharing',        desc: 'Share anonymized data with third parties' },
                    { name: 'analyticsOptIn',   label: 'Analytics Opt-In',    desc: 'Help improve the system with usage data' },
                    { name: 'locationTracking', label: 'Location Tracking',   desc: 'Allow system to access your location' },
                    { name: 'cameraAccess',     label: 'Camera Access',       desc: 'Allow system to access your camera' },
                    { name: 'microphoneAccess', label: 'Microphone Access',   desc: 'Allow system to access your microphone' },
                  ].map(o => (
                    <div key={o.name} className="security-option">
                      <div className="option-info"><h4>{o.label}</h4><p>{o.desc}</p></div>
                      <label className="toggle-switch"><input type="checkbox" name={o.name} checked={privacySettings[o.name]} onChange={handlePrivacyChange} /><span className="toggle-slider"></span></label>
                    </div>
                  ))}
                </div>
                <div className="form-actions">
                  <button type="button" className="btn-primary" onClick={handleSavePrivacy}><span className="btn-icon">🔐</span> Save Privacy Settings</button>
                </div>
              </form>
            </div>
          )}

        </div>
      </div>

      <div className="driver-settings-footer">
        <div className="footer-actions">
          <button className="btn-secondary" onClick={handleExportSettings}><span className="btn-icon">📥</span> Export Settings</button>
          <button className="btn-danger" onClick={handleResetSettings}><span className="btn-icon">🔄</span> Reset to Defaults</button>
        </div>
      </div>
    </div>
  );
};

export default MaintenanceSettings;