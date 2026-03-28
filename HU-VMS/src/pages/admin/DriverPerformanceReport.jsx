import { useState, useEffect } from 'react';
import { getDrivers, getRequests } from '../../api/api';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';
import ReportFilters from '../../components/ReportFilters';
import './adminTheme.css';
import './driverPerformanceReport.css';

const DriverPerformanceReport = () => {
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(true);
  const [searchTerm, setSearchTerm]   = useState('');
  const [period, setPeriod]           = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  useEffect(() => {
    Promise.all([getDrivers(), getRequests()])
      .then(([drivers, requests]) => {
        const data = drivers.map(d => {
          const driverTrips = requests.filter(r => r.driver?._id === d._id || r.driver === d._id);
          const completed   = driverTrips.filter(r => r.status === 'completed').length;
          const total       = driverTrips.length;
          const efficiency  = total > 0 ? Math.round((completed / total) * 100) + '%' : '—';
          return {
            _id: d._id,
            name: d.name,
            totalTrips: total,
            completed,
            late: total - completed,
            status: d.status,
            efficiency,
          };
        });
        setRows(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r =>
    r.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current    = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="driver-performance-container">
      <div className="report-header">
        <h1>Driver Performance Report</h1>
        <ExportButton data={filtered} filename="driver_performance_report" reportTitle="Driver Performance Report" />
      </div>

      <ReportFilters period={period} onPeriod={p => { setPeriod(p); setCurrentPage(1); }} />

      <div className="controls-bar">
        <input type="text" placeholder="Search by driver name..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input" />
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Loading...</p>
      ) : (
        <>
          <div style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:12, border:'2px solid #16a34a', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <table className="performance-table" style={{ minWidth:800, width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>Driver Name</th><th>Total Trips</th>
                  <th>Completed</th><th>Incomplete</th><th>Efficiency</th><th>Status</th>
                </tr>
              </thead>
              <tbody>
                {current.map((d, i) => (
                  <tr key={d._id}>
                    <td>{startIndex + i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.totalTrips}</td>
                    <td><span className="badge-success">{d.completed}</span></td>
                    <td><span className="badge-warning">{d.late}</span></td>
                    <td><span className="efficiency-badge">{d.efficiency}</span></td>
                    <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-results">No performance data found</div>}
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

export default DriverPerformanceReport;
