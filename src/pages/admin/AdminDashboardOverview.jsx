import { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  Cell, LabelList, ResponsiveContainer,
  PieChart, Pie, Sector,
} from 'recharts';
import { sankey, sankeyLinkHorizontal, sankeyLeft } from 'd3-sankey';
import { getVehicles, getDrivers, getRequests, getUsers } from '../../api/api';
import './adminTheme.css';
import './adminDashboardOverview.css';

// ── Colours ────────────────────────────────────────────────────────────────
const ROLE_COLORS   = ['#6366f1','#22c55e','#3b82f6','#f59e0b','#ec4899','#14b8a6'];
const DRIVER_COLORS = ['#22c55e','#3b82f6','#94a3b8'];
const REQ_COLORS    = ['#f59e0b','#6366f1','#22c55e','#ef4444'];

// ── Custom tooltip ─────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background:'#fff', border:'1px solid #e2e8f0', borderRadius:10,
      padding:'10px 16px', boxShadow:'0 4px 16px rgba(0,0,0,0.1)', fontSize:13,
    }}>
      <div style={{ fontWeight:700, color:'#1e293b', marginBottom:4 }}>{label}</div>
      {payload.map((p,i) => (
        <div key={i} style={{ display:'flex', alignItems:'center', gap:7 }}>
          <span style={{ width:10, height:10, borderRadius:'50%', background:p.fill, display:'inline-block' }} />
          <span style={{ color:'#374151' }}>{p.name}: <strong>{p.value}</strong></span>
        </div>
      ))}
    </div>
  );
};

// ── Donut label in centre ──────────────────────────────────────────────────
const CentreLabel = ({ cx, cy, total, label }) => (
  <>
    <text x={cx} y={cy - 8} textAnchor="middle" fill="#1e293b" fontSize={26} fontWeight={800}>{total}</text>
    <text x={cx} y={cy + 14} textAnchor="middle" fill="#94a3b8" fontSize={11}>{label}</text>
  </>
);

// ── Pie custom tooltip ─────────────────────────────────────────────────────
const PieTooltip = ({ active, payload, total }) => {
  if (!active || !payload?.length) return null;
  const { name, value, fill } = payload[0].payload;
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{
      background: '#fff',
      border: `2px solid ${fill}`,
      borderRadius: 10,
      padding: '10px 16px',
      boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
      fontSize: 13,
      minWidth: 140,
      pointerEvents: 'none',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
        <span style={{ width: 12, height: 12, borderRadius: '50%', background: fill, display: 'inline-block', flexShrink: 0 }} />
        <span style={{ fontWeight: 700, color: '#1e293b', fontSize: 14 }}>{name}</span>
      </div>
      <div style={{ color: fill, fontSize: 22, fontWeight: 800, lineHeight: 1 }}>{value}</div>
      <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 3 }}>{pct}% of total</div>
    </div>
  );
};

// ── Active slice shape (grows on hover) ────────────────────────────────────
const renderActiveShape = (props) => {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;
  return (
    <Sector
      cx={cx} cy={cy}
      innerRadius={innerRadius - 3}
      outerRadius={outerRadius + 10}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      opacity={1}
    />
  );
};

// ── Compact custom legend ──────────────────────────────────────────────────
const PieLegend = ({ data }) => (
  <div className="adm-pie-legend">
    {data.map((d, i) => (
      <div key={i} className="adm-pie-legend-item">
        <span className="adm-pie-dot" style={{ background: d.fill }} />
        <span className="adm-pie-lbl">{d.name}</span>
        <span className="adm-pie-val" style={{ color: d.fill }}>{d.value}</span>
      </div>
    ))}
  </div>
);

// ── Sankey Diagram ─────────────────────────────────────────────────────────
const SankeyChart = ({ stats }) => {
  const W = 680, H = 320;
  const COLORS = {
    Users:     '#6366f1',
    Drivers:   '#22c55e',
    Vehicles:  '#3b82f6',
    Requests:  '#f59e0b',
    Pending:   '#f59e0b',
    Approved:  '#6366f1',
    Completed: '#22c55e',
    Rejected:  '#ef4444',
    Available: '#22c55e',
    'On Trip': '#3b82f6',
    'Off Duty':'#94a3b8',
  };

  const nodes = [
    { name: 'Users' },
    { name: 'Drivers' },
    { name: 'Vehicles' },
    { name: 'Requests' },
    { name: 'Pending' },
    { name: 'Approved' },
    { name: 'Completed' },
    { name: 'Rejected' },
  ];

  const links = [
    { source: 0, target: 3, value: Math.max(stats.totalRequests, 1) },
    { source: 1, target: 3, value: Math.max(stats.activeDrivers, 1) },
    { source: 2, target: 3, value: Math.max(stats.available, 1) },
    { source: 3, target: 4, value: Math.max(stats.pending,   1) },
    { source: 3, target: 5, value: Math.max(stats.approved,  1) },
    { source: 3, target: 6, value: Math.max(stats.completed, 1) },
    { source: 3, target: 7, value: Math.max(stats.rejected,  1) },
  ];

  const { nodes: sNodes, links: sLinks } = sankey()
    .nodeWidth(18)
    .nodePadding(22)
    .nodeAlign(sankeyLeft)
    .extent([[20, 20], [W - 20, H - 20]])
    ({ nodes: nodes.map(n => ({ ...n })), links: links.map(l => ({ ...l })) });

  const [hovered, setHovered] = useState(null);

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} style={{ overflow: 'visible' }}>
      <defs>
        {sLinks.map((l, i) => {
          const id = `sg${i}`;
          const sc = COLORS[l.source.name] || '#94a3b8';
          const tc = COLORS[l.target.name] || '#94a3b8';
          return (
            <linearGradient key={id} id={id} x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor={sc} stopOpacity="0.5" />
              <stop offset="100%" stopColor={tc} stopOpacity="0.5" />
            </linearGradient>
          );
        })}
      </defs>

      {/* Links */}
      {sLinks.map((l, i) => {
        const path = sankeyLinkHorizontal()(l);
        const isHov = hovered === i;
        return (
          <g key={i}>
            <path
              d={path}
              fill="none"
              stroke={`url(#sg${i})`}
              strokeWidth={Math.max(l.width, 2)}
              opacity={hovered === null ? 0.55 : isHov ? 0.9 : 0.2}
              style={{ cursor: 'pointer', transition: 'opacity 0.2s' }}
              onMouseEnter={() => setHovered(i)}
              onMouseLeave={() => setHovered(null)}
            />
            {isHov && (
              <text
                x={(l.source.x1 + l.target.x0) / 2}
                y={l.y0 - 8}
                textAnchor="middle"
                fontSize={12}
                fontWeight={700}
                fill="#1e293b"
              >
                {l.source.name} → {l.target.name}: {l.value}
              </text>
            )}
          </g>
        );
      })}

      {/* Nodes */}
      {sNodes.map((n, i) => {
        const c = COLORS[n.name] || '#94a3b8';
        const labelLeft = n.x0 > W / 2;
        return (
          <g key={i}>
            <rect
              x={n.x0} y={n.y0}
              width={n.x1 - n.x0}
              height={Math.max(n.y1 - n.y0, 4)}
              fill={c}
              rx={4}
              opacity={0.9}
            />
            <text
              x={labelLeft ? n.x0 - 8 : n.x1 + 8}
              y={(n.y0 + n.y1) / 2}
              dy="0.35em"
              textAnchor={labelLeft ? 'end' : 'start'}
              fontSize={12}
              fontWeight={600}
              fill="#374151"
            >
              {n.name}
            </text>
            <text
              x={labelLeft ? n.x0 - 8 : n.x1 + 8}
              y={(n.y0 + n.y1) / 2 + 14}
              dy="0.35em"
              textAnchor={labelLeft ? 'end' : 'start'}
              fontSize={11}
              fill={c}
              fontWeight={700}
            >
              {n.value}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

export default function AdminDashboardOverview() {
  const [stats, setStats]       = useState(null);
  const [loading, setLoading]   = useState(true);
  const [activeRole, setActiveRole]     = useState(null);
  const [activeDriver, setActiveDriver] = useState(null);
  const [activeReq, setActiveReq]       = useState(null);

  useEffect(() => {
    Promise.all([getVehicles(), getDrivers(), getRequests(), getUsers()])
      .then(([vehicles, drivers, requests, users]) => {
        // vehicle
        const available   = vehicles.filter(v => v.status === 'available').length;
        const inUse       = vehicles.filter(v => v.status === 'in-use').length;
        const maintenance = vehicles.filter(v => v.status === 'maintenance').length;

        // driver status
        const drvAvailable = drivers.filter(d => d.status === 'available').length;
        const drvOnTrip    = drivers.filter(d => d.status === 'on-trip').length;
        const drvOffDuty   = drivers.filter(d => d.status === 'off-duty').length;
        const activeDrivers = drvAvailable + drvOnTrip;

        // requests
        const pending   = requests.filter(r => r.status === 'pending').length;
        const approved  = requests.filter(r => ['approved','in-progress'].includes(r.status)).length;
        const completed = requests.filter(r => r.status === 'completed').length;
        const rejected  = requests.filter(r => r.status === 'rejected').length;

        // users by role
        const roleCounts = {};
        users.forEach(u => {
          const r = u.role || 'Unknown';
          roleCounts[r] = (roleCounts[r] || 0) + 1;
        });

        setStats({
          totalVehicles: vehicles.length, available, inUse, maintenance,
          totalUsers: users.length, totalDrivers: drivers.length,
          drvAvailable, drvOnTrip, drvOffDuty, activeDrivers,
          totalRequests: requests.length, pending, approved, completed, rejected,
          roleCounts,
        });
      })
      .catch(err => console.error('Admin dashboard error:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="admin-overview-container">
      <h1 className="overview-title">Dashboard Overview</h1>
      <p style={{ color:'#94a3b8', textAlign:'center' }}>Loading...</p>
    </div>
  );

  // ── Pie data ───────────────────────────────────────────────────────────────
  const userRolePie = Object.entries(stats.roleCounts).map(([name, value], i) => ({
    name, value, fill: ROLE_COLORS[i % ROLE_COLORS.length],
  }));

  const driverStatusPie = [
    { name: 'Available', value: stats.drvAvailable, fill: DRIVER_COLORS[0] },
    { name: 'On Trip',   value: stats.drvOnTrip,    fill: DRIVER_COLORS[1] },
    { name: 'Off Duty',  value: stats.drvOffDuty,   fill: DRIVER_COLORS[2] },
  ].filter(d => d.value > 0);

  const requestStatusPie = [
    { name: 'Pending',   value: stats.pending,   fill: REQ_COLORS[0] },
    { name: 'Approved',  value: stats.approved,  fill: REQ_COLORS[1] },
    { name: 'Completed', value: stats.completed, fill: REQ_COLORS[2] },
    { name: 'Rejected',  value: stats.rejected,  fill: REQ_COLORS[3] },
  ].filter(d => d.value > 0);

  // ── Bar chart data ─────────────────────────────────────────────────────────
  const vehicleBarData = [
    { name:'Total',       value: stats.totalVehicles, fill:'#6366f1' },
    { name:'Available',   value: stats.available,     fill:'#22c55e' },
    { name:'Assigned',    value: stats.inUse,         fill:'#3b82f6' },
    { name:'Maintenance', value: stats.maintenance,   fill:'#f59e0b' },
  ];

  const requestBarData = [
    { name:'Pending',   value: stats.pending,   fill:'#f59e0b' },
    { name:'Approved',  value: stats.approved,  fill:'#6366f1' },
    { name:'Completed', value: stats.completed, fill:'#22c55e' },
    { name:'Rejected',  value: stats.rejected,  fill:'#ef4444' },
  ];

  return (
    <div className="admin-overview-container">
      <h1 className="overview-title">Dashboard Overview</h1>

      {/* ── 3-column Pie Charts row ── */}
      <div className="adm-pie-row">

        {/* Users by Role */}
        <div className="adm-chart-card adm-pie-card">
          <h2 className="adm-chart-title">Users by Role</h2>
          <p className="adm-chart-sub">{stats.totalUsers} total accounts</p>
          <PieChart width={180} height={180}>
            <Pie data={userRolePie} cx={85} cy={85} innerRadius={52} outerRadius={80}
              dataKey="value" paddingAngle={3} stroke="none"
              activeIndex={activeRole}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveRole(i)}
              onMouseLeave={() => setActiveRole(null)}>
              {userRolePie.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <CentreLabel cx={85} cy={85} total={stats.totalUsers} label="Users" />
            <Tooltip content={<PieTooltip total={stats.totalUsers} />} />
          </PieChart>
          <PieLegend data={userRolePie} />
        </div>

        {/* Drivers by Status */}
        <div className="adm-chart-card adm-pie-card">
          <h2 className="adm-chart-title">Drivers by Status</h2>
          <p className="adm-chart-sub">{stats.totalDrivers} total drivers</p>
          <PieChart width={180} height={180}>
            <Pie data={driverStatusPie} cx={85} cy={85} innerRadius={52} outerRadius={80}
              dataKey="value" paddingAngle={3} stroke="none"
              activeIndex={activeDriver}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveDriver(i)}
              onMouseLeave={() => setActiveDriver(null)}>
              {driverStatusPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <CentreLabel cx={85} cy={85} total={stats.totalDrivers} label="Drivers" />
            <Tooltip content={<PieTooltip total={stats.totalDrivers} />} />
          </PieChart>
          <PieLegend data={driverStatusPie} />
        </div>

        {/* Requests by Status */}
        <div className="adm-chart-card adm-pie-card">
          <h2 className="adm-chart-title">Requests by Status</h2>
          <p className="adm-chart-sub">{stats.totalRequests} total requests</p>
          <PieChart width={180} height={180}>
            <Pie data={requestStatusPie} cx={85} cy={85} innerRadius={52} outerRadius={80}
              dataKey="value" paddingAngle={3} stroke="none"
              activeIndex={activeReq}
              activeShape={renderActiveShape}
              onMouseEnter={(_, i) => setActiveReq(i)}
              onMouseLeave={() => setActiveReq(null)}>
              {requestStatusPie.map((e, i) => <Cell key={i} fill={e.fill} />)}
            </Pie>
            <CentreLabel cx={85} cy={85} total={stats.totalRequests} label="Requests" />
            <Tooltip content={<PieTooltip total={stats.totalRequests} />} />
          </PieChart>
          <PieLegend data={requestStatusPie} />
        </div>

      </div>

      {/* ── Vehicle Status Bar Chart ── */}
      <div className="adm-chart-card adm-chart-full">
        <div className="adm-chart-header">
          <div>
            <h2 className="adm-chart-title">Vehicle Status Overview</h2>
            <p className="adm-chart-sub">Total · Available · Assigned · Maintenance</p>
          </div>
          <div className="adm-vehicle-badges">
            {vehicleBarData.map((d, i) => (
              <span key={i} className="adm-badge" style={{ background: d.fill+'18', color: d.fill, border:`1px solid ${d.fill}44` }}>
                {d.name}: {d.value}
              </span>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={vehicleBarData} margin={{ top:20, right:30, left:0, bottom:10 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize:13, fill:'#374151', fontWeight:600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="value" name="Vehicles" radius={[10,10,0,0]} maxBarSize={100}>
              {vehicleBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              <LabelList dataKey="value" position="top" style={{ fontSize:15, fontWeight:800, fill:'#1e293b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="adm-legend-row">
          {vehicleBarData.map((d, i) => (
            <div key={i} className="adm-legend-item">
              <span className="adm-legend-dot" style={{ background: d.fill }} />
              <span className="adm-legend-lbl">{d.name}</span>
              <span className="adm-legend-val" style={{ color: d.fill }}>{d.value}</span>
              <span className="adm-legend-pct" style={{ color:'#94a3b8' }}>
                ({Math.round((d.value / (stats.totalVehicles || 1)) * 100)}%)
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Request Status Bar Chart ── */}
      <div className="adm-chart-card adm-chart-full">
        <div className="adm-chart-header">
          <div>
            <h2 className="adm-chart-title">Request Status Overview</h2>
            <p className="adm-chart-sub">Pending · Approved · Completed · Rejected</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={requestBarData} margin={{ top:20, right:30, left:0, bottom:10 }} barCategoryGap="30%">
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis dataKey="name" tick={{ fontSize:13, fill:'#374151', fontWeight:600 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize:12, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} width={32} />
            <Tooltip content={<CustomTooltip />} cursor={{ fill:'rgba(99,102,241,0.06)' }} />
            <Bar dataKey="value" name="Requests" radius={[10,10,0,0]} maxBarSize={100}>
              {requestBarData.map((e, i) => <Cell key={i} fill={e.fill} />)}
              <LabelList dataKey="value" position="top" style={{ fontSize:15, fontWeight:800, fill:'#1e293b' }} />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* ── Sankey Flow Diagram ── */}
      <div className="adm-chart-card adm-chart-full">
        <div className="adm-chart-header">
          <div>
            <h2 className="adm-chart-title">System Flow Overview</h2>
            <p className="adm-chart-sub">Users · Drivers · Vehicles → Requests → Outcomes</p>
          </div>
        </div>
        <div style={{ padding: '8px 0 16px' }}>
          <SankeyChart stats={stats} />
        </div>
      </div>
    </div>
  );
}
