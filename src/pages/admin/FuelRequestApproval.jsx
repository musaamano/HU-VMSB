import { useState, useEffect } from 'react';
import { getAdminFuelRequests, approveAdminFuelRequest, rejectAdminFuelRequest } from '../../api/api';
import { RefreshCw, CheckCircle, XCircle, Fuel } from 'lucide-react';
import './adminTheme.css';

const STATUS_COLOR = { Pending: '#f59e0b', Approved: '#22c55e', Rejected: '#ef4444', Dispensed: '#6366f1' };

export default function FuelRequestApproval() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [acting, setActing]     = useState(null);
  const [rejectReason, setRejectReason] = useState({});
  const [filter, setFilter]     = useState('Pending');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getAdminFuelRequests().catch(() => []);
      setRequests(Array.isArray(data) ? data : []);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id) => {
    setActing(id);
    try {
      await approveAdminFuelRequest(id);
      await load();
    } catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const handleReject = async (id) => {
    const reason = rejectReason[id];
    if (!reason?.trim()) return alert('Please enter a rejection reason.');
    setActing(id);
    try {
      await rejectAdminFuelRequest(id, reason);
      await load();
    } catch (e) { alert(e.message); }
    finally { setActing(null); }
  };

  const filtered = filter === 'All' ? requests : requests.filter(r => r.status === filter);
  const counts = { Pending: 0, Approved: 0, Rejected: 0, Dispensed: 0 };
  requests.forEach(r => { if (counts[r.status] !== undefined) counts[r.status]++; });

  return (
    <div style={{ padding: '1.5rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 700, color: '#1e293b' }}>Fuel Request Approval</h1>
          <p style={{ margin: '4px 0 0', color: '#64748b', fontSize: 14 }}>Review and approve driver fuel requests before fuel station dispenses</p>
        </div>
        <button onClick={load} style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#6366f1', borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6 }}>
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Status tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['All', 'Pending', 'Approved', 'Rejected', 'Dispensed'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13,
              background: filter === s ? '#6366f1' : '#f1f5f9', color: filter === s ? '#fff' : '#374151' }}>
            {s} {s !== 'All' && `(${counts[s] ?? 0})`}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>Loading...</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#94a3b8', textAlign: 'center', padding: '2rem' }}>No {filter.toLowerCase()} fuel requests.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {filtered.map(req => (
            <div key={req._id} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                    <Fuel size={18} color="#6366f1" />
                    <span style={{ fontWeight: 700, color: '#1e293b' }}>{req.requestId || req._id.slice(-6).toUpperCase()}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, padding: '2px 10px', borderRadius: 20, background: `${STATUS_COLOR[req.status]}22`, color: STATUS_COLOR[req.status] }}>
                      {req.status}
                    </span>
                    <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 20, background: '#fef3c7', color: '#d97706' }}>{req.priority}</span>
                  </div>
                  <div style={{ fontSize: 13, color: '#374151' }}>
                    <strong>Driver:</strong> {req.driver?.name || '—'} &nbsp;|&nbsp;
                    <strong>Vehicle:</strong> {req.vehicle?.plateNumber || '—'} ({req.vehicle?.model || '—'}) &nbsp;|&nbsp;
                    <strong>Fuel:</strong> {req.fuelType} &nbsp;|&nbsp;
                    <strong>Amount:</strong> {req.requestedAmount} L
                  </div>
                  {req.destination && <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>Destination: {req.destination}</div>}
                  {req.purpose && <div style={{ fontSize: 12, color: '#64748b' }}>Purpose: {req.purpose}</div>}
                  {req.authorizationCode && (
                    <div style={{ fontSize: 12, color: '#22c55e', fontWeight: 600, marginTop: 4 }}>Auth Code: {req.authorizationCode}</div>
                  )}
                  {req.rejectionReason && (
                    <div style={{ fontSize: 12, color: '#ef4444', marginTop: 4 }}>Rejected: {req.rejectionReason}</div>
                  )}
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{new Date(req.createdAt).toLocaleString()}</div>
                </div>

                {req.status === 'Pending' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, minWidth: 220 }}>
                    <button onClick={() => handleApprove(req._id)} disabled={acting === req._id}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#22c55e', color: '#fff', border: 'none', borderRadius: 8, padding: '8px 14px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                      <CheckCircle size={14} /> {acting === req._id ? 'Approving...' : 'Approve & Send to Fuel Station'}
                    </button>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <input
                        placeholder="Rejection reason..."
                        value={rejectReason[req._id] || ''}
                        onChange={e => setRejectReason(p => ({ ...p, [req._id]: e.target.value }))}
                        style={{ flex: 1, padding: '6px 10px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 13 }}
                      />
                      <button onClick={() => handleReject(req._id)} disabled={acting === req._id}
                        style={{ display: 'flex', alignItems: 'center', gap: 4, background: '#ef4444', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, fontSize: 13 }}>
                        <XCircle size={14} /> Reject
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
