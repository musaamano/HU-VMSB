import React, { useState, useEffect } from 'react';
import autoLogoSetup from '../utils/autoLogoSetup';
import logoHelper from '../utils/logoHelper';
import logoUploader from '../utils/logoUploader';
import './AutoLogoManager.css';

const AutoLogoManager = () => {
    const [logoStatus, setLogoStatus] = useState({
        logoLoaded: false,
        setupComplete: false,
        hasStoredLogo: false
    });
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [previewUrl, setPreviewUrl] = useState(null);

    useEffect(() => {
        updateStatus();
        loadPreview();
    }, []);

    const updateStatus = () => {
        const status = logoUploader.getLogoStatus();
        setLogoStatus(status);
    };

    const loadPreview = () => {
        const storedLogo = localStorage.getItem('haramayaUniversityLogo');
        if (storedLogo) {
            setPreviewUrl(storedLogo);
        }
    };

    const handleForceUploadHaramaya = async () => {
        setIsLoading(true);
        setMessage('🎓 Uploading Haramaya University logo from public folder...');

        try {
            const result = await logoUploader.uploadFromPath('/Haramaya-768x576.png');

            if (result.success) {
                setMessage('✅ Haramaya University logo uploaded successfully!');
                updateStatus();
                loadPreview();
            } else {
                setMessage(`❌ Upload failed: ${result.message}`);
            }
        } catch (error) {
            setMessage(`❌ Upload error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleTestLoading = async () => {
        setIsLoading(true);
        setMessage('🧪 Testing logo loading from multiple sources...');

        try {
            const result = await logoUploader.testLogoLoading();

            if (result.success) {
                setMessage('✅ Logo test successful!');
                updateStatus();
                loadPreview();
            } else {
                setMessage('⚠️ All test sources failed, using placeholder');
            }
        } catch (error) {
            setMessage(`❌ Test error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage('❌ Please select a valid image file');
            return;
        }

        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            setMessage('❌ File size must be less than 5MB');
            return;
        }

        setIsLoading(true);
        setMessage('📤 Uploading custom logo...');

        try {
            const result = await logoHelper.loadFromFile(file);

            if (result.success) {
                setMessage('✅ Custom logo uploaded successfully!');
                updateStatus();
                loadPreview();
            } else {
                setMessage(`❌ Upload failed: ${result.message}`);
            }
        } catch (error) {
            setMessage(`❌ Upload error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleForceReload = async () => {
        setIsLoading(true);
        setMessage('🔄 Refreshing logo system...');

        try {
            const result = await logoUploader.refreshLogoSystem();

            if (result.success) {
                setMessage('✅ Logo system refreshed successfully!');
                updateStatus();
                loadPreview();
            } else {
                setMessage(`❌ Refresh failed: ${result.error}`);
            }
        } catch (error) {
            setMessage(`❌ Refresh error: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveLogo = () => {
        logoHelper.removeLogo();
        setPreviewUrl(null);
        updateStatus();
        setMessage('🗑️ Logo removed successfully');
    };

    return (
        <div className="auto-logo-manager">
            <div className="logo-manager-header">
                <h3>🎓 Haramaya University Logo Manager</h3>
                <p>Automatic logo integration for all reports and dashboards</p>
            </div>

            <div className="logo-status-card">
                <h4>📊 Logo Status</h4>
                <div className="status-grid">
                    <div className="status-item">
                        <span className="status-label">Logo Loaded:</span>
                        <span className={`status-value ${logoStatus.logoLoaded ? 'success' : 'error'}`}>
                            {logoStatus.logoLoaded ? '✅ Yes' : '❌ No'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Setup Complete:</span>
                        <span className={`status-value ${logoStatus.setupComplete ? 'success' : 'warning'}`}>
                            {logoStatus.setupComplete ? '✅ Yes' : '⏳ In Progress'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Stored Logo:</span>
                        <span className={`status-value ${logoStatus.hasStoredLogo ? 'success' : 'error'}`}>
                            {logoStatus.hasStoredLogo ? '✅ Available' : '❌ None'}
                        </span>
                    </div>
                    <div className="status-item">
                        <span className="status-label">Upload Status:</span>
                        <span className={`status-value ${logoStatus.uploadInProgress ? 'warning' : 'success'}`}>
                            {logoStatus.uploadInProgress ? '⏳ In Progress' : '✅ Ready'}
                        </span>
                    </div>
                </div>
            </div>

            {previewUrl && (
                <div className="logo-preview-card">
                    <h4>🖼️ Current Logo Preview</h4>
                    <div className="logo-preview">
                        <img src={previewUrl} alt="Haramaya University Logo" className="logo-image" />
                    </div>
                </div>
            )}

            <div className="logo-actions-card">
                <h4>⚡ Quick Actions</h4>

                <div className="action-group primary-actions">
                    <button
                        onClick={handleForceUploadHaramaya}
                        disabled={isLoading}
                        className="primary-button"
                    >
                        🎓 Upload Haramaya Logo
                    </button>

                    <button
                        onClick={handleTestLoading}
                        disabled={isLoading}
                        className="test-button"
                    >
                        🧪 Test Logo Loading
                    </button>
                </div>

                <div className="action-group secondary-actions">
                    <label className="upload-button">
                        <input
                            type="file"
                            accept="image/*"
                            onChange={handleFileUpload}
                            disabled={isLoading}
                            style={{ display: 'none' }}
                        />
                        <span className="button-content">
                            📤 Upload Custom Logo
                        </span>
                    </label>

                    <button
                        onClick={handleForceReload}
                        disabled={isLoading}
                        className="reload-button"
                    >
                        🔄 Refresh System
                    </button>

                    {logoStatus.hasStoredLogo && (
                        <button
                            onClick={handleRemoveLogo}
                            disabled={isLoading}
                            className="remove-button"
                        >
                            🗑️ Remove Logo
                        </button>
                    )}
                </div>
            </div>

            {message && (
                <div className="message-card">
                    <p className="status-message">{message}</p>
                </div>
            )}

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner">⏳</div>
                    <p>Processing...</p>
                </div>
            )}

            <div className="info-card">
                <h4>ℹ️ Logo Integration Information</h4>
                <div className="info-grid">
                    <div className="info-item">
                        <span className="info-icon">📄</span>
                        <span>Automatically appears in all PDF reports</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🖥️</span>
                        <span>Integrated into dashboard headers</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">💾</span>
                        <span>Stored in browser for persistence</span>
                    </div>
                    <div className="info-item">
                        <span className="info-icon">🔄</span>
                        <span>Automatically loads on app startup</span>
                    </div>
                </div>
            </div>

            <div className="technical-info-card">
                <h4>🔧 Technical Details</h4>
                <ul>
                    <li><strong>Expected Path:</strong> /Haramaya-768x576.png</li>
                    <li><strong>Supported Formats:</strong> PNG, JPG, GIF, SVG</li>
                    <li><strong>Maximum File Size:</strong> 5MB</li>
                    <li><strong>Recommended Size:</strong> 200x200 pixels or larger</li>
                    <li><strong>Storage:</strong> Browser localStorage with base64 encoding</li>
                    <li><strong>Integration:</strong> PDF Generator + UI Components</li>
                </ul>
            </div>
        </div>
    );
};

export default AutoLogoManager;