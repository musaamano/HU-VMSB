import { useState } from 'react';
import driverService from '../../../services/driverService';
import './ExitEntryVerification.css';

const ExitEntryVerification = () => {
    const [verificationType, setVerificationType] = useState('exit');
    const [formData, setFormData] = useState({
        gateLocation: '',
        timestamp: new Date().toISOString(),
        notes: ''
    });
    const [submitting, setSubmitting] = useState(false);
    const [history, setHistory] = useState([]);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);

        try {
            if (verificationType === 'exit') {
                await driverService.confirmExit(formData);
            } else {
                await driverService.confirmEntry(formData);
            }

            alert(`${verificationType === 'exit' ? 'Exit' : 'Entry'} confirmed successfully`);
            setFormData({
                gateLocation: '',
                timestamp: new Date().toISOString(),
                notes: ''
            });
        } catch (error) {
            console.error('Failed to confirm verification:', error);
            alert('Failed to submit verification');
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="exit-entry-verification">
            <h2>Gate Verification</h2>

            <div className="verification-type-selector">
                <button
                    className={verificationType === 'exit' ? 'active' : ''}
                    onClick={() => setVerificationType('exit')}
                >
                    🚪 Exit
                </button>
                <button
                    className={verificationType === 'entry' ? 'active' : ''}
                    onClick={() => setVerificationType('entry')}
                >
                    🏠 Entry
                </button>
            </div>

            <form onSubmit={handleSubmit} className="verification-form">
                <div className="form-group">
                    <label>Gate Location</label>
                    <select
                        name="gateLocation"
                        value={formData.gateLocation}
                        onChange={handleChange}
                        required
                    >
                        <option value="">Select Gate</option>
                        <option value="main-gate">Main Gate</option>
                        <option value="north-gate">North Gate</option>
                        <option value="south-gate">South Gate</option>
                        <option value="east-gate">East Gate</option>
                    </select>
                </div>

                <div className="form-group">
                    <label>Timestamp</label>
                    <input
                        type="datetime-local"
                        name="timestamp"
                        value={formData.timestamp.slice(0, 16)}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Notes (Optional)</label>
                    <textarea
                        name="notes"
                        value={formData.notes}
                        onChange={handleChange}
                        rows="3"
                        placeholder="Any additional notes..."
                    />
                </div>

                <button type="submit" disabled={submitting} className="btn-primary">
                    Confirm {verificationType === 'exit' ? 'Exit' : 'Entry'}
                </button>
            </form>

            <div className="ai-tracking-info">
                <p>ℹ️ AI-based tracking is active. Manual confirmation helps verify automated records.</p>
            </div>
        </div>
    );
};

export default ExitEntryVerification;
