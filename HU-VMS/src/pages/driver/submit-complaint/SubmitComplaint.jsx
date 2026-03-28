import { useState } from 'react';
import driverService from '../../../services/driverService';
import pdfGenerator from '../../../utils/pdfGenerator';
import ExportButton from '../../../components/ExportButton';
import './SubmitComplaint.css';

const SubmitComplaint = () => {
    const [formData, setFormData] = useState({
        recipient: 'transport-office',
        category: 'general',
        subject: '',
        description: '',
        priority: 'normal'
    });
    const [submitting, setSubmitting] = useState(false);
    const [submitted, setSubmitted] = useState(false);

    const categories = [
        { value: 'general', label: 'General Inquiry' },
        { value: 'vehicle', label: 'Vehicle Issue' },
        { value: 'schedule', label: 'Schedule Concern' },
        { value: 'passenger', label: 'Passenger Issue' },
        { value: 'route', label: 'Route Problem' },
        { value: 'safety', label: 'Safety Concern' },
        { value: 'equipment', label: 'Equipment Issue' },
        { value: 'other', label: 'Other' }
    ];

    const priorities = [
        { value: 'low', label: 'Low', color: '#28a745' },
        { value: 'normal', label: 'Normal', color: '#17a2b8' },
        { value: 'high', label: 'High', color: '#ffc107' },
        { value: 'urgent', label: 'Urgent', color: '#dc3545' }
    ];

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!formData.subject.trim() || !formData.description.trim()) {
            alert('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            await driverService.submitComplaint(formData);
            setSubmitted(true);

            // Reset form after 2 seconds
            setTimeout(() => {
                setFormData({
                    recipient: 'transport-office',
                    category: 'general',
                    subject: '',
                    description: '',
                    priority: 'normal'
                });
                setSubmitted(false);
            }, 2000);
        } catch (error) {
            console.error('Failed to submit complaint:', error);
            alert('Failed to submit complaint. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleExportPDF = async (recipient) => {
        try {
            const reportData = {
                type: formData.category,
                description: `${formData.subject}\n\n${formData.description}`,
                date: new Date().toLocaleDateString(),
                driverName: 'John Doe', // Replace with actual driver name
                vehicleId: 'VEH-001', // Replace with actual vehicle ID
                contact: 'driver@example.com' // Replace with actual contact
            };

            const fileName = pdfGenerator.generateComplaintReport(reportData, recipient);
            alert(`PDF exported successfully: ${fileName}\nSent to: ${recipient === 'Admin' ? 'Administration Office' : 'Transport Office'}`);
        } catch (error) {
            console.error('Failed to export PDF:', error);
            throw error;
        }
    };

    if (submitted) {
        return (
            <div className="submit-complaint">
                <div className="success-message">
                    <div className="success-icon">✓</div>
                    <h2>Complaint Submitted Successfully!</h2>
                    <p>Your complaint has been sent to the {formData.recipient === 'admin' ? 'Admin' : 'Transport Office'}.</p>
                    <p>You will receive a response soon.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="submit-complaint">
            <div className="page-header">
                <h2>Submit Complaint / Feedback</h2>
                <p>Report issues or provide feedback to the administration</p>
            </div>

            <form onSubmit={handleSubmit} className="complaint-form">
                <div className="form-row">
                    <div className="form-group">
                        <label>Send To <span className="required">*</span></label>
                        <select
                            name="recipient"
                            value={formData.recipient}
                            onChange={handleChange}
                            required
                        >
                            <option value="transport-office">Transport Office</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Category <span className="required">*</span></label>
                        <select
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            required
                        >
                            {categories.map(cat => (
                                <option key={cat.value} value={cat.value}>{cat.label}</option>
                            ))}
                        </select>
                    </div>
                </div>

                <div className="form-group">
                    <label>Priority <span className="required">*</span></label>
                    <div className="priority-buttons">
                        {priorities.map(priority => (
                            <button
                                key={priority.value}
                                type="button"
                                className={`priority-btn ${formData.priority === priority.value ? 'active' : ''}`}
                                style={{
                                    borderColor: formData.priority === priority.value ? priority.color : '#dee2e6',
                                    backgroundColor: formData.priority === priority.value ? priority.color : 'white',
                                    color: formData.priority === priority.value ? 'white' : '#495057'
                                }}
                                onClick={() => setFormData({ ...formData, priority: priority.value })}
                            >
                                {priority.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="form-group">
                    <label>Subject <span className="required">*</span></label>
                    <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="Brief description of your complaint"
                        required
                        maxLength={100}
                    />
                    <span className="char-count">{formData.subject.length}/100</span>
                </div>

                <div className="form-group">
                    <label>Description <span className="required">*</span></label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows="8"
                        placeholder="Provide detailed information about your complaint or feedback..."
                        required
                        maxLength={1000}
                    />
                    <span className="char-count">{formData.description.length}/1000</span>
                </div>

                <div className="form-actions">
                    <button
                        type="submit"
                        disabled={submitting}
                        className="btn-submit"
                    >
                        {submitting ? 'Submitting...' : 'Submit Complaint'}
                    </button>
                    <ExportButton
                        onExport={handleExportPDF}
                        disabled={!formData.subject.trim() || !formData.description.trim()}
                        label="Export PDF"
                    />
                    <button
                        type="button"
                        onClick={() => setFormData({
                            recipient: 'transport-office',
                            category: 'general',
                            subject: '',
                            description: '',
                            priority: 'normal'
                        })}
                        className="btn-reset"
                    >
                        Reset Form
                    </button>
                </div>
            </form>

            <div className="info-box">
                <h4>📋 Guidelines for Submitting Complaints</h4>
                <ul>
                    <li>Be clear and specific about the issue</li>
                    <li>Include relevant details (date, time, location, etc.)</li>
                    <li>Choose the appropriate category and priority</li>
                    <li>Maintain professional language</li>
                    <li>You will receive a response within 24-48 hours</li>
                </ul>
            </div>
        </div>
    );
};

export default SubmitComplaint;
