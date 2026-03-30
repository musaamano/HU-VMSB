import { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Filter, Download, ChevronDown, Calendar,
  User, Car, Hash, FileText, CheckCircle2, Clock,
  AlertTriangle, ShieldAlert, Wrench, Users, Fuel,
  TrendingUp, BarChart2, Eye, X, FileSpreadsheet, Sheet
} from 'lucide-react';
import { getComplaints } from '../../api/api';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import './complaintHistory.css';

const STATUSES = ['All', 'Pending', 'In Progress', 'Resolved'];
const ROLES = ['All', 'User', 'Driver'];
const CATEGORIES = ['All', 'Resource', 'Safety', 'Mechanical', 'Behavioral', 'Service'];
const PRIORITIES = ['All', 'Critical', 'High', 'Medium', 'Low'];

const PRIORITY_COLORS = { Critical: '#dc2626', High: '#f59e0b', Medium: '#3b82f6', Low: '#22c55e' };
const STATUS_COLORS = { Pending: '#f59e0b', 'In Progress': '#3b82f6', Resolved: '#22c55e' };
const CATEGORY_ICONS = {
  Resource: <Fuel size={13} />, Safety: <ShieldAlert size={13} />,
  Mechanical: <Wrench size={13} />, Behavioral: <Users size={13} />, Service: <Clock size={13} />,
};

function FilterSelect({ icon, value, onChange, options, placeholder }) {
  return (
    <div className="ch-filter-wrap">
      {icon && <span className="ch-filter-icon">{icon}</span>}
      <select value={value} onChange={e => onChange(e.target.value)}>
        {options.map(o => <option key={o} value={o}>{o === 'All' ? (placeholder || 'All') : o}</option>)}
      </select>
      <ChevronDown size={12} className="ch-chevron" />
    </div>
  );
}

export default function ComplaintHistory() {
  const [allComplaints, setAllComplaints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [roleFilter, setRoleFilter] = useState('All');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [priorityFilter, setPriorityFilter] = useState('All');
  const [driverFilter, setDriverFilter] = useState('All');
  const [senderFilter, setSenderFilter] = useState('All');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [detailItem, setDetailItem] = useState(null);
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef(null);
  const PER_PAGE = 6;

  useEffect(() => {
    getComplaints()
      .then(data => setAllComplaints(data))
      .catch(err => console.error('Failed to load complaints:', err))
      .finally(() => setLoading(false));
  }, []);

  const drivers = useMemo(() => ['All', ...new Set(allComplaints.map(c => c.driver).filter(Boolean))], [allComplaints]);
  const senders = useMemo(() => ['All', ...new Set(allComplaints.map(c => c.sender).filter(Boolean))], [allComplaints]);

  const filtered = useMemo(() => {
    return allComplaints.filter(c => {
      const q = search.toLowerCase();
      const dateStr = c.createdAt ? c.createdAt.slice(0, 10) : '';
      const matchSearch = !q ||
        (c.sender || '').toLowerCase().includes(q) ||
        (c.driver || '').toLowerCase().includes(q) ||
        (c.description || '').toLowerCase().includes(q) ||
        (c.tripId || '').toLowerCase().includes(q);
      const matchStatus = statusFilter === 'All' || c.status === statusFilter;
      const matchRole = roleFilter === 'All' || c.role === roleFilter;
      const matchCat = categoryFilter === 'All' || c.category === categoryFilter;
      const matchPri = priorityFilter === 'All' || c.priority === priorityFilter;
      const matchDriver = driverFilter === 'All' || c.driver === driverFilter;
      const matchSender = senderFilter === 'All' || c.sender === senderFilter;
      const matchFrom = !dateFrom || dateStr >= dateFrom;
      const matchTo = !dateTo || dateStr <= dateTo;
      return matchSearch && matchStatus && matchRole && matchCat && matchPri && matchDriver && matchSender && matchFrom && matchTo;
    });
  }, [allComplaints, search, statusFilter, roleFilter, categoryFilter, priorityFilter, driverFilter, senderFilter, dateFrom, dateTo]);

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paginated = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const stats = useMemo(() => ({
    total: filtered.length,
    resolved: filtered.filter(c => c.status === 'Resolved').length,
    inProgress: filtered.filter(c => c.status === 'In Progress').length,
    driverFault: filtered.filter(c => c.driverAtFault).length,
    resolutionRate: filtered.length
      ? Math.round((filtered.filter(c => c.status === 'Resolved').length / filtered.length) * 100) : 0,
  }), [filtered]);

  const resetFilters = () => {
    setSearch(''); setStatusFilter('All'); setRoleFilter('All');
    setCategoryFilter('All'); setPriorityFilter('All');
    setDriverFilter('All'); setSenderFilter('All');
    setDateFrom(''); setDateTo(''); setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'All' || roleFilter !== 'All' ||
    categoryFilter !== 'All' || priorityFilter !== 'All' || driverFilter !== 'All' ||
    senderFilter !== 'All' || dateFrom || dateTo;

  const exportRows = () => filtered.map(c => ({
    Sender: c.sender || '',
    Role: c.role || '',
    Driver: c.driver || '',
    Vehicle: c.vehicle || '',
    'Trip ID': c.tripId || '',
    Category: c.category || '',
    Priority: c.priority || '',
    Status: c.status || '',
    Submitted: c.createdAt ? c.createdAt.slice(0, 10) : '',
    Resolved: c.resolvedAt ? c.resolvedAt.slice(0, 10) : '-',
    'Driver at Fault': c.driverAtFault ? 'Yes' : 'No',
    'Actions Taken': (c.actions || []).join('; '),
    Notes: c.resolutionNotes || '-',
  }));

  const exportCSV = () => {
    const rows = exportRows();
    const headers = Object.keys(rows[0] || {});
    const csv = [headers, ...rows.map(r => headers.map(h => `"${r[h]}"`))]
      .map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `complaints-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportOpen(false);
  };

  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(exportRows());
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Complaints');
    XLSX.writeFile(wb, `complaints-${new Date().toISOString().slice(0, 10)}.xlsx`);
    setExportOpen(false);
  };

  const exportPDF = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.setFontSize(14);
    doc.text('Complaint History Report', 14, 15);
    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Generated: ${new Date().toLocaleDateString()} · ${filtered.length} records`, 14, 22);
    autoTable(doc, {
      startY: 28,
      head: [['Sender', 'Role', 'Driver', 'Category', 'Priority', 'Status', 'Submitted', 'Resolved', 'Fault', 'Actions']],
      body: filtered.map(c => [
        c.sender, c.role, c.driver || '—', c.category, c.priority, c.status,
        c.createdAt ? c.createdAt.slice(0, 10) : '—',
        c.resolvedAt ? c.resolvedAt.slice(0, 10) : '—',
        c.driverAtFault ? 'Yes' : 'No',
        (c.actions || []).join(', ') || '—',
      ]),
      styles: { fontSize: 8, cellPadding: 3 },
      headStyles: { fillColor: [99, 102, 241], textColor: 255, fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });
    doc.save(`complaints-${new Date().toISOString().slice(0, 10)}.pdf`);
    setExportOpen(false);
  };

  if (loading) return (
    <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-secondary)' }}>
      Loading complaints...
    </div>
  );

  return (
    <div className="ch-page">

      <div className="ch-header">
        <div>
          <h1>Complaint History</h1>
          <p>Full audit trail of all complaints with resolution details</p>
        </div>
        <div className="ch-export-wrap" ref={exportRef}>
          <button className="ch-export-btn" onClick={() => setExportOpen(o => !o)}>
            <Download size={14} /> Export <ChevronDown size={13} />
          </button>
          {exportOpen && (
            <div className="ch-export-menu">
              <button onClick={exportCSV}>
                <FileText size={14} /> Export CSV
              </button>
              <button onClick={exportExcel}>
                <FileSpreadsheet size={14} /> Export Excel (.xlsx)
              </button>
              <button onClick={exportPDF}>
                <Download size={14} /> Export PDF
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="ch-stats">
        <div className="ch-stat"><div className="ch-stat-icon total"><BarChart2 size={17} /></div><div><div className="ch-stat-val">{stats.total}</div><div className="ch-stat-lbl">Filtered Total</div></div></div>
        <div className="ch-stat"><div className="ch-stat-icon resolved"><CheckCircle2 size={17} /></div><div><div className="ch-stat-val">{stats.resolved}</div><div className="ch-stat-lbl">Resolved</div></div></div>
        <div className="ch-stat"><div className="ch-stat-icon progress"><Clock size={17} /></div><div><div className="ch-stat-val">{stats.inProgress}</div><div className="ch-stat-lbl">In Progress</div></div></div>
        <div className="ch-stat"><div className="ch-stat-icon fault"><AlertTriangle size={17} /></div><div><div className="ch-stat-val">{stats.driverFault}</div><div className="ch-stat-lbl">Driver at Fault</div></div></div>
        <div className="ch-stat"><div className="ch-stat-icon rate"><TrendingUp size={17} /></div><div><div className="ch-stat-val">{stats.resolutionRate}%</div><div className="ch-stat-lbl">Resolution Rate</div></div></div>
      </div>

      <div className="ch-filters-panel">
        <div className="ch-filters-row">
          <div className="ch-search">
            <Search size={14} />
            <input
              placeholder="Search sender, driver, trip..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="ch-date-range">
            <Calendar size={14} className="ch-date-icon" />
            <input type="date" value={dateFrom} onChange={e => { setDateFrom(e.target.value); setPage(1); }} />
            <span className="ch-date-sep">—</span>
            <input type="date" value={dateTo} onChange={e => { setDateTo(e.target.value); setPage(1); }} />
          </div>
          {hasActiveFilters && (
            <button className="ch-reset-btn" onClick={resetFilters}><X size={13} /> Clear Filters</button>
          )}
        </div>
        <div className="ch-filters-row">
          <FilterSelect icon={<Filter size={13} />} value={statusFilter} onChange={v => { setStatusFilter(v); setPage(1); }} options={STATUSES} placeholder="All Statuses" />
          <FilterSelect value={roleFilter} onChange={v => { setRoleFilter(v); setPage(1); }} options={ROLES} placeholder="All Roles" />
          <FilterSelect value={categoryFilter} onChange={v => { setCategoryFilter(v); setPage(1); }} options={CATEGORIES} placeholder="All Categories" />
          <FilterSelect value={priorityFilter} onChange={v => { setPriorityFilter(v); setPage(1); }} options={PRIORITIES} placeholder="All Priorities" />
          <FilterSelect icon={<User size={13} />} value={senderFilter} onChange={v => { setSenderFilter(v); setPage(1); }} options={senders} placeholder="All Senders" />
          <FilterSelect icon={<Car size={13} />} value={driverFilter} onChange={v => { setDriverFilter(v); setPage(1); }} options={drivers} placeholder="All Drivers" />
        </div>
      </div>

      <div className="ch-table-wrap">
        <div className="ch-table-meta">
          <span>{filtered.length} record{filtered.length !== 1 ? 's' : ''} found</span>
        </div>
        <table className="ch-table">
          <thead>
            <tr>
              <th>Sender / Role</th>
              <th>Driver</th>
              <th>Category</th>
              <th>Priority</th>
              <th>Status</th>
              <th>Submitted</th>
              <th>Resolved</th>
              <th>Fault</th>
              <th>Actions Taken</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {paginated.map(c => (
              <tr key={c._id}>
                <td>
                  <div className="ch-sender">{c.sender}</div>
                  <span className={`ch-role-badge ${(c.role || '').toLowerCase()}`}>{c.role}</span>
                </td>
                <td>
                  <div className="ch-driver">{c.driver || '—'}</div>
                  <div className="ch-vehicle-sm">{(c.vehicle || '').split(' ').slice(0, 2).join(' ')}</div>
                </td>
                <td>
                  <span className="ch-cat-tag">{CATEGORY_ICONS[c.category]} {c.category}</span>
                </td>
                <td>
                  <span className="ch-priority" style={{ color: PRIORITY_COLORS[c.priority] }}>
                    <span className="ch-dot" style={{ background: PRIORITY_COLORS[c.priority] }} />
                    {c.priority}
                  </span>
                </td>
                <td>
                  <span className="ch-status" style={{ color: STATUS_COLORS[c.status], background: STATUS_COLORS[c.status] + '18' }}>
                    {c.status}
                  </span>
                </td>
                <td><span className="ch-date">{c.createdAt ? c.createdAt.slice(0, 10) : '—'}</span></td>
                <td><span className="ch-date">{c.resolvedAt ? c.resolvedAt.slice(0, 10) : '—'}</span></td>
                <td>
                  {c.driverAtFault
                    ? <span className="ch-fault yes">Yes</span>
                    : <span className="ch-fault no">No</span>}
                </td>
                <td>
                  <div className="ch-actions-taken">
                    {(c.actions || []).slice(0, 2).map((a, i) => (
                      <span key={i} className="ch-action-chip">{a}</span>
                    ))}
                    {(c.actions || []).length > 2 && (
                      <span className="ch-action-more">+{c.actions.length - 2}</span>
                    )}
                  </div>
                </td>
                <td>
                  <button className="ch-view-btn" onClick={() => setDetailItem(c)}>
                    <Eye size={13} /> View
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan="10" className="ch-empty">
                  <FileText size={28} />
                  <p>No records match your filters.</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="ch-pagination">
          <span className="ch-page-info">
            {(page - 1) * PER_PAGE + 1}–{Math.min(page * PER_PAGE, filtered.length)} of {filtered.length}
          </span>
          <div className="ch-page-controls">
            <button className="ch-page-btn" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Previous</button>
            {[...Array(totalPages)].map((_, i) => (
              <button key={i} className={`ch-page-num ${page === i + 1 ? 'active' : ''}`} onClick={() => setPage(i + 1)}>
                {i + 1}
              </button>
            ))}
            <button className="ch-page-btn" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        </div>
      )}

      {detailItem && (
        <div className="ch-detail-overlay" onClick={() => setDetailItem(null)}>
          <div className="ch-detail-modal" onClick={e => e.stopPropagation()}>
            <div className="ch-detail-header">
              <div>
                <h2>Complaint Detail</h2>
                <span className="ch-detail-id">{detailItem.tripId || detailItem._id?.slice(-8)}</span>
              </div>
              <button className="ch-detail-close" onClick={() => setDetailItem(null)}><X size={18} /></button>
            </div>
            <div className="ch-detail-body">
              <div className="ch-detail-grid">
                <div className="ch-detail-row"><span className="ch-dl">Sender</span><span>{detailItem.sender} <em className="ch-role-em">({detailItem.role})</em></span></div>
                <div className="ch-detail-row"><span className="ch-dl">Driver</span><span>{detailItem.driver || '—'}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Vehicle</span><span>{detailItem.vehicle || '—'}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Trip ID</span><span>{detailItem.tripId || '—'}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Category</span><span>{detailItem.category}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Priority</span>
                  <span style={{ color: PRIORITY_COLORS[detailItem.priority], fontWeight: 600 }}>{detailItem.priority}</span>
                </div>
                <div className="ch-detail-row"><span className="ch-dl">Status</span>
                  <span className="ch-status" style={{ color: STATUS_COLORS[detailItem.status], background: STATUS_COLORS[detailItem.status] + '18' }}>{detailItem.status}</span>
                </div>
                <div className="ch-detail-row"><span className="ch-dl">Submitted</span><span>{detailItem.createdAt ? detailItem.createdAt.slice(0, 10) : '—'}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Resolved</span><span>{detailItem.resolvedAt ? detailItem.resolvedAt.slice(0, 10) : '—'}</span></div>
                <div className="ch-detail-row"><span className="ch-dl">Driver at Fault</span>
                  <span className={`ch-fault ${detailItem.driverAtFault ? 'yes' : 'no'}`}>{detailItem.driverAtFault ? 'Yes' : 'No'}</span>
                </div>
              </div>
              <div className="ch-detail-section">
                <div className="ch-detail-section-title"><FileText size={14} /> Description</div>
                <p className="ch-detail-text">{detailItem.description}</p>
              </div>
              {(detailItem.actions || []).length > 0 && (
                <div className="ch-detail-section">
                  <div className="ch-detail-section-title"><CheckCircle2 size={14} /> Actions Taken</div>
                  <div className="ch-detail-actions">
                    {(detailItem.actions || []).map((a, i) => (
                      <span key={i} className="ch-action-chip">{a}</span>
                    ))}
                  </div>
                </div>
              )}
              {detailItem.resolutionNotes && (
                <div className="ch-detail-section">
                  <div className="ch-detail-section-title"><Hash size={14} /> Resolution Notes</div>
                  <p className="ch-detail-text">{detailItem.resolutionNotes}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
