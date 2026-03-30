import { useState, useEffect } from 'react';
import { getDrivers, getRequests } from '../../api/api';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';
import ReportFilters, { filterByDate } from '../../components/ReportFilters';
import './adminTheme.css';
import './driverTripReport.css';

const DriverTripReport = () => {
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
          return {
            _id: d._id,
            name: d.name,
            licenseNumber: d.licenseNumber || '—',
            vehicle: d.assignedVehicle?.plateNumber || '—',
            totalTrips: driverTrips.length,
            completed,
            status: d.status,
            completedAt: driverTrips.filter(r => r.status === 'completed' && r.completedAt)
              .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))[0]?.completedAt || null,
          };
        });
        setRows(data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = rows.filter(r => {
    const q = searchTerm.toLowerCase();
    return r.name?.toLowerCase().includes(q) ||
           r.licenseNumber?.toLowerCase().includes(q) ||
           r.vehicle?.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current    = filtered.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="driver-trip-report-container">
      <div className="report-header">
        <h1>Driver Trip Report</h1>
        <ExportButton data={filtered} filename="driver_trip_report" reportTitle="Driver Trip Report" />
      </div>

      <ReportFilters period={period} onPeriod={p => { setPeriod(p); setCurrentPage(1); }} />

      <div className="controls-bar">
        <input type="text" placeholder="Search by driver name, license, or vehicle..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input" />
      </div>

      {loading ? (
        <p style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Loading...</p>
      ) : (
        <>
          <div style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:12, border:'2px solid #16a34a', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <table className="report-table" style={{ minWidth:800, width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>Driver Name</th><th>License Number</th>
                  <th>Assigned Vehicle</th><th>Total Trips</th><th>Completed</th><th>Status</th><th>Date Added</th>
                </tr>
              </thead>
              <tbody>
                {current.map((d, i) => (
                  <tr key={d._id}>
                    <td>{startIndex + i + 1}</td>
                    <td>{d.name}</td>
                    <td>{d.licenseNumber}</td>
                    <td>{d.vehicle}</td>
                    <td>{d.totalTrips}</td>
                    <td>{d.completed}</td>
                    <td><span className={`status-badge status-${d.status}`}>{d.status}</span></td>
                    <td>{d.createdAt ? new Date(d.createdAt).toLocaleDateString() : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-results">No driver trips found</div>}
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

export default DriverTripReport;
