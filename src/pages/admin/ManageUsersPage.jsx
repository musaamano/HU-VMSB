import { useState, useEffect, useRef } from 'react';
import { getUsers, deleteUser, updateUser, resetUserPassword, resetUsername } from '../../api/api';

// ── Field row helper ───────────────────────────────────────────────────────
const Field = ({ label, value }) => (
  <div style={{ marginBottom:14 }}>
    <div style={{ fontSize:11, fontWeight:700, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.06em', marginBottom:3 }}>{label}</div>
    <div style={{ fontSize:14, color:'#1e293b', fontWeight:500, wordBreak:'break-all' }}>{value || '—'}</div>
  </div>
);
import './adminTheme.css';
import './manageUsersPage.css';

const ROLE_LABELS = {
  ADMIN: 'Admin', TRANSPORT: 'Transport Officer', DRIVER: 'Driver',
  USER: 'User', FUEL_OFFICER: 'Fuel Officer', GATE_OFFICER: 'Gate Officer',
};

// ── Small toast ────────────────────────────────────────────────────────────
const Toast = ({ msg, type }) => msg ? (
  <div style={{
    position:'fixed', top:20, right:20, zIndex:9999,
    background: type === 'error' ? '#ef4444' : '#22c55e',
    color:'#fff', padding:'10px 20px', borderRadius:10,
    fontWeight:600, fontSize:14, boxShadow:'0 4px 16px rgba(0,0,0,0.15)',
    animation:'fadeIn .2s ease',
  }}>{msg}</div>
) : null;

// ── Actions dropdown per row ───────────────────────────────────────────────
const ActionsMenu = ({ user, onAction }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const act = (action) => { setOpen(false); onAction(action, user); };

  return (
    <div className="mu-actions-wrap" ref={ref}>
      <button className="mu-actions-btn" onClick={() => setOpen(o => !o)}>
        Actions ▾
      </button>
      {open && (
        <div className="mu-actions-menu">
          <button className="mu-menu-item" onClick={() => act('view')}>
            👁️ View Details
          </button>
          <button className="mu-menu-item" onClick={() => act('edit')}>
            ✏️ Edit User
          </button>
          <div className="mu-menu-divider" />
          {user.isActive !== false ? (
            <button className="mu-menu-item mu-item-warn" onClick={() => act('deactivate')}>
              🚫 Deactivate
            </button>
          ) : (
            <button className="mu-menu-item mu-item-success" onClick={() => act('activate')}>
              ✅ Activate
            </button>
          )}
          <button className="mu-menu-item" onClick={() => act('reset-password')}>
            🔑 Reset Password
          </button>
          <button className="mu-menu-item" onClick={() => act('reset-username')}>
            🔄 Reset Username
          </button>
          <div className="mu-menu-divider" />
          <button className="mu-menu-item mu-item-danger" onClick={() => act('delete')}>
            🗑️ Delete User
          </button>
        </div>
      )}
    </div>
  );
};

export default function ManageUsersPage() {
  const [users, setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [toast, setToast]   = useState({ msg:'', type:'success' });

  // modal state
  const [modal, setModal] = useState(null);
  const [inputVal, setInputVal] = useState('');
  const [inputVal2, setInputVal2] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [editSaving, setEditSaving] = useState(false);

  // filters / pagination
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterRole, setFilterRole]   = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const loadUsers = () => {
    setRefreshing(true);
    getUsers().then(setUsers).catch(console.error).finally(() => { setLoading(false); setRefreshing(false); });
  };

  useEffect(() => { loadUsers(); }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg:'', type:'success' }), 3000);
  };

  // ── Action handler ─────────────────────────────────────────────────────
  const handleAction = (action, user) => {
    if (action === 'view') { setModal({ type: 'view', user }); return; }
    if (action === 'edit') {
      setEditForm({
        name:       user.name       || '',
        email:      user.email      || '',
        phone:      user.phone      || '',
        department: user.department || '',
        employeeId: user.employeeId || '',
        role:       user.role       || '',
      });
      setModal({ type: 'edit', user });
      return;
    }
    if (action === 'activate' || action === 'deactivate') {
      if (action === 'activate') {
        updateUser(user._id, { isActive: true })
          .then(updated => { setUsers(us => us.map(u => u._id === updated._id ? updated : u)); showToast(`${user.name} activated`); })
          .catch(err => showToast(err.message, 'error'));
      } else {
        setModal({ type: 'deactivate', user });
        setInputVal('');
      }
      return;
    }
    if (action === 'delete') { setModal({ type: 'delete', user }); return; }
    if (action === 'reset-password') { setModal({ type: 'reset-password', user }); setInputVal(''); setInputVal2(''); return; }
    if (action === 'reset-username') { setModal({ type: 'reset-username', user }); setInputVal(user.username); return; }
  };

  const closeModal = () => { setModal(null); setInputVal(''); setInputVal2(''); };

  const handleEditSave = async () => {
    if (!editForm.name.trim()) { showToast('Name is required', 'error'); return; }
    if (!editForm.email.trim()) { showToast('Email is required', 'error'); return; }
    setEditSaving(true);
    try {
      const updated = await updateUser(modal.user._id, {
        name:       editForm.name.trim(),
        email:      editForm.email.trim(),
        phone:      editForm.phone.trim(),
        department: editForm.department.trim(),
        employeeId: editForm.employeeId.trim(),
        role:       editForm.role,
      });
      setUsers(us => us.map(u => u._id === updated._id ? updated : u));
      showToast(`${updated.name} updated successfully`);
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setEditSaving(false);
    }
  };

  const handleModalSubmit = async () => {
    const { type, user } = modal;
    try {
      if (type === 'deactivate') {
        const updated = await updateUser(user._id, { isActive: false });
        setUsers(us => us.map(u => u._id === updated._id ? updated : u));
        showToast(`${user.name} deactivated`);
      } else if (type === 'delete') {
        await deleteUser(user._id);
        setUsers(us => us.filter(u => u._id !== user._id));
        showToast(`${user.name} deleted`);
      } else if (type === 'reset-password') {
        if (!inputVal || inputVal.length < 6) { showToast('Password must be at least 6 characters', 'error'); return; }
        if (inputVal !== inputVal2) { showToast('Passwords do not match', 'error'); return; }
        await resetUserPassword(user._id, inputVal);
        showToast(`Password reset for ${user.name}`);
      } else if (type === 'reset-username') {
        if (!inputVal || inputVal.trim().length < 3) { showToast('Username must be at least 3 characters', 'error'); return; }
        const result = await resetUsername(user._id, inputVal.trim());
        setUsers(us => us.map(u => u._id === user._id ? result.user : u));
        showToast(`Username updated for ${user.name}`);
      }
      closeModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  };

  // ── Filter + paginate ──────────────────────────────────────────────────
  const filtered = users.filter(u => {
    const q = searchTerm.toLowerCase();
    const matchSearch = (u.name||'').toLowerCase().includes(q) ||
                        (u.username||'').toLowerCase().includes(q) ||
                        (u.email||'').toLowerCase().includes(q);
    const matchRole = filterRole === 'All' || u.role === filterRole;
    return matchSearch && matchRole;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current    = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="manage-users-container" style={{ maxWidth:'100%', boxSizing:'border-box' }}>
      <Toast msg={toast.msg} type={toast.type} />
      <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:24 }}>
        <h1 style={{ margin:0 }}>Manage Users</h1>
        <button onClick={loadUsers} disabled={refreshing}
          style={{ display:'flex', alignItems:'center', gap:6, padding:'8px 16px',
            background:'#f0fdf4', color:'#16a34a', border:'1px solid #bbf7d0',
            borderRadius:8, fontSize:13, fontWeight:600, cursor:'pointer' }}>
          <span style={{ display:'inline-block', animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }}>🔄</span>
          {refreshing ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="controls-bar">
        <input type="text" placeholder="Search by name, username, or email..."
          value={searchTerm}
          onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input" />
        <select value={filterRole}
          onChange={e => { setFilterRole(e.target.value); setCurrentPage(1); }}
          className="filter-select">
          <option value="All">All Roles</option>
          {Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      <div style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        {loading ? <div style={{ padding:40, textAlign:'center' }}>Loading users...</div> : (
          <table className="users-table" style={{ minWidth: 900 }}>
            <thead>
              <tr>
                <th>#</th><th>Full Name</th><th>Username</th><th>Email</th>
                <th>Role</th><th>Department</th><th>Status</th><th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {current.map((user, i) => (
                <tr key={user._id}>
                  <td>{startIndex + i + 1}</td>
                  <td>{user.name}</td>
                  <td>{user.username}</td>
                  <td>{user.email}</td>
                  <td>{ROLE_LABELS[user.role] || user.role}</td>
                  <td>{user.department || '—'}</td>
                  <td>
                    <span className={`status-badge ${user.isActive !== false ? 'status-active' : 'status-inactive'}`}>
                      {user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <ActionsMenu user={user} onAction={handleAction} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && <div className="no-results">No users found</div>}
      </div>

      {/* ── Pagination ── */}
      {filtered.length > 0 && (
        <div className="pagination-container">
          <div className="pagination-info">
            <span>Showing {startIndex + 1}–{Math.min(startIndex + itemsPerPage, filtered.length)} of {filtered.length} users</span>
            <select value={itemsPerPage}
              onChange={e => { setItemsPerPage(Number(e.target.value)); setCurrentPage(1); }}
              className="items-per-page">
              {[5,10,20,50].map(n => <option key={n} value={n}>{n} per page</option>)}
            </select>
          </div>
          <div className="pagination-controls">
            <button className="pagination-btn" onClick={() => setCurrentPage(1)} disabled={currentPage===1}>⟪ First</button>
            <button className="pagination-btn" onClick={() => setCurrentPage(p=>p-1)} disabled={currentPage===1}>‹ Prev</button>
            <div className="page-numbers">
              {[...Array(totalPages)].map((_, idx) => {
                const p = idx + 1;
                if (p===1 || p===totalPages || (p>=currentPage-1 && p<=currentPage+1))
                  return <button key={p} className={`page-number ${currentPage===p?'active':''}`} onClick={() => setCurrentPage(p)}>{p}</button>;
                if (p===currentPage-2 || p===currentPage+2)
                  return <span key={p} className="page-ellipsis">...</span>;
                return null;
              })}
            </div>
            <button className="pagination-btn" onClick={() => setCurrentPage(p=>p+1)} disabled={currentPage===totalPages}>Next ›</button>
            <button className="pagination-btn" onClick={() => setCurrentPage(totalPages)} disabled={currentPage===totalPages}>Last ⟫</button>
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}
            style={{ maxWidth: modal.type === 'view' || modal.type === 'edit' ? 560 : 480 }}>

            {/* ── VIEW DETAILS ── */}
            {modal.type === 'view' && (
              <>
                <div className="modal-header">
                  <h2>👁️ User Details</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  {/* Avatar + name banner */}
                  <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24,
                    background:'linear-gradient(135deg,#6366f1,#8b5cf6)', borderRadius:12,
                    padding:'16px 20px' }}>
                    <div style={{ width:56, height:56, borderRadius:'50%', background:'rgba(255,255,255,0.25)',
                      display:'flex', alignItems:'center', justifyContent:'center',
                      fontSize:24, fontWeight:800, color:'#fff', flexShrink:0 }}>
                      {modal.user.name?.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize:18, fontWeight:700, color:'#fff' }}>{modal.user.name}</div>
                      <div style={{ fontSize:13, color:'rgba(255,255,255,0.8)' }}>@{modal.user.username}</div>
                      <span style={{ display:'inline-block', marginTop:4, padding:'2px 10px',
                        background:'rgba(255,255,255,0.2)', borderRadius:20, fontSize:11,
                        color:'#fff', fontWeight:600 }}>
                        {ROLE_LABELS[modal.user.role] || modal.user.role}
                      </span>
                    </div>
                    <span style={{ marginLeft:'auto', padding:'4px 12px', borderRadius:20, fontSize:12,
                      fontWeight:700, background: modal.user.isActive !== false ? '#22c55e' : '#ef4444',
                      color:'#fff' }}>
                      {modal.user.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 24px' }}>
                    <Field label="Full Name"   value={modal.user.name} />
                    <Field label="Username"    value={modal.user.username} />
                    <Field label="Email"       value={modal.user.email} />
                    <Field label="Phone"       value={modal.user.phone} />
                    <Field label="Department"  value={modal.user.department} />
                    <Field label="Employee ID" value={modal.user.employeeId} />
                    <Field label="Role"        value={ROLE_LABELS[modal.user.role] || modal.user.role} />
                    <Field label="Status"      value={modal.user.isActive !== false ? 'Active' : 'Inactive'} />
                    <Field label="Created"     value={modal.user.createdAt ? new Date(modal.user.createdAt).toLocaleDateString() : '—'} />
                    <Field label="Last Updated" value={modal.user.updatedAt ? new Date(modal.user.updatedAt).toLocaleDateString() : '—'} />
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Close</button>
                  <button className="btn-modal-submit"
                    onClick={() => {
                      setEditForm({
                        name: modal.user.name||'', email: modal.user.email||'',
                        phone: modal.user.phone||'', department: modal.user.department||'',
                        employeeId: modal.user.employeeId||'', role: modal.user.role||'',
                      });
                      setModal({ type:'edit', user: modal.user });
                    }}>
                    ✏️ Edit User
                  </button>
                </div>
              </>
            )}

            {/* ── EDIT USER ── */}
            {modal.type === 'edit' && (
              <>
                <div className="modal-header">
                  <h2>✏️ Edit User</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'0 16px' }}>
                    {/* Full Name */}
                    <div style={{ marginBottom:14, gridColumn:'1/-1' }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>
                        Full Name <span style={{color:'#ef4444'}}>*</span>
                      </label>
                      <input className="lock-reason-input" type="text" value={editForm.name}
                        onChange={e => setEditForm(f=>({...f, name:e.target.value}))}
                        placeholder="Full name" style={{ minHeight:'unset', height:40 }} />
                    </div>
                    {/* Email */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>
                        Email <span style={{color:'#ef4444'}}>*</span>
                      </label>
                      <input className="lock-reason-input" type="email" value={editForm.email}
                        onChange={e => setEditForm(f=>({...f, email:e.target.value}))}
                        placeholder="Email" style={{ minHeight:'unset', height:40 }} />
                    </div>
                    {/* Phone */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Phone</label>
                      <input className="lock-reason-input" type="text" value={editForm.phone}
                        onChange={e => setEditForm(f=>({...f, phone:e.target.value}))}
                        placeholder="+251 9XX XXX XXX" style={{ minHeight:'unset', height:40 }} />
                    </div>
                    {/* Department */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Department</label>
                      <input className="lock-reason-input" type="text" value={editForm.department}
                        onChange={e => setEditForm(f=>({...f, department:e.target.value}))}
                        placeholder="Department" style={{ minHeight:'unset', height:40 }} />
                    </div>
                    {/* Employee ID */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Employee ID</label>
                      <input className="lock-reason-input" type="text" value={editForm.employeeId}
                        onChange={e => setEditForm(f=>({...f, employeeId:e.target.value}))}
                        placeholder="EMP-0001" style={{ minHeight:'unset', height:40 }} />
                    </div>
                    {/* Role */}
                    <div style={{ marginBottom:14 }}>
                      <label style={{ fontSize:12, fontWeight:600, color:'#374151', display:'block', marginBottom:4 }}>Role</label>
                      <select className="lock-reason-input" value={editForm.role}
                        onChange={e => setEditForm(f=>({...f, role:e.target.value}))}
                        style={{ minHeight:'unset', height:40, resize:'none' }}>
                        {Object.entries(ROLE_LABELS).map(([k,v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleEditSave} disabled={editSaving}>
                    {editSaving ? 'Saving...' : '💾 Save Changes'}
                  </button>
                </div>
              </>
            )}

            {/* ── DEACTIVATE ── */}
            {modal.type === 'deactivate' && (
              <>
                <div className="modal-header">
                  <h2>🚫 Deactivate User</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description">
                    Deactivate <strong>{modal.user.name}</strong>? They will no longer be able to log in.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleModalSubmit}>Deactivate</button>
                </div>
              </>
            )}

            {/* ── DELETE ── */}
            {modal.type === 'delete' && (
              <>
                <div className="modal-header">
                  <h2>🗑️ Delete User</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description" style={{ color:'#ef4444' }}>
                    Permanently delete <strong>{modal.user.name}</strong>? This cannot be undone.
                  </p>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-danger" onClick={handleModalSubmit}>Delete</button>
                </div>
              </>
            )}

            {/* ── RESET PASSWORD ── */}
            {modal.type === 'reset-password' && (
              <>
                <div className="modal-header">
                  <h2>🔑 Reset Password</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description">Set a new password for <strong>{modal.user.name}</strong>.</p>
                  <input type={showPw ? 'text' : 'password'} placeholder="New password (min 6 chars)"
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    className="lock-reason-input" style={{ marginBottom:10, minHeight:'unset', height:42 }} />
                  <input type={showPw ? 'text' : 'password'} placeholder="Confirm new password"
                    value={inputVal2} onChange={e => setInputVal2(e.target.value)}
                    className="lock-reason-input" style={{ minHeight:'unset', height:42 }} />
                  <label style={{ marginTop:8, display:'flex', alignItems:'center', gap:6, fontSize:13, cursor:'pointer' }}>
                    <input type="checkbox" checked={showPw} onChange={e => setShowPw(e.target.checked)} />
                    Show password
                  </label>
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleModalSubmit}>Reset Password</button>
                </div>
              </>
            )}

            {/* ── RESET USERNAME ── */}
            {modal.type === 'reset-username' && (
              <>
                <div className="modal-header">
                  <h2>🔄 Reset Username</h2>
                  <button className="modal-close" onClick={closeModal}>×</button>
                </div>
                <div className="modal-body">
                  <p className="modal-description">Set a new username for <strong>{modal.user.name}</strong>.</p>
                  <input type="text" placeholder="New username (min 3 chars)"
                    value={inputVal} onChange={e => setInputVal(e.target.value)}
                    className="lock-reason-input" style={{ minHeight:'unset', height:42 }} />
                </div>
                <div className="modal-footer">
                  <button className="btn-modal-cancel" onClick={closeModal}>Cancel</button>
                  <button className="btn-modal-submit" onClick={handleModalSubmit}>Update Username</button>
                </div>
              </>
            )}

          </div>
        </div>
      )}
    </div>
  );
}
