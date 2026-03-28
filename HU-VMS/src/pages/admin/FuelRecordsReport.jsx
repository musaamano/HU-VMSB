import { useState, useEffect } from 'react';
import { getFuelRecords, getVehicles, createFuelRecord, deleteFuelRecord } from '../../api/api';
import ExportButton from '../../components/ExportButton';
import Pagination from '../../components/Pagination';
import ReportFilters, { filterByDate } from '../../components/ReportFilters';
import './adminTheme.css';
import './fuelRecordsReport.css';

const Toast = ({ msg, type }) => msg ? (
  <div style={{
    position: 'fixed', top: 20, right: 20, zIndex: 9999,
    background: type === 'error' ? '#ef4444' : '#22c55e',
    color: '#fff', padding: '10px 20px', borderRadius: 10,
    fontWeight: 600, fontSize: 14, boxShadow: '0 4px 16px rgba(0,0,0,0.15)',
  }}>{msg}</div>
) : null;

const EMPTY_FORM = {
  vehicle: '', fuelType: 'Diesel', quantity: '', cost: '', odometer: '', date: '',
};

const FuelRecordsReport = () => {
  const [records, setRecords]     = useState([]);
  const [vehicles, setVehicles]   = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showForm, setShowForm]   = useState(false);
  const [form, setForm]           = useState(EMPTY_FORM);
  const [saving, setSaving]       = useState(false);
  const [toast, setToast]         = useState({ msg: '', type: 'success' });
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterFuelType, setFilterFuelType] = useState('All');
  const [period, setPeriod]             = useState('all');
  const [currentPage, setCurrentPage]   = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast({ msg: '', type: 'success' }), 3000);
  };

  useEffect(() => {
    Promise.all([getFuelRecords(), getVehicles()])
      .then(([recs, vehs]) => { setRecords(recs); setVehicles(vehs); })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handleAdd = async () => {
    if (!form.vehicle)  return showToast('Select a vehicle', 'error');
    if (!form.quantity) return showToast('Quantity is required', 'error');
    if (!form.cost)     return showToast('Cost is required', 'error');
    setSaving(true);
    try {
      const veh = vehicles.find(v => v._id === form.vehicle);
      const rec = await createFuelRecord({
        vehicle:     form.vehicle,
        plateNumber: veh?.plateNumber || '',
        model:       veh?.model || '',
        fuelType:    form.fuelType,
        quantity:    Number(form.quantity),
        cost:        Number(form.cost),
        odometer:    Number(form.odometer) || 0,
        date:        form.date || new Date().toISOString(),
      });
      setRecords(r => [rec, ...r]);
      setForm(EMPTY_FORM);
      setShowForm(false);
      showToast('Fuel record added');
    } catch (err) {
      showToast(err.message, 'error');
    } finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this record?')) return;
    try {
      await deleteFuelRecord(id);
      setRecords(r => r.filter(x => x._id !== id));
      showToast('Record deleted');
    } catch (err) { showToast(err.message, 'error'); }
  };

  const filtered = filterByDate(records, period, 'date').filter(r => {
    const q = searchTerm.toLowerCase();
    const matchSearch =
      (r.plateNumber || r.vehicle?.plateNumber || '').toLowerCase().includes(q) ||
      (r.model || r.vehicle?.model || '').toLowerCase().includes(q) ||
      (r.driverName || r.driver?.name || '').toLowerCase().includes(q);
    const matchFuel = filterFuelType === 'All' || r.fuelType === filterFuelType;
    return matchSearch && matchFuel;
  });

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const current    = filtered.slice(startIndex, startIndex + itemsPerPage);

  const totalQty  = records.reduce((s, r) => s + (r.quantity || 0), 0);
  const totalCost = records.reduce((s, r) => s + (r.cost || 0), 0);

  const exportData = filtered.map(r => ({
    Plate:    r.plateNumber || r.vehicle?.plateNumber || '—',
    Model:    r.model || r.vehicle?.model || '—',
    Date:     r.date ? new Date(r.date).toLocaleDateString() : '—',
    FuelType: r.fuelType,
    Quantity: `${r.quantity} L`,
    Cost:     `${r.cost} ETB`,
    Odometer: `${r.odometer} km`,
    Driver:   r.driverName || r.driver?.name || '—',
  }));

  return (
    <div className="fuel-records-container">
      <Toast msg={toast.msg} type={toast.type} />

      <div className="report-header">
        <h1>Fuel Records Report</h1>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowForm(s => !s)}
            style={{ padding: '8px 18px', background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {showForm ? '✕ Cancel' : '+ Add Record'}
          </button>
          <ExportButton data={exportData} filename="fuel_records_report" reportTitle="Fuel Records Report" />
        </div>
      </div>

      {/* Summary */}
      <div className="fuel-summary">
        <div className="summary-card">
          <div className="summary-icon">⛽</div>
          <div className="summary-content"><h3>{totalQty.toFixed(1)} L</h3><p>Total Fuel</p></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">💰</div>
          <div className="summary-content"><h3>{totalCost.toLocaleString()} ETB</h3><p>Total Cost</p></div>
        </div>
        <div className="summary-card">
          <div className="summary-icon">📊</div>
          <div className="summary-content"><h3>{records.length}</h3><p>Total Records</p></div>
        </div>
      </div>

      {/* Add Form */}
      {showForm && (
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12,
          padding: 24, marginBottom: 24 }}>
          <h3 style={{ margin: '0 0 16px', color: '#1e293b' }}>Add Fuel Record</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Vehicle *</label>
              <select value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                <option value="">Select vehicle</option>
                {vehicles.map(v => <option key={v._id} value={v._id}>{v.plateNumber} — {v.model}</option>)}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Fuel Type</label>
              <select value={form.fuelType} onChange={e => setForm(f => ({ ...f, fuelType: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }}>
                <option>Diesel</option><option>Gasoline</option><option>Electric</option><option>Hybrid</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Quantity (L) *</label>
              <input type="number" value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: e.target.value }))}
                placeholder="e.g. 45" style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Cost (ETB) *</label>
              <input type="number" value={form.cost} onChange={e => setForm(f => ({ ...f, cost: e.target.value }))}
                placeholder="e.g. 3150" style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Odometer (km)</label>
              <input type="number" value={form.odometer} onChange={e => setForm(f => ({ ...f, odometer: e.target.value }))}
                placeholder="e.g. 45230" style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 13, fontWeight: 600, color: '#374151', display: 'block', marginBottom: 4 }}>Date</label>
              <input type="date" value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
                style={{ width: '100%', padding: '9px 12px', border: '1px solid #d1d5db', borderRadius: 8, fontSize: 14 }} />
            </div>
          </div>
          <button onClick={handleAdd} disabled={saving}
            style={{ marginTop: 16, padding: '10px 24px', background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: 8, fontWeight: 600, cursor: 'pointer', fontSize: 14 }}>
            {saving ? 'Saving...' : '✓ Save Record'}
          </button>
        </div>
      )}

      <ReportFilters period={period} onPeriod={p => { setPeriod(p); setCurrentPage(1); }} />

      {/* Filters */}
      <div className="controls-bar">
        <input type="text" placeholder="Search by plate, model or driver..."
          value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
          className="search-input" />
        <select value={filterFuelType}
          onChange={e => { setFilterFuelType(e.target.value); setCurrentPage(1); }}
          className="filter-select">
          <option value="All">All Fuel Types</option>
          <option>Diesel</option><option>Gasoline</option><option>Electric</option><option>Hybrid</option>
        </select>
      </div>

      {loading ? (
        <p style={{ textAlign: 'center', color: '#94a3b8', padding: 40 }}>Loading...</p>
      ) : (
        <>
          <div style={{ width:'100%', overflowX:'auto', WebkitOverflowScrolling:'touch', borderRadius:12, border:'2px solid #16a34a', boxShadow:'0 2px 8px rgba(0,0,0,0.06)' }}>
            <table className="fuel-table" style={{ minWidth:900, width:'100%', borderCollapse:'collapse' }}>
              <thead>
                <tr>
                  <th>#</th><th>Plate</th><th>Model</th><th>Date</th>
                  <th>Fuel Type</th><th>Quantity</th><th>Cost (ETB)</th><th>Odometer</th><th>Driver</th><th>Action</th>
                </tr>
              </thead>
              <tbody>
                {current.map((r, i) => (
                  <tr key={r._id}>
                    <td>{startIndex + i + 1}</td>
                    <td>{r.plateNumber || r.vehicle?.plateNumber || '—'}</td>
                    <td>{r.model || r.vehicle?.model || '—'}</td>
                    <td>{r.date ? new Date(r.date).toLocaleDateString() : '—'}</td>
                    <td><span className="fuel-type-badge">{r.fuelType}</span></td>
                    <td>{r.quantity} L</td>
                    <td>{r.cost?.toLocaleString()}</td>
                    <td>{r.odometer} km</td>
                    <td>{r.driverName || r.driver?.name || '—'}</td>
                    <td>
                      <button onClick={() => handleDelete(r._id)}
                        style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca',
                          borderRadius: 6, padding: '4px 10px', cursor: 'pointer', fontSize: 13 }}>
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && <div className="no-results">No fuel records found. Click "+ Add Record" to add one.</div>}
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

export default FuelRecordsReport;
