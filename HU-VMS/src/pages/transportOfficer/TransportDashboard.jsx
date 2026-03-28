import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList,
  AreaChart, Area,
} from 'recharts';
import {
  ClipboardList, MapPin, Users, AlertTriangle,
  FileCheck, CheckCircle, Clock, ArrowRight, RefreshCw, Activity,
} from 'lucide-react';
import { getRequests, getVehicles, getDrivers, getComplaints } from '../../api/api';
import './TransportDashboard.css';

const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, value }) => {
  if (percent < 0.06) return null;
  const R = Math.PI / 180;
  const r = innerRadius + (outerRadius - innerRadius) * 0.55;
  return (
    <text x={cx + r * Math.cos(-midAngle * R)} y={cy + r * Math.sin(-midAngle * R)}
      fill="#fff" textAnchor="middle" dominantBaseline="central" fontSize={12} fontWeight={700}>
      {value}
    </text>
  );
};

const DonutCenter = ({ cx, cy, total, label }) => (
  <>
    <text x={cx} y={cy - 8}  textAnchor="middle" fill="#1e293b" fontSize={26} fontWeight={700}>{total}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={11} fontWeight={500}>{label}</text>
  </>
);

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10,
      padding: '8px 14px', boxShadow: '0 4px 16px rgba(0,0,0,0.1)', fontSize: 13,
    }}>
      {payload.map((p, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: i < payload.length - 1 ? 4 : 0 }}>
          <span style={{ width: 10, height: 10, borderRadius: '50%', background: p.color || p.fill, display: 'inline-block' }} />
          <strong>{p.name}</strong>: {p.value}
        </div>
      ))}
    </div>
  );
};

// Build last-7-days complaint trend grouped by status
const buildComplaintTrend = (complaints) => {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push({
      label: d.toLocaleDateString('en-US', { weekday: 'short', month: 'numeric', day: 'numeric' }),
      date:  d.toISOString().slice(0, 10),
      Pending: 0, 'In Progress': 0, Resolved: 0,
    });
  }
  complaints.forEach(c => {
    const day  = c.createdAt?.slice(0, 10);
    const slot = days.find(d => d.date === day);
    if (slot && c.status in slot) slot[c.status]++;
  });
  return days;
};

export default function TransportDashboard() {
  const navigate = useNavigate();
  const [stats, setStats]                   = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [rawComplaints, setRawComplaints]   = useState([]);
  const [loading, setLoading]               = useState(true);
  const [lastRefresh, setLastRefresh]       = useState(new Date());

  const fetchData = async () => {
    try {
      const [requests, vehicles, drivers, complaints] = await Promise.all([
        getRequests().catch(() => []),
        getVehicles().catch(() => []),
        getDrivers().catch(() => []),
        getComplaints().catch(() => []),
      ]);

      const safeReqs  = Array.isArray(requests)   ? requests   : [];
      const safeVehs  = Array.isArray(vehicles)   ? vehicles   : [];
      const safeDrvs  = Array.isArray(drivers)    ? drivers    : [];
      const safeCmps  = Array.isArray(complaints) ? complaints : [];

      const pending    = safeReqs.filter(r => r.status === 'pending').length;
      const approved   = safeReqs.filter(r => r.status === 'approved').length;
      const inProgress = safeReqs.filter(r => r.status === 'in-progress').length;
      const completed  = safeReqs.filter(r => r.status === 'completed').length;
      const rejected   = safeReqs.filter(r => r.status === 'rejected').length;

      const vAvailable = safeVehs.filter(v => v.status === 'available').length;
      const vInUse     = safeVehs.filter(v => v.status === 'in-use').length;
      const vMaint     = safeVehs.filter(v => v.status === 'maintenance').length;

      const dAvailable = safeDrvs.filter(d => d.status === 'available').length;
      const dOnTrip    = safeDrvs.filter(d => d.status === 'on-trip').length;
      const dOff       = safeDrvs.filter(d => d.status === 'off-duty').length;

      const cPending    = safeCmps.filter(c => c.status === 'Pending').length;
      const cInProgress = safeCmps.filter(c => c.status === 'In Progress').length;
      const cResolved   = safeCmps.filter(c => c.status === 'Resolved').length;

      setRawComplaints(safeCmps);
      setStats({
        requests:   { pending, approved, inProgress, completed, rejected, total: requests.length },
        vehicles:   { available: vAvailable, inUse: vInUse, maintenance: vMaint, total: vehicles.length },
        drivers:    { available: dAvailable, onTrip: dOnTrip, offDuty: dOff, total: drivers.length },
        complaints: { pending: cPending, inProgress: cInProgress, resolved: cResolved, total: complaints.length },
        openComplaints: cPending + cInProgress,
        activeTrips: inProgress, pendingRequests: pending,
        availableVehicles: vAvailable, driversOnDuty: dAvailable + dOnTrip,
      });

      const activities = [];
      safeReqs.filter(r => r.status === 'pending').slice(0, 2).forEach(r => activities.push({
        id: `req-${r._id}`, icon: <FileCheck size={18} color="#f59e0b" />,
        title: `New request from ${r.requester} → ${r.destination}`, time: r.createdAt,
      }));
      safeReqs.filter(r => r.status === 'completed').slice(0, 2).forEach(r => activities.push({
        id: `done-${r._id}`, icon: <CheckCircle size={18} color="#22c55e" />,
        title: `Trip to ${r.destination} completed`, time: r.completedAt || r.updatedAt,
      }));
      safeReqs.filter(r => r.status === 'in-progress').slice(0, 1).forEach(r => activities.push({
        id: `trip-${r._id}`, icon: <Activity size={18} color="#3b82f6" />,
        title: `Active trip: ${r.assignedVehicle || 'Vehicle'} → ${r.destination}`, time: r.startedAt || r.updatedAt,
      }));
      safeCmps.filter(c => c.status !== 'Resolved').slice(0, 2).forEach(c => activities.push({
        id: `cmp-${c._id}`, icon: <AlertTriangle size={18} color="#ef4444" />,
        title: `Complaint: ${c.category} — ${c.description.slice(0, 45)}${c.description.length > 45 ? '…' : ''}`,
        time: c.createdAt,
      }));
      activities.sort((a, b) => new Date(b.time) - new Date(a.time));
      setRecentActivity(activities.slice(0, 5));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Dashboard fetch error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, []);

  const timeAgo = (d) => {
    if (!d) return '—';
    const s = Math.floor((Date.now() - new Date(d)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  if (loading) return (
    <div className="transport-dashboard">
      <div className="dashboard-header"><h1>Dashboard Overview</h1></div>
      <p style={{ color: '#94a3b8', padding: '1rem' }}>Loading dashboard...</p>
    </div>
  );

  if (!stats) return (
    <div className="transport-dashboard">
      <div className="dashboard-header"><h1>Dashboard Overview</h1></div>
      <p style={{ color: '#ef4444', padding: '1rem' }}>Failed to load dashboard data. Please check the server connection and try again.</p>
    </div>
  );

  const requestChartData = [
    { name: 'Pending',     value: stats.requests.pending,    fill: '#f59e0b' },
    { name: 'Approved',    value: stats.requests.approved,   fill: '#6366f1' },
    { name: 'In Progress', value: stats.requests.inProgress, fill: '#3b82f6' },
    { name: 'Completed',   value: stats.requests.completed,  fill: '#22c55e' },
    { name: 'Rejected',    value: stats.requests.rejected,   fill: '#ef4444' },
  ].filter(d => d.value > 0);

  const vehicleChartData = [
    { name: 'Available',   value: stats.vehicles.available,   fill: '#22c55e' },
    { name: 'In Use',      value: stats.vehicles.inUse,       fill: '#3b82f6' },
    { name: 'Maintenance', value: stats.vehicles.maintenance, fill: '#f59e0b' },
  ].filter(d => d.value > 0);

  const driverChartData = [
    { name: 'Available', value: stats.drivers.available, fill: '#22c55e' },
    { name: 'On Trip',   value: stats.drivers.onTrip,    fill: '#6366f1' },
    { name: 'Off Duty',  value: stats.drivers.offDuty,   fill: '#94a3b8' },
  ].filter(d => d.value > 0);

  const trendData = buildComplaintTrend(rawComplaints);

  const quickActions = [
    { label: 'Review Requests', icon: <ClipboardList size={22} />, sub: stats.pendingRequests > 0 ? `${stats.pendingRequests} pending` : 'No pending', color: '#f59e0b', bg: '#fef3c7', onClick: () => navigate('/transport/requests') },
    { label: 'Manage Trips',    icon: <Activity size={22} />,      sub: stats.activeTrips > 0 ? `${stats.activeTrips} in progress` : 'Start or finish trips', color: '#22c55e', bg: '#dcfce7', onClick: () => navigate('/transport/trips') },
    { label: 'Track Fleet',     icon: <MapPin size={22} />,        sub: `${stats.availableVehicles} available · ${stats.activeTrips} on road`, color: '#3b82f6', bg: '#dbeafe', onClick: () => navigate('/transport/tracking') },
    { label: 'Complaints',      icon: <AlertTriangle size={22} />, sub: stats.openComplaints > 0 ? `${stats.openComplaints} open` : 'All resolved', color: '#ef4444', bg: '#fee2e2', onClick: () => navigate('/transport/complaints') },
    { label: 'Driver Directory',icon: <Users size={22} />,         sub: `${stats.driversOnDuty} on duty`, color: '#8b5cf6', bg: '#ede9fe', onClick: () => navigate('/transport/drivers') },
  ];

  return (
    <div className="transport-dashboard">

      {/* Header */}
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1>Dashboard Overview</h1>
          <p>Transport Officer operational summary and metrics</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: '#94a3b8' }}>Updated {timeAgo(lastRefresh)}</span>
          <button className="dash-refresh-btn" onClick={() => { setLoading(true); fetchData(); }}>
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {/* ── Row 1: Requests — full width with donut + breakdown ── */}
      <div className="dash-chart-card dash-wide-row" onClick={() => navigate('/transport/requests')}>
        <div className="dash-wide-left">
          <div className="dash-chart-title" style={{ borderLeftColor: '#6366f1' }}>Requests</div>
          <ResponsiveContainer width={260} height={220}>
            <PieChart>
              <Pie data={requestChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                {requestChartData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                <DonutCenter cx={0} cy={0} total={stats.requests.total} label="Total" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-wide-right">
          {[
            { label: 'Pending',     value: stats.requests.pending,    color: '#f59e0b', bg: '#fef3c7' },
            { label: 'Approved',    value: stats.requests.approved,   color: '#6366f1', bg: '#ede9fe' },
            { label: 'In Progress', value: stats.requests.inProgress, color: '#3b82f6', bg: '#dbeafe' },
            { label: 'Completed',   value: stats.requests.completed,  color: '#22c55e', bg: '#dcfce7' },
            { label: 'Rejected',    value: stats.requests.rejected,   color: '#ef4444', bg: '#fee2e2' },
          ].map((s, i) => (
            <div key={i} className="dash-stat-row">
              <div className="dash-stat-dot" style={{ background: s.color }} />
              <span className="dash-stat-lbl">{s.label}</span>
              <div className="dash-stat-bar-track">
                <div className="dash-stat-bar-fill" style={{
                  width: `${Math.round((s.value / (stats.requests.total || 1)) * 100)}%`,
                  background: s.color,
                }} />
              </div>
              <span className="dash-stat-val" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Row 2: Drivers — full width with donut + breakdown ── */}
      <div className="dash-chart-card dash-wide-row" onClick={() => navigate('/transport/drivers')}>
        <div className="dash-wide-left">
          <div className="dash-chart-title" style={{ borderLeftColor: '#3b82f6' }}>Drivers</div>
          <ResponsiveContainer width={260} height={220}>
            <PieChart>
              <Pie data={driverChartData} cx="50%" cy="50%" innerRadius={65} outerRadius={95}
                paddingAngle={3} dataKey="value" labelLine={false} label={renderCustomLabel}>
                {driverChartData.map((e, i) => <Cell key={i} fill={e.fill} stroke="none" />)}
                <DonutCenter cx={0} cy={0} total={stats.drivers.total} label="Drivers" />
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="dash-wide-right">
          {[
            { label: 'Available', value: stats.drivers.available, color: '#22c55e', bg: '#dcfce7' },
            { label: 'On Trip',   value: stats.drivers.onTrip,    color: '#6366f1', bg: '#ede9fe' },
            { label: 'Off Duty',  value: stats.drivers.offDuty,   color: '#94a3b8', bg: '#f1f5f9' },
          ].map((s, i) => (
            <div key={i} className="dash-stat-row">
              <div className="dash-stat-dot" style={{ background: s.color }} />
              <span className="dash-stat-lbl">{s.label}</span>
              <div className="dash-stat-bar-track">
                <div className="dash-stat-bar-fill" style={{
                  width: `${Math.round((s.value / (stats.drivers.total || 1)) * 100)}%`,
                  background: s.color,
                }} />
              </div>
              <span className="dash-stat-val" style={{ color: s.color }}>{s.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Fleet Status bar chart ── */}
      <div className="dash-chart-card dash-fleet-card" onClick={() => navigate('/transport/tracking')}>
        <div className="dash-chart-title" style={{ borderLeftColor: '#22c55e' }}>
          Fleet Status
          <span className="dash-fleet-total">{stats.vehicles.total} Vehicles Total</span>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={vehicleChartData} margin={{ top: 20, right: 30, left: 0, bottom: 10 }} barCategoryGap="35%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize: 13, fill: '#374151', fontWeight: 600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="value" radius={[8, 8, 0, 0]} maxBarSize={90}>
              {vehicleChartData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              <LabelList dataKey="value" position="top" style={{ fontSize: 14, fontWeight: 700, fill: '#1e293b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="dash-fleet-legend">
          {vehicleChartData.map((d, i) => (
            <div key={i} className="dash-fleet-legend-item">
              <span className="dash-fleet-dot" style={{ background: d.fill }} />
              <span className="dash-fleet-lbl">{d.name}</span>
              <span className="dash-fleet-val" style={{ color: d.fill }}>{d.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Complaints Line Chart ── */}
      <div className="dash-chart-card dash-line-card" onClick={() => navigate('/transport/complaints')}>
        <div className="dash-line-header">
          <div>
            <div className="dash-chart-title" style={{ borderLeftColor: '#ef4444', marginBottom: 2 }}>
              Complaints Trend
            </div>
            <span style={{ fontSize: 12, color: '#94a3b8' }}>Last 7 days by status</span>
          </div>
          <div className="dash-line-totals">
            <span className="dash-line-badge" style={{ background: '#fef3c7', color: '#d97706' }}>
              {stats.complaints.pending} Pending
            </span>
            <span className="dash-line-badge" style={{ background: '#dbeafe', color: '#2563eb' }}>
              {stats.complaints.inProgress} In Progress
            </span>
            <span className="dash-line-badge" style={{ background: '#dcfce7', color: '#16a34a' }}>
              {stats.complaints.resolved} Resolved
            </span>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="gradPending" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradProgress" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradResolved" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={28} />
            <Tooltip content={<CustomTooltip />} />
            <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
            <Area type="monotone" dataKey="Pending"     stroke="#f59e0b" strokeWidth={2.5} fill="url(#gradPending)"  dot={{ r: 4, fill: '#f59e0b', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="In Progress" stroke="#3b82f6" strokeWidth={2.5} fill="url(#gradProgress)" dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }} activeDot={{ r: 6 }} />
            <Area type="monotone" dataKey="Resolved"    stroke="#22c55e" strokeWidth={2.5} fill="url(#gradResolved)" dot={{ r: 4, fill: '#22c55e', strokeWidth: 0 }} activeDot={{ r: 6 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-grid">
        {/* Activity Timeline */}
        <div className="dashboard-panel timeline-panel">
          <div className="panel-header">
            <h3>Recent Activity</h3>
            <button className="view-all-btn" onClick={() => navigate('/transport/requests')}>View All</button>
          </div>
          <div className="activity-timeline">
            {recentActivity.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: 13 }}>No recent activity.</p>
            ) : recentActivity.map((a, i) => (
              <div key={a.id} className="timeline-item">
                <div className="timeline-marker">
                  <div className="timeline-icon-bg">{a.icon}</div>
                  {i < recentActivity.length - 1 && <div className="timeline-connector" />}
                </div>
                <div className="timeline-content">
                  <p className="timeline-title">{a.title}</p>
                  <div className="timeline-meta"><Clock size={12} /><span>{timeAgo(a.time)}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="dashboard-panel actions-panel">
          <div className="panel-header"><h3>Quick Actions</h3></div>
          <div className="quick-actions-grid">
            {quickActions.map((qa, i) => (
              <button key={i} className="action-card" onClick={qa.onClick}
                style={{ borderColor: qa.color + '44', background: qa.bg }}>
                <div className="action-icon" style={{ background: qa.color + '22', color: qa.color }}>{qa.icon}</div>
                <div className="action-text">
                  <span className="title" style={{ color: '#1e293b' }}>{qa.label}</span>
                  <span className="subtitle">{qa.sub}</span>
                </div>
                <ArrowRight size={18} className="action-arrow" style={{ color: qa.color }} />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
