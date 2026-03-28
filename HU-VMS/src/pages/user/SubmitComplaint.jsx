import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createComplaint } from '../../api/api';
import './SubmitComplaint.css';

// Maps user-friendly labels to DB enum values
const CATEGORY_MAP = {
  'Vehicle Issue':    'Vehicle Condition',
  'Driver Behavior':  'Driver Behavior',
  'Delay':            'Late Arrival',
  'Route Problem':    'Route Issue',
  'Fuel / Resource': 'Fuel Issue',
  'Safety Concern':   'Safety Concern',
  'Other':            'Other',
};

const PRIORITY_MAP = {
  'Low': 'Low',
  'Medium': 'Medium',
  'High': 'High',
  'Critical': 'Critical',
};

const SubmitComplaint = ({ onSubmit }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    category: '',
    priority: 'Medium',
    vehicle: '',
    driver: '',
    tripId: '',
    description: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const categories = Object.keys(CATEGORY_MAP);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      name: file.name,
      size: file.size,
      type: file.type,
      file: file
    }));
    
    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};
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
        vehicle: formData.vehicle,
        driver: formData.driver,
        tripId: formData.tripId,
      });
      if (onSubmit) onSubmit(formData);
      alert('✅ Complaint submitted successfully!');
      navigate('/user');
    } catch (err) {
      alert(`Failed to submit: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="complaint-form-page">
      <h1 className="page-title">Submit Complaint</h1>
      
      <div className="form-container">
        <form onSubmit={handleSubmit}>

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

          <div className="form-group">
            <label className="form-label">Priority</label>
            <select
              name="priority"
              value={formData.priority}
              onChange={handleChange}
              className="form-select"
            >
              {Object.keys(PRIORITY_MAP).map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Vehicle Plate (optional)</label>
            <input
              type="text"
              name="vehicle"
              value={formData.vehicle}
              onChange={handleChange}
              placeholder="e.g. ET-AA-001 Toyota Coaster"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Driver Name (optional)</label>
            <input
              type="text"
              name="driver"
              value={formData.driver}
              onChange={handleChange}
              placeholder="e.g. Abebe Kebede"
              className="form-input"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Trip ID (optional)</label>
            <input
              type="text"
              name="tripId"
              value={formData.tripId}
              onChange={handleChange}
              placeholder="e.g. TRIP-2025-001"
              className="form-input"
            />
          </div>

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
              {submitting ? 'Submitting...' : 'Submit Complaint'}
            </button>
            <button type="button" onClick={() => navigate('/user')} className="btn-cancel">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SubmitComplaint;