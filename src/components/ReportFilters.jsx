import { useState } from 'react';

const PERIODS = [
  { label: 'All Time',   value: 'all' },
  { label: 'Today',      value: 'daily' },
  { label: 'This Week',  value: 'weekly' },
  { label: 'This Month', value: 'monthly' },
  { label: 'Quarterly',  value: 'quarterly' },
  { label: '6 Months',   value: '6months' },
  { label: 'This Year',  value: 'annually' },
];

export function getDateRange(period) {
  const now = new Date();
  const start = new Date();
  switch (period) {
    case 'daily':     start.setHours(0,0,0,0); break;
    case 'weekly':    start.setDate(now.getDate() - now.getDay()); start.setHours(0,0,0,0); break;
    case 'monthly':   start.setDate(1); start.setHours(0,0,0,0); break;
    case 'quarterly': start.setMonth(Math.floor(now.getMonth()/3)*3, 1); start.setHours(0,0,0,0); break;
    case '6months':   start.setMonth(now.getMonth()-5, 1); start.setHours(0,0,0,0); break;
    case 'annually':  start.setMonth(0, 1); start.setHours(0,0,0,0); break;
    default: return null;
  }
  return { start, end: now };
}

export function filterByDate(items, period, dateField = 'createdAt') {
  const range = getDateRange(period);
  if (!range) return items;
  return items.filter(item => {
    const d = new Date(item[dateField] || item.date || item.requestDate);
    return d >= range.start && d <= range.end;
  });
}

const sel = {
  padding: '9px 14px', border: '1px solid #e2e8f0', borderRadius: 8,
  fontSize: 13, color: '#374151', background: '#fff', cursor: 'pointer',
  outline: 'none', transition: 'border-color 0.2s',
};

const ReportFilters = ({ period, onPeriod, department, onDepartment, departments = [] }) => (
  <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
    {/* Period buttons */}
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {PERIODS.map(p => (
        <button key={p.value} onClick={() => onPeriod(p.value)}
          style={{
            padding: '7px 14px', borderRadius: 8, fontSize: 13, fontWeight: 500,
            cursor: 'pointer', border: '1px solid',
            borderColor: period === p.value ? '#10b981' : '#e2e8f0',
            background: period === p.value ? '#10b981' : '#fff',
            color: period === p.value ? '#fff' : '#374151',
            transition: 'all 0.15s',
          }}>
          {p.label}
        </button>
      ))}
    </div>

    {/* Department/Unit filter */}
    {onDepartment && (
      <select value={department} onChange={e => onDepartment(e.target.value)} style={sel}>
        <option value="">All Units / Departments</option>
        {departments.map(d => <option key={d} value={d}>{d}</option>)}
      </select>
    )}
  </div>
);

export default ReportFilters;
