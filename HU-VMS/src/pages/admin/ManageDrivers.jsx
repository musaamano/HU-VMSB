import { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { getDrivers, createDriver, deleteDriver, updateDriver } from '../../api/api';
import './adminTheme.css';
import './manageDrivers.css';

const EMPTY = {
  name: '', username: '', password: '', licenseNumber: '', licenseExpiry: '',
  phone: '', employeeId: '', dateOfBirth: '',
};

const Toast = ({ msg, type }) => msg ? (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    background: type === 'error' ? '#ef4444' : '#22c55e',
    color: '#fff', padding: '10px 20px', borderRadius: 10,
    fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  }}>{msg}</div>
) : null;

const Field = ({ label, value }) => (
  <div style={{ marginBottom: 14 }}>
    <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 3 }}>{label}</div>
    <div style={{ fontSize: 14, color: '#1e293b', fontWeight: 500, wordBreak: 'break-all' }}>{value || '—'}</div>
  </div>
);

const ActionsMenu = ({ driver, onAction }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const act = (a) => { setOpen(false); onAction(a, driver); };

  return (
    <div className="mu-actions-wrap" ref={ref}>
      <button className="mu-actions-btn" onClick={() => setOpen(o => !o)}>Actions ▾</button>
      {open && (
        <div className="mu-actions-menu">
          <button className="mu-menu-item" onClick={() => act('view')}>👁️ View Details</button>
          <button className="mu-menu-item" onClick={() => act('edit')}>✏️ Edit Driver</button>
          <div className="mu-menu-divider" />
          {driver.isActive !== false
            ? <button className="mu-menu-item mu-item-warn" onClick={() => act('deactivate')}>� Deactivate</button>
            : <button className="mu-menu-item mu-item-success" onClick={() => act('activate')}>✅ Activate</button>
          }
          <div className="mu-menu-divider" />
          <button className="mu-menu-item mu-item-danger" onClick={() => act('delete')}>🗑️ Delete Driver</button>
        </div>
      )}
    </div>
  );
};

export default function ManageDrivers() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState({ msg: '', type: 'success' });
  const [searchTerm, setSearchTerm] = useState('');
  const [modal, setModal] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    getDrivers().then(setDrivers).catch(console.error).finally(() => setLoading(false));
  }, []);

  const set = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  const closeModal = () => setModal(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) return showToast('Full name is required.', 'error');
    if (!form.licenseNumber.trim()) return showToast('License number is required.', 'error');
    if (!form.phone.trim()) return showToast('Phone is required.', 'error');
    if (!form.username.trim()) return showToast('Username is required.', 'error');
    if (!form.password.trim() || form.password.length < 6) return showToast('Password must be at least 6 characters.', 'error');
    setSaving(true);
    try {
      const created = await createDriver({
        name: form.name.trim(),
        username: form.username.trim(),
        password: form.password.trim(),
        licenseNumber: form.licenseNumber.trim(),
        licenseExpiry: form.licenseExpiry,
        phone: form.phone.trim(),
        employeeId: form.employeeId.trim() || undefined,
        availability: 'available',
      });
      setDrivers(d => [created, ...d]);
      setForm(EMPTY); setShowForm(false);
      showToast(`Driver "${created.name}" added successfully`);
    } catch (err) {
      showToast(err.message || 'Failed to add driver', 'error');
    } finally { setSaving(false); }
  };

  const handleAction = (action, driver) => {
    if (action === 'view') {
      setModal({ type: 'view', driver });
      return;
    }
    if (action === 'edit') {
      setEditForm({
        name: driver.name || '',
        phone: driver.phone || '',
        licenseNumber: driver.licenseNumber || '',
        licenseExpiry: driver.licenseExpiry || '',
        employeeId: driver.employeeId || '',
        status: driver.status || 'available',
      });
      setModal({ type: 'edit', driver });
      return;
    }
    if (action === 'activate') {
      updateDriver(driver._id, { isActive: true })
        .then(u => { setDrivers(ds => ds.map(d => d._id === u._id ? u : d)); showToast(`${driver.name} activated`); })
        .catch(err => showToast(err.message, 'error'));
      return;
    }
    if (action === 'deactivate') { setModal({ type: 'deactivate', driver }); return; }
    if (action === 'delete') { setModal({ type: 'delete', driver }); return; }
  };

  const handleDeactivate = async () => {
    try {
      const u = await updateDriver(modal.driver._id, { isActive: false });
      setDrivers(ds => ds.map(d => d._id === u._id ? u : d));
      showToast(`${modal.driver.name} deactivated`);
      closeModal();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleDelete = async () => {
    try {
      await deleteDriver(modal.driver._id);
      setDrivers(ds => ds.filter(d => d._id !== modal.driver._id));
      showToast(`Driver "${modal.driver.name}" deleted`);
      closeModal();
    } catch (err) { showToast(err.message, 'error'); }
  };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) return showToast('Name is required', 'error');
    setEditSaving(true);
    try {
      const updated = await updateDriver(modal.driver._id, {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        licenseNumber: editForm.licenseNumber.trim(),
        licenseExpiry: editForm.licenseExpiry,
        employeeId: editForm.employeeId.trim(),
        status: editForm.status,
      });
      setDrivers(ds => ds.map(d => d._id === updated._id ? updated : d));
      showToast(`${updated.name} updated successfully`);
      closeModal();
    } catch (err) { showToast(err.message, 'error'); }
    finally { setEditSaving(false); }
  };

  const filtered = drivers.filter(d =>
    d.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.licenseNumber?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusColor = (s) =>
    s === 'available' ? 'status-active' : s === 'on-trip' ? 'status-leave' : 'status-inactive';

  const inp = { minHeight: 'unset', height: 40, resize: 'none' };
  const lbl = { fontSize: 12, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 };

  return (
    <div className="manage-drivers-container">
      <Toast msg={toast.msg} type={toast.type} />

      <div className="header-section">
        <h1>Manage Drivers</h1>
        <button className="btn-add-driver" onClick={() => { setShowForm(s => !s); setForm(EMPTY); }}>
          {showForm ? '✕ Cancel' : '+ Add Driver'}
        </button>
      </div>

      {/* Stats — Pie Chart */}
      {(() => {
        const available = drivers.filter(d => d.status === 'available').length;
        const onTrip = drivers.filter(d => d.status === 'on-trip').length;
        const offDuty = drivers.filter(d => d.status === 'off-duty').length;
        const inactive = drivers.filter(d => d.isActive === false).length;
        const pieData = [
          { name: 'Available', value: available, fill: '#22c55e' },
          { name: 'On Trip', value: onTrip, fill: '#3b82f6' },
          { name: 'Off Duty', value: offDuty, fill: '#f59e0b' },
          { name: 'Inactive', value: inactive, fill: '#ef4444' },
        ].filter(d => d.value > 0);

        return (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 32, background: '#fff',
            border: '1px solid #e2e8f0', borderRadius: 14, padding: '20px 28px',
            marginBottom: 28, boxShadow: '0 1px 4px rgba(0,0,0,0.06)'
          }}>
            {/* Donut */}
            <div style={{ flexShrink: 0 }}>
              <PieChart width={160} height={160}>
                <Pie data={pieData} cx={75} cy={75} innerRadius={48} outerRadius={72}
                  dataKey="value" paddingAngle={3} stroke="none">
                  {pieData.map((e, i) => <Cell key={i} fill={e.fill} />)}
                </Pie>
                <text x={80} y={70} textAnchor="middle" fill="#1e293b" fontSize={26} fontWeight={800}>{drivers.length}</text>
                <text x={80} y={88} textAnchor="middle" fill="#94a3b8" fontSize={11}>Drivers</text>
                <Tooltip formatter={(val, name) => [val, name]} />
              </PieChart>
            </div>
            {/* Legend */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 32px', flex: 1 }}>
              {[
                { label: 'Total Drivers', value: drivers.length, color: '#6366f1' },
                { label: 'Available', value: available, color: '#22c55e' },
                { label: 'On Trip', value: onTrip, color: '#3b82f6' },
                { label: 'Off Duty', value: offDuty, color: '#f59e0b' },
                { label: 'Inactive', value: inactive, color: '#ef4444' },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#1e293b', lineHeight: 1 }}>{value}</div>
                    <div style={{ fontSize: 12, color: '#6b7280', marginTop: 2 }}>{label}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })()}

      {/* Add Driver Form */}
      {showForm && (
        <div className="add-driver-form">
          <h2>📝 Add New Driver</h2>
          <form onSubmit={handleSubmit}>
            <div className="form-section">
              <h3>Personal Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="name" value={form.name} onChange={set} placeholder="e.g. Abebe Kebede" required />
                </div>
                <div className="form-group">
                  <label>Phone <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="tel" name="phone" value={form.phone} onChange={set} placeholder="+251 912 345 678" required />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Employee ID</label>
                  <input type="text" name="employeeId" value={form.employeeId} onChange={set} placeholder="e.g. DRV-0042" />
                </div>
                <div className="form-group">
                  <label>Date of Birth</label>
                  <input type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={set} />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3>Account Information</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>Username <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="username" value={form.username} onChange={set} placeholder="e.g. driver001" required />
                </div>
                <div className="form-group">
                  <label>Password <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="password" name="password" value={form.password} onChange={set} placeholder="Minimum 6 characters" required />
                </div>
              </div>
            </div>
            <div className="form-section">
              <h3>Driving License</h3>
              <div className="form-row">
                <div className="form-group">
                  <label>License Number <span style={{ color: '#ef4444' }}>*</span></label>
                  <input type="text" name="licenseNumber" value={form.licenseNumber} onChange={set} placeholder="e.g. DL-123456" required />
                </div>
                <div className="form-group">
                  <label>License Expiry Date</label>
                  <input type="date" name="licenseExpiry" value={form.licenseExpiry} onChange={set} />
                </div>
              </div>
            </div>
            <div className="form-actions">
              <button type="submit" className="btn-submit" disabled={saving}>{saving ? 'Saving...' : '✓ Save Driver'}</button>
              <button type="button" className="btn-cancel" onClick={() => { setShowForm(false); setForm(EMPTY); }}>✕ Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Search */}
      <div className="controls-bar">
        <input type="text" placeholder="Search by name or license number..."
          value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="search-input" />
      </div>

      {/* Table */}
      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
        {loading ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</p> : (
          <table className="drivers-table" style={{ minWidth: 860 }}>
            <thead>
              <tr>
                <th>#</th><th>Full Name</th><th>License No.</th><th>Expiry</th>
                <th>Phone</th><th>Trip Status</th><th>Account</th><th>Vehicle</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d, i) => (
                <tr key={d._id}>
                  <td>{i + 1}</td>
                  <td>{d.name}</td>
                  <td>{d.licenseNumber || '—'}</td>
                  <td>{d.licenseExpiry || '—'}</td>
                  <td>{d.phone || '—'}</td>
                  <td><span className={`status-badge ${statusColor(d.status)}`}>{d.status}</span></td>
                  <td>
                    <span className={`status-badge ${d.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                      {d.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{d.assignedVehiclePlate || 'Unassigned'}</td>
                  <td><ActionsMenu driver={d} onAction={handleAction} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <div className="no-results">No drivers found</div>}
      </div>

      {/* ── Modals ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ maxWidth: modal.type === 'view' || modal.type === 'edit' ? 560 : 460 }}>

            {/* VIEW */}
            {modal.type === 'view' && (
              <>
                <div className="modal-header">
                  <h2>👁️ Driver Details</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 16, marginBottom: 24,
                    background: 'linear-gradient(135deg,#16a34a,#0ea5e9)', borderRadius: 12, padding: '16px 20px'
                  }}>
                    <div style={{
                      width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,255,255,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 24, fontWeight: 800, color: '#fff', flexShrink: 0
                    }}>
                      {modal.driver.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 18, fontWeight: 700, color: '#fff' }}>{modal.driver.name}</div>
                      <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)' }}>
                        {modal.driver.licenseNumber || 'No license on file'}
                      </div>
                      <span style={{
                        display: 'inline-block', marginTop: 4, padding: '2px 10px',
                        background: 'rgba(255,255,255,0.2)', borderRadius: 20, fontSize: 11, color: '#fff', fontWeight: 600
                      }}>
                        {modal.driver.status}
                      </span>
                    </div>
                    <span style={{
                      marginLeft: 'auto', padding: '4px 12px', borderRadius: 20, fontSize: 12,
                      fontWeight: 700, background: modal.driver.isActive !== false ? '#22c55e' : '#ef4444', color: '#fff'
                    }}>
                      {modal.driver.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 24px' }}>
                    <Field label="Full Name" value={modal.driver.name} />
                    <Field label="Phone" value={modal.driver.phone} />
                    <Field label="Employee ID" value={modal.driver.employeeId} />
                    <Field label="License Number" value={modal.driver.licenseNumber} />
                    <Field label="License Expiry" value={modal.driver.licenseExpiry} />
                    <Field label="Trip Status" value={modal.driver.status} />
                    <Field label="Account Status" value={modal.driver.isActive !== false ? 'Active' : 'Inactive'} />
                    <Field label="Assigned Vehicle" value={modal.driver.assignedVehiclePlate} />
                    <Field label="Total Trips" value={modal.driver.totalTrips ?? 0} />
                    <Field label="Rating" value={modal.driver.rating ? `${modal.driver.rating} / 5` : '—'} />
                    <Field label="Added On" value={modal.driver.createdAt ? new Date(modal.driver.createdAt).toLocaleDateString() : '—'} />
                    <Field label="Last Updated" value={modal.driver.updatedAt ? new Date(modal.driver.updatedAt).toLocaleDateString() : '—'} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Close</button>
                  <button className="btn-modal-submit" onClick={() => {
                    setEditForm({
                      name: modal.driver.name || '', phone: modal.driver.phone || '',
                      licenseNumber: modal.driver.licenseNumber || '',
                      licenseExpiry: modal.driver.licenseExpiry || '',
                      employeeId: modal.driver.employeeId || '',
                      status: modal.driver.status || 'available',
                    });
                    setModal({ type: 'edit', driver: modal.driver });
                  }}>✏️ Edit Driver</button>
                </div>
              </>
            )}

            {/* EDIT */}
            {modal.type === 'edit' && (
              <>
                <div className="modal-header">
                  <h2>✏️ Edit Driver</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 16px' }}>
                    <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                      <label style={lbl}>Full Name <span style={{ color: '#ef4444' }}>*</span></label>
                      <input className="lock-reason-input" type="text" value={editForm.name}
                        onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                        placeholder="Full name" style={inp} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Phone</label>
                      <input className="lock-reason-input" type="text" value={editForm.phone}
                        onChange={e => setEditForm(f => ({ ...f, phone: e.target.value }))}
                        placeholder="+251 9XX XXX XXX" style={inp} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>Employee ID</label>
                      <input className="lock-reason-input" type="text" value={editForm.employeeId}
                        onChange={e => setEditForm(f => ({ ...f, employeeId: e.target.value }))}
                        placeholder="DRV-0001" style={inp} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>License Number</label>
                      <input className="lock-reason-input" type="text" value={editForm.licenseNumber}
                        onChange={e => setEditForm(f => ({ ...f, licenseNumber: e.target.value }))}
                        placeholder="DL-123456" style={inp} />
                    </div>
                    <div style={{ marginBottom: 14 }}>
                      <label style={lbl}>License Expiry</label>
                      <input className="lock-reason-input" type="date" value={editForm.licenseExpiry}
                        onChange={e => setEditForm(f => ({ ...f, licenseExpiry: e.target.value }))}
                        style={inp} />
                    </div>
                    <div style={{ marginBottom: 14, gridColumn: '1/-1' }}>
                      <label style={lbl}>Trip Status</label>
                      <select className="lock-reason-input" value={editForm.status}
                        onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))}
                        style={{ ...inp, cursor: 'pointer' }}>
                        <option value="available">Available</option>
                        <option value="on-trip">On Trip</option>
                        <option value="off-duty">Off Duty</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleEditSave} disabled={editSaving}>
                    {editSaving ? 'Saving...' : '✓ Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* DEACTIVATE */}
            {modal.type === 'deactivate' && (
              <>
                <div className="modal-header">
                  <h2>🚫 Deactivate Driver</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description">
                    Are you sure you want to deactivate <strong>{modal.driver.name}</strong>?
                    They will no longer be able to be assigned to trips.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleDeactivate}>Deactivate</button>
                </div>
              </>
            )}

            {/* DELETE */}
            {modal.type === 'delete' && (
              <>
                <div className="modal-header" style={{ background: 'linear-gradient(135deg,#ef4444,#dc2626)' }}>
                  <h2>🗑️ Delete Driver</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description">
                    Permanently delete <strong>{modal.driver.name}</strong>? This action cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-danger" onClick={handleDelete}>Delete</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
