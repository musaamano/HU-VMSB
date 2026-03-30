import { useState, useEffect } from 'react';
import {
  Search, Filter, Phone, Clock, MapPin, Car, Briefcase,
  User, CheckCircle2, AlertCircle, X, RefreshCw, Star, Hash, Shield
} from 'lucide-react';
import { getDrivers, getVehicles } from '../../api/api';
import './DriverCoordination.css';

const BASE = '/api';
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem('authToken');
  const res = await fetch(url, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const STATUS_COLOR = {
  available:   'var(--status-available)',
  on_trip:     'var(--primary-color)',
  unavailable: 'var(--text-secondary)',
};
const STATUS_LABEL = { available: 'Available', on_trip: 'On Trip', unavailable: 'Off Duty' };

const getInitials = (name = '') =>
  name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();

export default function DriverCoordination() {
  const [drivers, setDrivers]           = useState([]);
  const [vehicles, setVehicles]         = useState([]);
  const [loading, setLoading]           = useState(true);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals
  const [profileDriver, setProfileDriver]   = useState(null); // View Profile
  const [assignDriver, setAssignDriver]     = useState(null); // Reassign Vehicle
  const [selectedVehicleId, setSelectedVehicleId] = useState('');
  const [saving, setSaving]                 = useState(false);

  const fetchAll = async () => {
    try {
      setLoading(true);
      const [drvs, vehs] = await Promise.all([getDrivers(), getVehicles()]);
      setDrivers(drvs);
      setVehicles(vehs);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const handleReassign = async () => {
    if (!selectedVehicleId || !assignDriver) return;
    setSaving(true);
    try {
      await authReq(`${BASE}/transport/vehicles/${selectedVehicleId}/assign-driver`, {
        method: 'PUT',
        body: JSON.stringify({ driverId: assignDriver._id }),
      });
      await fetchAll();
      setAssignDriver(null);
      setSelectedVehicleId('');
    } catch (err) {
      alert('Failed to assign: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const filtered = drivers.filter(d => {
    const q = searchTerm.toLowerCase();
    const vehicleText = d.assignedVehicle ? `${d.assignedVehicle.plateNumber} ${d.assignedVehicle.model}` : '';
    const matchSearch =
      (d.name || '').toLowerCase().includes(q) ||
      vehicleText.toLowerCase().includes(q) ||
      (d.employeeId || '').toLowerCase().includes(q);
    const matchStatus = statusFilter === 'All' || d.availability === statusFilter;
    return matchSearch && matchStatus;
  });

  const stats = {
    total:     drivers.length,
    available: drivers.filter(d => d.availability === 'available').length,
    onTrip:    drivers.filter(d => d.availability === 'on_trip').length,
    offDuty:   drivers.filter(d => d.availability === 'unavailable').length,
  };

  if (loading) return (
    <div className="driver-coordination-page">
      <p style={{ padding: '2rem', color: '#94a3b8' }}>Loading drivers...</p>
    </div>
  );

  return (
    <div className="driver-coordination-page">
      <div className="page-header">
        <div>
          <h1>Driver Directory</h1>
          <p>Manage personnel, assignments, and schedules</p>
        </div>
        <button onClick={fetchAll} title="Refresh" style={{
          background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
          color: '#818cf8', borderRadius: 8, padding: '0.5rem 0.75rem',
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 600,
        }}>
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="driver-stats-grid">
        {[
          { icon: <User size={24} />, cls: 'total',     value: stats.total,     label: 'Total Drivers',   sub: 'Registered staff' },
          { icon: <CheckCircle2 size={24} />, cls: 'available', value: stats.available, label: 'Available Now',   sub: 'Ready for dispatch' },
          { icon: <MapPin size={24} />, cls: 'on-trip',  value: stats.onTrip,    label: 'Active on Trips', sub: 'Currently driving' },
          { icon: <Clock size={24} />, cls: 'off-duty',  value: stats.offDuty,   label: 'Off Duty',        sub: 'Resting or leave' },
        ].map((s, i) => (
          <div key={i} className="stat-card">
            <div className={`stat-icon-wrapper ${s.cls}`}>{s.icon}</div>
            <div className="stat-info">
              <h3>{s.label}</h3>
              <div className="stat-value">{s.value}</div>
              <span className="stat-trend">{s.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Toolbar */}
      <div className="toolbar">
        <div className="search-bar">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by name, vehicle, or ID..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <div className="status-filter">
            <Filter size={16} className="filter-icon" />
            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="All">All Statuses</option>
              <option value="available">Available</option>
              <option value="on_trip">On Trip</option>
              <option value="unavailable">Off Duty</option>
            </select>
          </div>
        </div>
      </div>

      {/* Driver Cards */}
      <div className="drivers-grid">
        {filtered.map(driver => {
          const color = STATUS_COLOR[driver.availability] || '#6b7280';
          const vehicleLabel = driver.assignedVehicle
            ? `${driver.assignedVehicle.plateNumber} — ${driver.assignedVehicle.model}`
            : 'Unassigned';
          return (
            <div key={driver._id} className="driver-card">
              <div className="dc-header">
                <div className="dc-avatar-profile">
                  <div className="dc-avatar" style={{ borderColor: driver.availability === 'on_trip' ? 'var(--primary-color)' : 'transparent' }}>
                    {getInitials(driver.name)}
                    <span className="dc-status-indicator" style={{ backgroundColor: color }}></span>
                  </div>
                  <div className="dc-info">
                    <h3>{driver.name}</h3>
                    <span className="dc-id">{driver.employeeId || driver._id.slice(-6).toUpperCase()}</span>
                  </div>
                </div>
                <span className="status-badge" style={{ background: `${color}22`, color, fontSize: 11, padding: '3px 8px', borderRadius: 20, fontWeight: 700 }}>
                  {STATUS_LABEL[driver.availability] || driver.availability}
                </span>
              </div>

              <div className="dc-body">
                {driver.phone && (
                  <div className="dc-row">
                    <div className="dc-icon-wrapper"><Phone size={14} /></div>
                    <div className="dc-text">{driver.phone}</div>
                  </div>
                )}
                {driver.licenseNumber && (
                  <div className="dc-row">
                    <div className="dc-icon-wrapper"><Shield size={14} /></div>
                    <div className="dc-text">License: {driver.licenseNumber}</div>
                  </div>
                )}

                <div className="dc-assignment-box">
                  <div className="assign-item">
                    <span className="assign-label">Vehicle</span>
                    <span className="assign-val vehicle-text">
                      <Car size={14} /> {vehicleLabel}
                    </span>
                  </div>
                  <div className="assign-divider"></div>
                  <div className="assign-item">
                    <span className="assign-label">Status</span>
                    <span className={`assign-val ${driver.availability === 'on_trip' ? 'trip-active' : 'no-trip'}`}>
                      {driver.availability === 'on_trip' ? <><MapPin size={14} /> On Trip</> : STATUS_LABEL[driver.availability] || driver.availability}
                    </span>
                  </div>
                </div>
              </div>

              <div className="dc-footer">
                <button className="btn btn-outline" onClick={() => { setAssignDriver(driver); setSelectedVehicleId(driver.assignedVehicle?._id || ''); }}>
                  {driver.assignedVehicle ? 'Reassign Vehicle' : 'Assign Vehicle'}
                </button>
                <button className="btn btn-secondary" onClick={() => setProfileDriver(driver)}>
                  View Profile
                </button>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="empty-state">
            <AlertCircle size={32} />
            <p>{drivers.length === 0 ? 'No drivers in database. Add drivers via Admin panel.' : 'No drivers match your search.'}</p>
          </div>
        )}
      </div>

      {/* ── View Profile Modal ── */}
      {profileDriver && (
        <div className="modal-overlay" onClick={() => setProfileDriver(null)}>
          <div className="profile-modal" onClick={e => e.stopPropagation()}>
            <div className="profile-modal-header">
              <h3>Driver Profile</h3>
              <button className="profile-modal-close" onClick={() => setProfileDriver(null)}>
                <X size={20} />
              </button>
            </div>

            <div className="profile-hero">
              <div className="profile-avatar-lg">{getInitials(profileDriver.name)}</div>
              <div className="profile-hero-info">
                <h4>{profileDriver.name}</h4>
                <div className="profile-emp-id">{profileDriver.employeeId || '—'}</div>
                <span
                  className="profile-status-badge"
                  style={{
                    background: `${STATUS_COLOR[profileDriver.status] || '#6b7280'}22`,
                    color: STATUS_COLOR[profileDriver.status] || '#6b7280',
                  }}
                >
                  {STATUS_LABEL[profileDriver.status] || profileDriver.status}
                </span>
              </div>
            </div>

            <div className="profile-details-grid">
              {[
                { icon: <Phone size={15} />,        label: 'Phone',            value: profileDriver.phone || '—' },
                { icon: <Shield size={15} />,        label: 'License No.',      value: profileDriver.licenseNumber || '—' },
                { icon: <Clock size={15} />,         label: 'License Expiry',   value: profileDriver.licenseExpiry || '—' },
                { icon: <Car size={15} />,           label: 'Assigned Vehicle', value: profileDriver.assignedVehicle ? `${profileDriver.assignedVehicle.plateNumber} — ${profileDriver.assignedVehicle.model}` : 'Unassigned' },
                { icon: <Star size={15} />,          label: 'Rating',           value: `${profileDriver.rating ?? 5} / 5` },
                { icon: <Hash size={15} />,          label: 'Total Trips',      value: profileDriver.totalTrips ?? 0 },
                { icon: <CheckCircle2 size={15} />,  label: 'Account',          value: profileDriver.isActive !== false ? '✅ Active' : '🔒 Inactive' },
                { icon: <Briefcase size={15} />,     label: 'Joined',           value: profileDriver.createdAt ? new Date(profileDriver.createdAt).toLocaleDateString() : '—' },
              ].map((item, i) => (
                <div key={i} className="profile-detail-item">
                  <div className="profile-detail-label">{item.icon} {item.label}</div>
                  <div className="profile-detail-value">{item.value}</div>
                </div>
              ))}
            </div>

            <div className="profile-modal-footer">
              <button className="btn btn-secondary" onClick={() => setProfileDriver(null)}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reassign Vehicle Modal ── */}
      {assignDriver && (
        <div className="modal-overlay" onClick={() => setAssignDriver(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h3 style={{ margin: 0 }}>Reassign Vehicle</h3>
              <button onClick={() => setAssignDriver(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#6b7280' }}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-driver-summary">
              <div className="mds-avatar">{getInitials(assignDriver.name)}</div>
              <div>
                <h4>{assignDriver.name}</h4>
                <p>Current vehicle: {assignDriver.assignedVehicle ? `${assignDriver.assignedVehicle.plateNumber} — ${assignDriver.assignedVehicle.model}` : 'Unassigned'}</p>
              </div>
            </div>

            <div className="vehicle-selection">
              <label>Select Vehicle</label>
              <select
                className="modern-select"
                value={selectedVehicleId}
                onChange={e => setSelectedVehicleId(e.target.value)}
              >
                <option value="">Choose a vehicle...</option>
                {vehicles.map(v => (
                  <option key={v._id} value={v._id}>
                    {v.plateNumber} – {v.model} ({v.type}, {v.capacity} seats) [{v.status}]
                  </option>
                ))}
              </select>
            </div>

            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => setAssignDriver(null)}>Cancel</button>
              <button
                className="btn btn-primary"
                onClick={handleReassign}
                disabled={!selectedVehicleId || saving}
              >
                {saving ? 'Saving...' : 'Confirm Assignment'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
