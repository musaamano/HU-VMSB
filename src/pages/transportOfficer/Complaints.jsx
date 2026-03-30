import { useState, useEffect } from 'react';
import {
  Search, Filter, MessageSquare, AlertCircle, CheckCircle2,
  Clock, ShieldAlert, Wrench, Users, Fuel, ChevronDown, RefreshCw
} from 'lucide-react';
import ComplaintResolutionToolkit from './ComplaintResolutionToolkit';
import { getComplaints, updateComplaint } from '../../api/api';
import './complaints.css';

const CATEGORIES = ['All', 'Resource', 'Safety', 'Mechanical', 'Behavioral', 'Service'];
const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved'];
const ROLES = ['All', 'User', 'Driver'];

const PRIORITY_COLORS = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' };
const STATUS_COLORS = { Pending: '#f59e0b', 'In Progress': '#3b82f6', Resolved: '#22c55e' };

const CATEGORY_ICONS = {
  Resource: <Fuel size={14} />,
  Safety: <ShieldAlert size={14} />,
  Mechanical: <Wrench size={14} />,
  Behavioral: <Users size={14} />,
  Service: <Clock size={14} />,
};

export default function Complaints() {
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [toolkitComplaint, setToolkitComplaint] = useState(null);
  const [page, setPage] = useState(1);
  const PER_PAGE = 6;

  const fetchComplaints = () => {
    getComplaints()
      .then(data => setComplaints(data))
      .catch(err => console.error('Failed to load complaints:', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchComplaints();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchComplaints, 30000);
    return () => clearInterval(interval);
  }, []);

  const filtered = complaints.filter(c => {
    const q = search.toLowerCase();
    const matchSearch = (c.sender || '').toLowerCase().includes(q) ||
      (c.driver || '').toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q);
    return matchSearch &&
      (statusFilter === 'All' || c.status === statusFilter) &&
      (roleFilter === 'All' || c.role === roleFilter) &&
      (categoryFilter === 'All' || c.category === categoryFilter);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = {
    total: complaints.length,
    pending: complaints.filter(c => c.status === 'Pending').length,
    inProgress: complaints.filter(c => c.status === 'In Progress').length,
    resolved: complaints.filter(c => c.status === 'Resolved').length,
  };

  const handleMarkInProgress = async (complaint) => {
    try {
      const updated = await updateComplaint(complaint._id, { status: 'In Progress' });
      setComplaints(prev => prev.map(c => c._id === updated._id ? updated : c));
    } catch (err) {
      alert('Failed to update: ' + err.message);
    }
  };

  const handleResolve = async (resolution) => {
    try {
      const updated = await updateComplaint(resolution.complaintId, {
        status: 'Resolved',
        actions: resolution.actions.map(a => a.label),
        resolutionNotes: resolution.notes || '',
        driverAtFault: resolution.driverAtFault || false,
        resolvedAt: new Date().toISOString(),
      });
      setComplaints(prev => prev.map(c => c._id === resolution.complaintId ? updated : c));
      setToolkitComplaint(null);
      alert(`✅ Complaint resolved.\nActions: ${resolution.actions.map(a => a.label).join(', ')}`);
    } catch (err) {
      alert(`Failed to resolve: ${err.message}`);
    }
  };

  if (loading) return <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>Loading complaints...</div>;

  return (
    <div className="complaints-page">

      {/* Page Header */}
      <div className="cp-header">
        <div>
          <h1>Complaint Management</h1>
          <p>Review, investigate, and resolve transport complaints</p>
        </div>
        <button
          onClick={() => { setLoading(true); fetchComplaints(); }}
          style={{
            display: 'flex', alignItems: 'center', gap: 6,
            background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
            color: '#818cf8', borderRadius: 8, padding: '0.5rem 0.9rem',
            cursor: 'pointer', fontSize: 13, fontWeight: 600,
          }}
        >
          <RefreshCw size={15} /> Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="cp-stats">
        <div className="cp-stat-card">
          <div className="cp-stat-icon total"><MessageSquare size={18} /></div>
          <div><div className="cp-stat-val">{stats.total}</div><div className="cp-stat-lbl">Total</div></div>
        </div>
        <div className="cp-stat-card">
          <div className="cp-stat-icon pending"><AlertCircle size={18} /></div>
          <div><div className="cp-stat-val">{stats.pending}</div><div className="cp-stat-lbl">Pending</div></div>
        </div>
        <div className="cp-stat-card">
          <div className="cp-stat-icon progress"><Clock size={18} /></div>
          <div><div className="cp-stat-val">{stats.inProgress}</div><div className="cp-stat-lbl">In Progress</div></div>
        </div>
        <div className="cp-stat-card">
          <div className="cp-stat-icon resolved"><CheckCircle2 size={18} /></div>
          <div><div className="cp-stat-val">{stats.resolved}</div><div className="cp-stat-lbl">Resolved</div></div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="cp-toolbar">
        <div className="cp-search">
          <Search size={15} />
          <input
            placeholder="Search by ID, sender, driver..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>
        <div className="cp-filters">
          <div className="cp-filter-wrap">
            <Filter size={14} />
            <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }}>
              {STATUSES.map(s => <option key={s}>{s}</option>)}
            </select>
            <ChevronDown size={13} className="cp-chevron" />
          </div>
          <div className="cp-filter-wrap">
            <select value={roleFilter} onChange={e => { setRoleFilter(e.target.value); setPage(1); }}>
              {ROLES.map(r => <option key={r}>{r === 'All' ? 'All Roles' : r}</option>)}
            </select>
            <ChevronDown size={13} className="cp-chevron" />
          </div>
          <div className="cp-filter-wrap">
            <select value={categoryFilter} onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}>
              {CATEGORIES.map(c => <option key={c}>{c === 'All' ? 'All Categories' : c}</option>)}
            </select>
            <ChevronDown size={13} className="cp-chevron" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="cp-table-wrap">
        <table className="cp-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Sender / Role</th>
              <th>Vehicle / Driver</th>
              <th>Trip ID</th>
              <th>Category</th>
              <th>Description</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Date</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c._id}>
                <td><span className="cp-id">{c.tripId || c._id?.slice(-6)}</span></td>
                <td>
                  <div className="cp-sender">{c.sender}</div>
                  <span className={`cp-role-badge ${(c.role || '').toLowerCase()}`}>{c.role}</span>
                </td>
                <td>
                  <div className="cp-vehicle">{c.vehicle || '—'}</div>
                  <div className="cp-driver-name">{c.driver || '—'}</div>
                </td>
                <td><span className="cp-trip">{c.tripId || '—'}</span></td>
                <td>
                  <span className="cp-category-tag">
                    {CATEGORY_ICONS[c.category]}
                    {c.category}
                  </span>
                </td>
                <td>
                  <span className="cp-desc" title={c.description}>
                    {c.description.length > 55 ? c.description.slice(0, 55) + '…' : c.description}
                  </span>
                </td>
                <td>
                  <span className="cp-priority" style={{ color: PRIORITY_COLORS[c.priority], borderColor: PRIORITY_COLORS[c.priority] }}>
                    <span className="cp-dot" style={{ background: PRIORITY_COLORS[c.priority] }} />
                    {c.priority}
                  </span>
                </td>
                <td>
                  <span className="cp-status" style={{ color: STATUS_COLORS[c.status], background: STATUS_COLORS[c.status] + '18' }}>
                    {c.status}
                  </span>
                </td>
                <td><span className="cp-date">{c.createdAt ? c.createdAt.slice(0, 10) : '—'}</span></td>
                <td>
                  {c.status === 'Resolved' ? (
                    <span className="cp-resolved-tag"><CheckCircle2 size={13} /> Resolved</span>
                  ) : c.status === 'Pending' ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <button className="cp-inprogress-btn" onClick={() => handleMarkInProgress(c)}>
                        <Clock size={13} /> Mark In Progress
                      </button>
                      <button className="cp-toolkit-btn" onClick={() => setToolkitComplaint(c)}>
                        <ShieldAlert size={13} /> Resolve
                      </button>
                    </div>
                  ) : (
                    <button className="cp-toolkit-btn" onClick={() => setToolkitComplaint(c)}>
                      <ShieldAlert size={13} /> Resolution Toolkit
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan="10" className="cp-empty">
                  <CheckCircle2 size={28} />
                  <p>No complaints match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="cp-pagination">
          <span className="cp-page-info">
            Showing {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="cp-page-controls">
            <button className="cp-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`cp-page-num ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button className="cp-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {/* Resolution Toolkit Modal */}
      {toolkitComplaint && (
        <ComplaintResolutionToolkit
          complaint={toolkitComplaint}
          onClose={() => setToolkitComplaint(null)}
          onResolve={handleResolve}
        />
      )}
    </div>
  );
}
