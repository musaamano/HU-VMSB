import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createRequest, getCurrentUser } from '../../api/api';
import './SubmitVehicleRequest.css';

const vehicleTypes = ['Sedan', 'SUV', 'Hatchback', 'Van', 'Bus', 'Truck', 'Other'];

const SubmitVehicleRequest = () => {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();

  const [formData, setFormData] = useState({
    vehicleType: '',
    otherVehicleType: '',
    purpose: '',
    date: '',
    time: '',
    destination: '',
    passengers: 1,
    priority: 'normal',
    additionalNotes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.vehicleType) newErrors.vehicleType = 'Vehicle type is required';
    if (formData.vehicleType === 'Other' && !formData.otherVehicleType)
      newErrors.otherVehicleType = 'Please specify the vehicle type';
    if (!formData.purpose) newErrors.purpose = 'Purpose is required';
    if (!formData.date) newErrors.date = 'Date is required';
    if (!formData.time) newErrors.time = 'Time is required';
    if (!formData.destination) newErrors.destination = 'Destination is required';
    if (formData.passengers < 1) newErrors.passengers = 'At least 1 passenger required';
    const selectedDate = new Date(formData.date);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (selectedDate < today) newErrors.date = 'Date cannot be in the past';
    return newErrors;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newErrors = validateForm();
    if (Object.keys(newErrors).length > 0) { setErrors(newErrors); return; }

    setSubmitting(true);
    try {
      await createRequest({
        requestedBy: currentUser?._id,
        pickupLocation: 'Haramaya University',
        destination: formData.destination,
        purpose: formData.purpose,
        scheduledTime: new Date(`${formData.date}T${formData.time}`).toISOString(),
        passengerCount: Number(formData.passengers),
        priority: formData.priority,
        vehicleType: formData.vehicleType === 'Other' ? formData.otherVehicleType : formData.vehicleType,
        notes: formData.additionalNotes,
      });
      alert('✅ Vehicle request submitted! The transport officer will review it.');
      navigate('/user/my-requests');
    } catch (err) {
      alert(`Failed to submit: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="request-form-page">
      <h1 className="page-title">Submit Vehicle Request</h1>
      <div className="form-container">
        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            <div className="form-group">
              <label className="form-label">Vehicle Type <span className="required">*</span></label>
              <select name="vehicleType" value={formData.vehicleType} onChange={handleChange}
                className={`form-select ${errors.vehicleType ? 'error' : ''}`}>
                <option value="">Select vehicle type</option>
                {vehicleTypes.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
              {errors.vehicleType && <p className="error-message">{errors.vehicleType}</p>}
              {formData.vehicleType === 'Other' && (
                <div style={{ marginTop: 10 }}>
                  <input type="text" name="otherVehicleType" value={formData.otherVehicleType}
                    onChange={handleChange} placeholder="Specify vehicle type"
                    className={`form-input ${errors.otherVehicleType ? 'error' : ''}`} />
                  {errors.otherVehicleType && <p className="error-message">{errors.otherVehicleType}</p>}
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label">Priority</label>
              <select name="priority" value={formData.priority} onChange={handleChange} className="form-select">
                <option value="low">Low</option>
                <option value="normal">Normal</option>
                <option value="high">High</option>
                <option value="emergency">Emergency</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Purpose <span className="required">*</span></label>
              <input type="text" name="purpose" value={formData.purpose} onChange={handleChange}
                placeholder="e.g., Field trip, Conference, Airport pickup"
                className={`form-input ${errors.purpose ? 'error' : ''}`} />
              {errors.purpose && <p className="error-message">{errors.purpose}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Destination <span className="required">*</span></label>
              <input type="text" name="destination" value={formData.destination} onChange={handleChange}
                placeholder="Enter destination"
                className={`form-input ${errors.destination ? 'error' : ''}`} />
              {errors.destination && <p className="error-message">{errors.destination}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Date <span className="required">*</span></label>
              <input type="date" name="date" value={formData.date} onChange={handleChange}
                min={new Date().toISOString().split('T')[0]}
                className={`form-input ${errors.date ? 'error' : ''}`} />
              {errors.date && <p className="error-message">{errors.date}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Time <span className="required">*</span></label>
              <input type="time" name="time" value={formData.time} onChange={handleChange}
                className={`form-input ${errors.time ? 'error' : ''}`} />
              {errors.time && <p className="error-message">{errors.time}</p>}
            </div>

            <div className="form-group">
              <label className="form-label">Number of Passengers <span className="required">*</span></label>
              <input type="number" name="passengers" value={formData.passengers} onChange={handleChange}
                min="1" max="50"
                className={`form-input ${errors.passengers ? 'error' : ''}`} />
              {errors.passengers && <p className="error-message">{errors.passengers}</p>}
            </div>

            <div className="form-group full-width">
              <label className="form-label">Additional Notes (Optional)</label>
              <textarea name="additionalNotes" value={formData.additionalNotes} onChange={handleChange}
                rows="4" placeholder="Any special requirements or instructions..."
                className="form-textarea" />
            </div>
          </div>

          <div className="form-actions">
            <button type="submit" className="btn-submit" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit Request'}
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

export default SubmitVehicleRequest;
