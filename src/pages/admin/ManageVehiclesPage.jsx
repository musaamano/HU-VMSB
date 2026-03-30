import { useState, useEffect } from 'react';
import { getVehicles, updateVehicle, deleteVehicle } from '../../api/api';
import './manageVehiclesPage.css';

const getStatusClass = (status) => {
  switch (status) {
    case 'available':      return 'status-available';
    case 'in-use':         return 'status-assigned';
    case 'maintenance':    return 'status-maintenance';
    case 'out-of-service': return 'status-maintenance';
    default: return '';
  }
};

const ManageVehiclesPage = () => {
  const [vehicles, setVehicles]           = useState([]);
  const [loading, setLoading]             = useState(true);
  const [searchTerm, setSearchTerm]       = useState('');
  const [filterStatus, setFilterStatus]   = useState('All');
  const [sortBy, setSortBy]               = useState('plateNumber');
  const [sortOrder, setSortOrder]         = useState('asc');
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editFormData, setEditFormData]   = useState({});
  const [showOtherType, setShowOtherType] = useState(false);
  const [currentPage, setCurrentPage]     = useState(1);
  const [itemsPerPage, setItemsPerPage]   = useState(15);

  useEffect(() => { loadVehicles(); }, []);

  const loadVehicles = async () => {
    try {
      const data = await getVehicles();
      setVehicles(data);
    } catch (err) {
      console.error('Failed to load vehicles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowDetailsModal(true);
  };

  const handleEditClick = (vehicle) => {
    setSelectedVehicle(vehicle);
    setEditFormData({
      plateNumber: vehicle.plateNumber || '',
      model:       vehicle.model       || '',
      type:        vehicle.type        || 'car',
      capacity:    vehicle.capacity    || '',
      status:      vehicle.status      || 'available',
      fuelLevel:   vehicle.fuelLevel   ?? 100,
      mileage:     vehicle.mileage     ?? 0,
      year:        vehicle.year        || '',
      color:       vehicle.color       || '',
      destination: vehicle.destination || '',
    });
    setShowEditModal(true);
    setShowOtherType(false);
  };

  const handleEditSave = async () => {
    try {
      const updated = await updateVehicle(selectedVehicle._id, editFormData);
      setVehicles(vehicles.map(v => v._id === selectedVehicle._id ? updated : v));
      setShowEditModal(false);
    } catch (err) {
      alert('Failed to update vehicle: ' + err.message);
    }
  };

  const handleTypeChange = (value) => {
    if (value === 'Other') { setShowOtherType(true); setEditFormData(f => ({ ...f, type: '' })); }
    else { setShowOtherType(false); setEditFormData(f => ({ ...f, type: value })); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this vehicle?')) return;
    try {
      await deleteVehicle(id);
      setVehicles(vehicles.filter(v => v._id !== id));
    } catch (err) {
      alert('Failed to delete: ' + err.message);
    }
  };

  const driverName = (v) => v.assignedDriverName || v.assignedDriver?.name || '—';

  const filteredVehicles = vehicles.filter(v => {
    const matchesSearch =
      (v.plateNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (v.model || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      driverName(v).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || v.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const sortedVehicles = [...filteredVehicles].sort((a, b) => {
    let aVal = a[sortBy] ?? '';
    let bVal = b[sortBy] ?? '';
    if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field) => {
    if (sortBy === field) setSortOrder(o => o === 'asc' ? 'desc' : 'asc');
    else { setSortBy(field); setSortOrder('asc'); }
  };

  const totalPages  = Math.ceil(sortedVehicles.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const currentVehicles = sortedVehicles.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages = [];
    // always show first 2
    pages.push(1);
    if (totalPages > 1) pages.push(2);
    // ellipsis if current page is far from start
    if (currentPage > 4) pages.push('...');
    // pages around current
    for (let i = Math.max(3, currentPage - 1); i <= Math.min(totalPages - 2, currentPage + 1); i++) {
      pages.push(i);
    }
    // ellipsis before last
    if (currentPage < totalPages - 3) pages.push('...');
    // always show last page
    if (totalPages > 2) pages.push(totalPages);
    return [...new Set(pages)];
  };

  const SortTh = ({ field, label }) => (
    <th onClick={() => handleSort(field)} className="sortable">
      {label} {sortBy === field && (sortOrder === 'asc' ? '▲' : '▼')}
    </th>
  );

  return (
    <div className="manage-vehicles-container">
      <div className="page-header">
        <h1>📋 View Vehicle List</h1>
        <p className="page-subtitle">Manage all vehicles in the system</p>
      </div>

      {loading ? <div style={{ padding: 40, textAlign: 'center' }}>Loading vehicles...</div> : (
        <>
          <div className="controls-bar">
            <input type="text" placeholder="🔍 Search by Plate, Model or Driver..."
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="search-input" />

            <select value={filterStatus}
              onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
              className="filter-select">
              <option value="All">All Status</option>
              <option value="available">Available</option>
              <option value="in-use">In Use</option>
              <option value="maintenance">Maintenance</option>
              <option value="out-of-service">Out of Service</option>
            </select>

            <select value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="filter-select">
              <option value="10">10 per page</option>
              <option value="15">15 per page</option>
              <option value="25">25 per page</option>
              <option value="50">50 per page</option>
              <option value={sortedVehicles.length}>Show All</option>
            </select>
          </div>

          <div className="table-container" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            <table className="vehicles-table">
              <thead>
                <tr>
                  <SortTh field="plateNumber" label="Plate Number" />
                  <SortTh field="model"       label="Model" />
                  <SortTh field="type"        label="Type" />
                  <SortTh field="assignedDriverName" label="Driver" />
                  <SortTh field="status"      label="Status" />
                  <SortTh field="fuelLevel"   label="Fuel Level" />
                  <SortTh field="mileage"     label="Mileage" />
                  <SortTh field="createdAt"   label="Registered" />
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {currentVehicles.map(v => (
                  <tr key={v._id}>
                    <td><strong>{v.plateNumber}</strong></td>
                    <td>{v.model}</td>
                    <td>{v.type}</td>
                    <td>{driverName(v)}</td>
                    <td>
                      <span className={`status-badge ${getStatusClass(v.status)}`}>{v.status}</span>
                    </td>
                    <td>{v.fuelLevel ?? '—'}%</td>
                    <td>{v.mileage ?? '—'} km</td>
                    <td>{v.createdAt ? new Date(v.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="action-buttons">
                        <button className="btn-action btn-view"   onClick={() => handleViewDetails(v)} title="View">👁️</button>
                        <button className="btn-action btn-edit"   onClick={() => handleEditClick(v)}   title="Edit">✏️</button>
                        <button className="btn-action btn-delete" onClick={() => handleDelete(v._id)}  title="Delete">🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedVehicles.length === 0 && <div className="no-results"><p>📭 No vehicles found</p></div>}

          {sortedVehicles.length > 0 && (
            <div className="pagination-container">
              <p className="pagination-info-text">
                Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, sortedVehicles.length)} of {sortedVehicles.length}
              </p>
              <div className="pagination">
                <button className="pagination-btn pagination-arrow"
                  onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1}>
                  ‹ Prev
                </button>
                {getPageNumbers().map((page, i) =>
                  page === '...'
                    ? <span key={`e${i}`} className="pagination-ellipsis">...</span>
                    : <button key={page}
                        className={`pagination-btn pagination-number ${currentPage === page ? 'active' : ''}`}
                        onClick={() => setCurrentPage(page)}>{page}</button>
                )}
                <button className="pagination-btn pagination-arrow"
                  onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages}>
                  Next ›
                </button>
                <button className="pagination-btn pagination-arrow"
                  onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages}>
                  Last »
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Details Modal */}
      {showDetailsModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>🚗 Vehicle Details</h2>
              <button className="modal-close" onClick={() => setShowDetailsModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {[
                  ['Plate Number',  selectedVehicle.plateNumber],
                  ['Model',         selectedVehicle.model],
                  ['Type',          selectedVehicle.type],
                  ['Capacity',      selectedVehicle.capacity ? `${selectedVehicle.capacity} passengers` : '—'],
                  ['Year',          selectedVehicle.year || '—'],
                  ['Color',         selectedVehicle.color || '—'],
                  ['Driver',        driverName(selectedVehicle)],
                  ['Fuel Level',    `${selectedVehicle.fuelLevel ?? '—'}%`],
                  ['Mileage',       `${selectedVehicle.mileage ?? '—'} km`],
                  ['Department',    selectedVehicle.department || '—'],
                  ['Location',      selectedVehicle.location?.name || '—'],
                  ['Destination',   selectedVehicle.destination || '—'],
                  ['Registered',    selectedVehicle.createdAt ? new Date(selectedVehicle.createdAt).toLocaleDateString() : '—'],
                ].map(([label, val]) => (
                  <div className="detail-item" key={label}>
                    <label>{label}:</label>
                    <span>{val}</span>
                  </div>
                ))}
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge ${getStatusClass(selectedVehicle.status)}`}>
                    {selectedVehicle.status}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedVehicle && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>✏️ Edit Vehicle</h2>
              <button className="modal-close" onClick={() => setShowEditModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Plate Number:</label>
                  <input type="text" value={editFormData.plateNumber || ''}
                    onChange={e => setEditFormData(f => ({ ...f, plateNumber: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Model:</label>
                  <input type="text" value={editFormData.model || ''}
                    onChange={e => setEditFormData(f => ({ ...f, model: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Type:</label>
                  <select value={showOtherType ? 'Other' : (editFormData.type || '')}
                    onChange={e => handleTypeChange(e.target.value)}>
                    <option value="bus">Bus</option>
                    <option value="minibus">Minibus</option>
                    <option value="car">Car</option>
                    <option value="truck">Truck</option>
                    <option value="van">Van</option>
                    <option value="Other">Other</option>
                  </select>
                  {showOtherType && (
                    <input type="text" placeholder="Enter type..." value={editFormData.type || ''}
                      onChange={e => setEditFormData(f => ({ ...f, type: e.target.value }))}
                      style={{ marginTop: 8 }} />
                  )}
                </div>
                <div className="form-group">
                  <label>Capacity (passengers):</label>
                  <input type="number" min="1" value={editFormData.capacity || ''}
                    onChange={e => setEditFormData(f => ({ ...f, capacity: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Status:</label>
                  <select value={editFormData.status || ''}
                    onChange={e => setEditFormData(f => ({ ...f, status: e.target.value }))}>
                    <option value="available">Available</option>
                    <option value="in-use">In Use</option>
                    <option value="maintenance">Maintenance</option>
                    <option value="out-of-service">Out of Service</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Fuel Level (%):</label>
                  <input type="number" min="0" max="100" value={editFormData.fuelLevel ?? ''}
                    onChange={e => setEditFormData(f => ({ ...f, fuelLevel: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Mileage (km):</label>
                  <input type="number" min="0" value={editFormData.mileage ?? ''}
                    onChange={e => setEditFormData(f => ({ ...f, mileage: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Year:</label>
                  <input type="number" min="1990" max="2030" value={editFormData.year || ''}
                    onChange={e => setEditFormData(f => ({ ...f, year: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Color:</label>
                  <input type="text" value={editFormData.color || ''}
                    onChange={e => setEditFormData(f => ({ ...f, color: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label>Destination:</label>
                  <input type="text" value={editFormData.destination || ''}
                    onChange={e => setEditFormData(f => ({ ...f, destination: e.target.value }))} />
                </div>
              </div>
              <div className="modal-actions">
                <button className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancel</button>
                <button className="btn-save" onClick={handleEditSave}>Save Changes</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageVehiclesPage;
