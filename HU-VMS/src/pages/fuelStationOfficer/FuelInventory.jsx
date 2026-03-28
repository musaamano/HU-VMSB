import { useState, useEffect } from 'react';
import './FuelInventory.css';
import './fuelstation.css';

const BASE = '/api';
const token = () => localStorage.getItem('authToken');
const req = async (url, opts = {}) => {
  const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers } });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const FuelInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState('');

  const [showModal, setShowModal] = useState(false);
  const [modalData, setModalData] = useState({
    fuelType: '',
    litersAdded: '',
    reason: ''
  });
  const [modalErrors, setModalErrors] = useState({});

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(''), 3500); };

  const loadInventory = async () => {
    setLoading(true);
    try {
      const data = await req(`${BASE}/fuel/inventory`).catch(() => []);
      setInventory(Array.isArray(data) ? data : []);
    } catch (err) {
      notify('Error loading inventory: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadInventory(); }, []);

  const handleUpdateStock = (fuelType) => {
    setModalData({
      fuelType: fuelType,
      litersAdded: '',
      reason: ''
    });
    setModalErrors({});
    setShowModal(true);
  };

  const handleModalChange = (e) => {
    const { name, value } = e.target;
    setModalData(prev => ({
      ...prev,
      [name]: value
    }));
    if (modalErrors[name]) {
      setModalErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateModal = () => {
    const errors = {};

    if (!modalData.litersAdded) errors.litersAdded = 'Liters added is required';
    if (!modalData.reason) errors.reason = 'Reason is required';

    if (modalData.litersAdded) {
      const liters = parseFloat(modalData.litersAdded);
      if (liters <= 0) errors.litersAdded = 'Liters must be positive';

      const item = inventory.find(i => i.fuelType === modalData.fuelType);
      if (item) {
        const currentStock = item.currentStock;
        const capacity = item.capacity || 10000; // Default capacity if not set

        if (currentStock + liters > capacity) {
          errors.litersAdded = `Cannot exceed capacity. Maximum: ${capacity - currentStock}L`;
        }
      }
    }

    return errors;
  };

  const handleModalSubmit = async (e) => {
    e.preventDefault();
    const errors = validateModal();

    if (Object.keys(errors).length === 0) {
      const litersAdded = parseFloat(modalData.litersAdded);

      try {
        await req(`${BASE}/fuel/inventory/${modalData.fuelType}/refill`, {
          method: 'PUT',
          body: JSON.stringify({ amount: litersAdded }),
        });

        notify(`Stock updated successfully!\n${modalData.fuelType}: +${litersAdded}L`);
        setShowModal(false);
        await loadInventory(); // Reload inventory data
      } catch (err) {
        notify('Error updating stock: ' + err.message);
      }
    } else {
      setModalErrors(errors);
    }
  };

  const getStockLevel = (available, capacity) => {
    const percentage = (available / capacity) * 100;
    if (percentage > 50) return 'high';
    if (percentage > 20) return 'medium';
    return 'low';
  };

  const getStockPercentage = (available, capacity) => {
    return ((available / capacity) * 100).toFixed(1);
  };

  return (
    <div className="fuel-inventory-page">
      {toast && (
        <div style={{ position: 'fixed', top: 20, right: 20, background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 10, zIndex: 9999, fontSize: 14 }}>
          {toast}
        </div>
      )}

      <div className="fuel-page-header">
        <h2>Fuel Inventory Management</h2>
        <p>Monitor and update fuel stock levels</p>
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading inventory...</p>
      ) : (
        <>
          {/* Inventory Cards */}
          <div className="fuel-inventory-grid">
            {inventory.map(item => (
              <div key={item.fuelType} className="fuel-inventory-card">
                <div className="fuel-inventory-header">
                  <div className="fuel-type-info">
                    <span className="fuel-type-icon" style={{ color: item.fuelType === 'Diesel' ? '#22c55e' : '#f59e0b' }}>
                      {item.fuelType === 'Diesel' ? '🟢' : '🟠'}
                    </span>
                    <h3>{item.fuelType}</h3>
                  </div>
                  <span className={`stock-level-badge ${getStockLevel(item.currentStock, item.capacity || 10000)}`}>
                    {getStockPercentage(item.currentStock, item.capacity || 10000)}%
                  </span>
                </div>

                <div className="fuel-inventory-content">
                  <div className="fuel-amount">
                    <span className="amount-value">{item.currentStock.toLocaleString()}</span>
                    <span className="amount-unit">Liters</span>
                  </div>

                  <div className="fuel-capacity">
                    <span>Capacity: {(item.capacity || 10000).toLocaleString()}L</span>
                  </div>

                  <div className="fuel-progress-bar">
                    <div
                      className={`fuel-progress-fill ${getStockLevel(item.currentStock, item.capacity || 10000)}`}
                      style={{ width: `${getStockPercentage(item.currentStock, item.capacity || 10000)}%` }}
                    ></div>
                  </div>

                  <div className="fuel-last-updated">
                    Last Updated: {item.lastRefilled ? new Date(item.lastRefilled).toLocaleString() : 'Never'}
                  </div>

                  <button
                    className="fuel-btn-update"
                    onClick={() => handleUpdateStock(item.fuelType)}
                  >
                    <span>📦</span> Update Stock
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Update Stock Modal */}
          {showModal && (
            <div className="fuel-modal-overlay" onClick={() => setShowModal(false)}>
              <div className="fuel-modal" onClick={(e) => e.stopPropagation()}>
                <div className="fuel-modal-header">
                  <h3>Update {modalData.fuelType.charAt(0).toUpperCase() + modalData.fuelType.slice(1)} Stock</h3>
                  <button
                    className="fuel-modal-close"
                    onClick={() => setShowModal(false)}
                  >
                    ×
                  </button>
                </div>

                <form onSubmit={handleModalSubmit}>
                  <div className="fuel-modal-content">
                    <div className="fuel-form-group">
                      <label className="fuel-form-label">
                        Fuel Type
                      </label>
                      <input
                        type="text"
                        value={modalData.fuelType.charAt(0).toUpperCase() + modalData.fuelType.slice(1)}
                        disabled
                        className="fuel-form-input disabled"
                      />
                    </div>

                    <div className="fuel-form-group">
                      <label className="fuel-form-label">
                        Liters Added <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        name="litersAdded"
                        value={modalData.litersAdded}
                        onChange={handleModalChange}
                        placeholder="Enter liters to add"
                        step="0.1"
                        min="0"
                        className={`fuel-form-input ${modalErrors.litersAdded ? 'error' : ''}`}
                      />
                      {modalErrors.litersAdded && <p className="fuel-error-message">{modalErrors.litersAdded}</p>}
                    </div>

                    <div className="fuel-form-group">
                      <label className="fuel-form-label">
                        Reason <span className="required">*</span>
                      </label>
                      <select
                        name="reason"
                        value={modalData.reason}
                        onChange={handleModalChange}
                        className={`fuel-form-select ${modalErrors.reason ? 'error' : ''}`}
                      >
                        <option value="">Select reason</option>
                        <option value="Fuel Delivery">Fuel Delivery</option>
                        <option value="Tank Refill">Tank Refill</option>
                        <option value="Emergency Refill">Emergency Refill</option>
                        <option value="Inventory Correction">Inventory Correction</option>
                        <option value="Other">Other</option>
                      </select>
                      {modalErrors.reason && <p className="fuel-error-message">{modalErrors.reason}</p>}
                    </div>
                  </div>

                  <div className="fuel-modal-actions">
                    <button type="submit" className="fuel-btn-primary">
                      Update Stock
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowModal(false)}
                      className="fuel-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default FuelInventory;