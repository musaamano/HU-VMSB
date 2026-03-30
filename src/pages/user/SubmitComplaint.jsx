import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComplaint } from '../../api/api';
import './SubmitComplaint.css';

const CATEGORY_MAP = {
  'Vehicle Issue':    'Vehicle Condition',
  'Driver Behavior':  'Driver Behavior',
  'Delay':            'Late Arrival',
  'Route Problem':    'Route Issue',
  'Fuel / Resource':  'Fuel Issue',
  'Safety Concern':   'Safety Concern',
  'Other':            'Other',
};

const PRIORITY_MAP = {
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Critical': 'Critical',
};

const RECIPIENT_OPTIONS = [
  {
    value: 'admin',
    label: 'Admin Office',
    icon: '🏢',
    desc: 'General system issues, policy concerns, account problems'
  },
  {
    value: 'transport',
    label: 'Transport Office',
    icon: '🚌',
    desc: 'Vehicle condition, driver behavior, trip & fuel issues'
  },
];

const SubmitComplaint = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    recipient: '',
    category: '',
    priority: 'Medium',
    vehicle: '',
    driver: '',
    tripId: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const categories = Object.keys(CATEGORY_MAP);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.recipient) newErrors.recipient = 'Please select a recipient';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.description) newErrors.description = 'Description is required';
    if (formData.description.length < 10) newErrors.description = 'Description must be at least 10 characters';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);
    try {
      await createComplaint({
        category: CATEGORY_MAP[formData.category],
        priority: formData.priority,
        description: formData.description,
        vehicle: formData.vehicle || undefined,
        driver: formData.driver || undefined,
        tripId: formData.tripId || undefined,
        recipient: formData.recipient,           // 'admin' | 'transport'
        recipientLabel: RECIPIENT_OPTIONS.find(r => r.value === formData.recipient)?.label,
      });
      if (onSubmit) onSubmit(formData);
      setSubmitted(true);
    } catch (err) {
      alert(`Failed to submit: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success State ──
  if (submitted) {
    const recipient = RECIPIENT_OPTIONS.find(r => r.value === formData.recipient);
    return (
      <div className="complaint-form-page">
        <div className="complaint-success-card">
          <div className="success-icon-ring">✅</div>
          <h2>Complaint Submitted</h2>
          <p>Your complaint has been forwarded to the <strong>{recipient?.label}</strong>.</p>
          <p style={{ fontSize: 13, color: '#94a3b8', marginTop: 8 }}>
            You will be notified once it is reviewed. Typical response time: 24–48 hours.
          </p>
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 28 }}>
            <button className="btn-submit" onClick={() => navigate('/user/dashboard')}>
              Back to Dashboard
            </button>
            <button className="btn-cancel" onClick={() => { setSubmitted(false); setFormData({ recipient: '', category: '', priority: 'Medium', vehicle: '', driver: '', tripId: '', description: '' }); }}>
              Submit Another
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="complaint-form-page">
      <h1 className="page-title">Submit Complaint</h1>
      <p style={{ color: '#64748b', marginBottom: 28, fontSize: 14 }}>
        Select who should receive your complaint, then fill in the details below.
      </p>

      <div className="form-container">
        <form onSubmit={handleSubmit}>

          {/* ── Recipient Selector ── */}
          <div className="form-group">
            <label className="form-label">
              Send To <span className="required">*</span>
            </label>
            <div className="recipient-grid">
              {RECIPIENT_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  className={`recipient-card ${formData.recipient === opt.value ? 'selected' : ''}`}
                  onClick={() => { setFormData(prev => ({ ...prev, recipient: opt.value })); setErrors(prev => ({ ...prev, recipient: '' })); }}
                >
                  <span className="recipient-icon">{opt.icon}</span>
                  <div>
                    <div className="recipient-label">{opt.label}</div>
                    <div className="recipient-desc">{opt.desc}</div>
                  </div>
                  <div className="recipient-check">{formData.recipient === opt.value ? '✓' : ''}</div>
                </div>
              ))}
            </div>
            {errors.recipient && <p className="error-message">{errors.recipient}</p>}
          </div>

          {/* ── Category ── */}
          <div className="form-group">
            <label className="form-label">Complaint Category <span className="required">*</span></label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              className={`form-select ${errors.category ? 'error' : ''}`}
            >
              <option value="">Select category</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
            {errors.category && <p className="error-message">{errors.category}</p>}
          </div>

          {/* ── Priority ── */}
          <div className="form-group">
            <label className="form-label">Priority</label>
            <select name="priority" value={formData.priority} onChange={handleChange} className="form-select">
              {Object.keys(PRIORITY_MAP).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          {/* ── Optional Fields ── */}
          <div className="form-group">
            <label className="form-label">Vehicle Plate (optional)</label>
            <input type="text" name="vehicle" value={formData.vehicle} onChange={handleChange} placeholder="e.g. ET-AA-001 Toyota Coaster" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Driver Name (optional)</label>
            <input type="text" name="driver" value={formData.driver} onChange={handleChange} placeholder="e.g. Abebe Kebede" className="form-input" />
          </div>

          <div className="form-group">
            <label className="form-label">Trip ID (optional)</label>
            <input type="text" name="tripId" value={formData.tripId} onChange={handleChange} placeholder="e.g. TRIP-2025-001" className="form-input" />
          </div>

          {/* ── Description ── */}
          <div className="form-group">
            <label className="form-label">Description <span className="required">*</span></label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="6"
              placeholder="Please describe your complaint in detail..."
              className={`form-textarea ${errors.description ? 'error' : ''}`}
            />
            {errors.description && <p className="error-message">{errors.description}</p>}
            <p className="hint-text">Minimum 10 characters</p>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : '📤 Submit Complaint'}
            </button>
            <button type="button" onClick={() => navigate('/user/dashboard')} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;