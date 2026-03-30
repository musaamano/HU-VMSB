import { useState } from 'react';
import logoHelper from '../utils/logoHelper';
import './LogoUpload.css';

const LogoUpload = () => {
    const [uploading, setUploading] = useState(false);
    const [status, setStatus] = useState(logoHelper.getStatus());
    const [message, setMessage] = useState('');

    const handleFileUpload = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            setMessage('Please select a valid image file');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            setMessage('File size must be less than 2MB');
            return;
        }

        setUploading(true);
        setMessage('Uploading logo...');

        try {
            const result = await logoHelper.loadFromFile(file);

            if (result.success) {
                setStatus(logoHelper.getStatus());
                setMessage('✅ University logo uploaded successfully! It will appear on all PDF reports.');
            } else {
                setMessage('❌ ' + result.message);
            }
        } catch (error) {
            setMessage('❌ Failed to upload logo: ' + error.message);
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveLogo = () => {
        logoHelper.removeLogo();
        setStatus(logoHelper.getStatus());
        setMessage('Logo removed. PDF reports will use placeholder logo.');
    };

    return (
        <div className="logo-upload-container">
            <div className="logo-upload-header">
                <h3>🏛️ University Logo Settings</h3>
                <p>Upload the official Haramaya University logo for PDF reports</p>
            </div>

            <div className="logo-status">
                <div className={`status-indicator ${status.loaded ? 'active' : 'inactive'}`}>
                    <span className="status-dot"></span>
                    <span className="status-text">{status.message}</span>
                </div>
            </div>

            <div className="logo-upload-section">
                <div className="upload-area">
                    <input
                        type="file"
                        id="logo-upload"
                        accept="image/*"
                        onChange={handleFileUpload}
                        disabled={uploading}
                        className="file-input"
                    />
                    <label htmlFor="logo-upload" className={`upload-label ${uploading ? 'uploading' : ''}`}>
                        {uploading ? (
                            <>
                                <span className="upload-spinner">⏳</span>
                                Uploading...
                            </>
                        ) : (
                            <>
                                <span className="upload-icon">📁</span>
                                Choose Logo File
                            </>
                        )}
                    </label>
                </div>

                {status.loaded && (
                    <button
                        onClick={handleRemoveLogo}
                        className="remove-logo-btn"
                        disabled={uploading}
                    >
                        🗑️ Remove Logo
                    </button>
                )}
            </div>

            {message && (
                <div className={`message ${message.includes('✅') ? 'success' : message.includes('❌') ? 'error' : 'info'}`}>
                    {message}
                </div>
            )}

            <div className="logo-info">
                <h4>📋 Logo Sources:</h4>
                <ul>
                    <li><strong>Automatic:</strong> Loads from public/Haramaya-768x576.png if available</li>
                    <li><strong>Upload:</strong> PNG, JPG, or GIF files</li>
                    <li><strong>Maximum file size:</strong> 2MB</li>
                    <li><strong>Recommended size:</strong> 200x200 pixels or larger</li>
                    <li><strong>Square images work best</strong> for circular display</li>
                </ul>
            </div>

            <div className="logo-preview-info">
                <h4>🔍 Where it appears:</h4>
                <ul>
                    <li>Top-right corner of all PDF reports</li>
                    <li>Fuel Station Reports</li>
                    <li>Gate Security Reports</li>
                    <li>Driver Reports</li>
                    <li>All other PDF exports</li>
                </ul>
            </div>
        </div>
    );
};

export default LogoUpload;