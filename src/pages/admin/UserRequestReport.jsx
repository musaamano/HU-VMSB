import { useState, useEffect } from 'react';
import { getRequests, cancelAdminTrip } from '../../api/api';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';
import ReportFilters, { filterByDate } from '../../components/ReportFilters';
import './adminTheme.css';
import './userRequestReport.css';

const UserRequestReport = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [period, setPeriod]           = useState('all');
  const [filterDept, setFilterDept]   = useState('');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    getRequests()
      .then(setRequests)
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleCancelClick = async (tripId) => {
    if (!window.confirm("Are you sure you want to cancel this trip as Admin?")) return;
    try {
      await cancelAdminTrip(tripId, 'Cancelled by Admin');
      const data = await getRequests();
      setRequests(data);
    } catch (e) {
      alert("Error: " + e.message);
    }
  };

  const departments = [...new Set(requests.map(r => r.department).filter(Boolean))].sort();

  const filtered = filterByDate(requests, period, 'createdAt').filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      r.requestedBy?.name?.toLowerCase().includes(q) ||
      r.requestedBy?.username?.toLowerCase().includes(q) ||
      r.requester?.toLowerCase().includes(q) ||
      r.destination?.toLowerCase().includes(q) ||
      r.purpose?.toLowerCase().includes(q);
    const matchFilter = filterStatus === 'All' || r.status === filterStatus.toLowerCase();
    const matchDept   = !filterDept || r.department === filterDept;
    return matchSearch && matchFilter && matchDept;
  });

  const totalPages  = Math.ceil(filtered.length / itemsPerPage);
  const startIndex  = (currentPage - 1) * itemsPerPage;
  const current     = filtered.slice(startIndex, startIndex + itemsPerPage);

  const getStatusClass = (s) => {
    if (s === 'pending')   return 'status-pending';
    if (s === 'approved' || s === 'in-progress') return 'status-approved';
    if (s === 'completed') return 'status-approved';
    if (s === 'rejected')  return 'status-rejected';
    return '';
  };

  const exportData = filtered.map(r => ({
    User: r.requestedBy?.name || r.requestedBy?.username || '—',
    Destination: r.destination || '—',
    Purpose: r.purpose || '—',
    RequestDate: r.requestDate ? new Date(r.requestDate).toLocaleDateString() : '—',
    TripDate: r.tripDate ? new Date(r.tripDate).toLocaleDateString() : '—',
    Status: r.status,
    Priority: r.priority || '—',
  }));

  return (
    <div className="user-request-report-container">
      <div className="report-header">
        <h1>User Request Report</h1>
        <ExportButton data={exportData} filename="user_request_report" reportTitle="User Request Report" />
      </div>

      <ReportFilters
        period={period} onPeriod={p => { setPeriod(p); setCurrentPage(1); }}
        department={filterDept} onDepartment={d => { setFilterDept(d); setCurrentPage(1); }}
        departments={departments}
      />

      <div className="controls-bar">
        <input type="text" placeholder="Search by user, destination, purpose..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input" />
        <select value={filterStatus}
          onChange={e => { setFilterStatus(e.target.value); setCurrentPage(1); }}
          className="filter-select">
          <option value="All">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="In-progress">In Progress</option>
          <option value="Completed">Completed</option>
          <option value="Rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Loading...</p>
      ) : (
        <>
          <div style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:12, border:'2px solid #16a34a', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <table className="report-table" style={{ minWidth:900, width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>User</th><th>Destination</th><th>Purpose</th>
                  <th>Request Date</th><th>Trip Date</th><th>Priority</th><th>Status</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {current.map((r, i) => (
                  <tr key={r._id}>
                    <td>{startIndex + i + 1}</td>
                    <td>{r.requestedBy?.name || r.requestedBy?.username || '—'}</td>
                    <td>{r.destination || '—'}</td>
                    <td>{r.purpose || '—'}</td>
                    <td>{r.requestDate ? new Date(r.requestDate).toLocaleDateString() : '—'}</td>
                    <td>{r.tripDate ? new Date(r.tripDate).toLocaleDateString() : '—'}</td>
                    <td>
                      <span className={`priority-badge priority-${(r.priority||'low').toLowerCase()}`}>
                        {r.priority || 'Normal'}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(r.status)}`}>{r.status}</span>
                    </td>
                    <td>
                      {r.status !== 'cancelled' && r.status !== 'completed' && r.status !== 'rejected' && (
                        <button 
                          onClick={() => handleCancelClick(r._id)} 
                          style={{ padding: '4px 8px', backgroundColor: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>
                          Cancel
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-results">No requests found</div>}
          </div>

          {filtered.length > 0 && (
            <Pagination
              currentPage={currentPage} totalPages={totalPages}
              onPageChange={setCurrentPage} totalItems={filtered.length}
              startIndex={startIndex} itemsPerPage={itemsPerPage}
              onItemsPerPageChange={n => { setItemsPerPage(n); setCurrentPage(1); }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default UserRequestReport;
