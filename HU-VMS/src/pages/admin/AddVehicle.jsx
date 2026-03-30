import { useState } from 'react';
import { createVehicle } from '../../api/api';
import './addVehicle.css';

const AddVehicle = () => {
  const [formData, setFormData] = useState({
    vehicleId: '',
    plateNumber: '',
    model: '',
    type: '',
    capacity: '',
    year: '',
    color: '',
    status: 'Available'
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setMessage(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await createVehicle({ ...formData, capacity: Number(formData.capacity) });
      setMessage({ type: 'success', text: 'Vehicle added successfully!' });
      setFormData({ plateNumber: '', model: '', type: '', capacity: '', year: '', color: '', status: 'available' });
    } catch (err) {
      setMessage({ type: 'error', text: err.message || 'Failed to add vehicle' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="add-vehicle-container" style={{ background: 'white', minHeight: '100vh', padding: '30px' }}>
      <h1 style={{ color: '#32CD32', fontSize: '32px', marginBottom: '30px', display: 'block' }}>🚗 Add New Vehicle</h1>

      <div className="form-card">
        <form onSubmit={handleSubmit}>
          {message && (
            <div style={{
              padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', fontSize: '14px',
              background: message.type === 'success' ? '#f0fdf4' : '#fef2f2',
              color: message.type === 'success' ? '#16a34a' : '#dc2626',
              border: `1px solid ${message.type === 'success' ? '#bbf7d0' : '#fecaca'}`
            }}>
              {message.text}
            </div>
          )}
          <div className="form-row">
            <div className="form-group">
              <label>Vehicle ID</label>
              <input
                type="text"
                name="vehicleId"
                value={formData.vehicleId}
                onChange={handleChange}
                placeholder="VH-001"
                required
              />
            </div>
            <div className="form-group">
              <label>Plate Number</label>
              <input
                type="text"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                placeholder="ABC-1234"
                required
              />
            </div>

            <div className="form-group">
              <label>Model</label>
              <input
                type="text"
                name="model"
                value={formData.model}
                onChange={handleChange}
                placeholder="Toyota Hiace"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Type</label>
              <select
                name="type"
                value={formData.type}
                onChange={handleChange}
                required
              >
                <option value="">Select Type</option>
                <option value="Van">Van</option>
                <option value="Bus">Bus</option>
                <option value="Truck">Truck</option>
                <option value="Car">Car</option>
                <option value="Pickup">Pickup</option>
              </select>
            </div>

            <div className="form-group">
              <label>Capacity</label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                placeholder="15"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Year</label>
              <input
                type="number"
                name="year"
                value={formData.year}
                onChange={handleChange}
                placeholder="2024"
                required
              />
            </div>

            <div className="form-group">
              <label>Color</label>
              <input
                type="text"
                name="color"
                value={formData.color}
                onChange={handleChange}
                placeholder="White"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                required
              >
                <option value="Available">Available</option>
                <option value="Assigned">Assigned</option>
                <option value="Maintenance">Maintenance</option>
                <option value="Out of Service">Out of Service</option>
              </select>
            </div>
          </div>

          <button type="submit" className="btn-submit" disabled={loading}>
            {loading ? 'Saving...' : 'Add Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AddVehicle;
