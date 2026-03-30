import { useState, useEffect } from 'react';
import { FileText, Download, FileSpreadsheet, Clock, Inbox, Send } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { getReceivedReports, submitReportRequest, getCurrentUser } from '../../api/api';
import './TransportReports.css';

const TransportReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [reqType, setReqType] = useState('vehicle_usage');
  const [reqPeriod, setReqPeriod] = useState('monthly');
  const [reqMessage, setReqMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);

  useEffect(() => {
    getReceivedReports()
      .then(data => setReports(data))
      .catch(err => console.error('Failed to load reports:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitMsg(null);
    try {
      await submitReportRequest({ reportType: reqType, period: reqPeriod, message: reqMessage });
      setSubmitMsg({ type: 'success', text: 'Report request submitted. Admin will generate and send it to you.' });
      setReqMessage('');
      setReqPeriod('monthly');
    } catch (err) {
      setSubmitMsg({ type: 'error', text: err.message || 'Failed to submit request.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDownloadPDF = (report) => {
    const doc = new jsPDF();
    const now = new Date().toLocaleString();

    doc.setFillColor(30, 64, 175);
    doc.rect(0, 0, 210, 28, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Haramaya University — VMS', 14, 12);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(report.reportName, 14, 22);

    doc.setTextColor(80, 80, 80);
    doc.setFontSize(9);
    doc.text(`Generated: ${now}`, 14, 36);
    doc.text(`Sent by: ${report.sentBy}`, 14, 42);

    if (report.columns?.length && report.data?.length) {
      doc.autoTable({
        head: [report.columns],
        body: report.data,
        startY: 50,
        theme: 'grid',
        headStyles: { fillColor: [30, 64, 175], textColor: 255, fontStyle: 'bold' },
        alternateRowStyles: { fillColor: [240, 245, 255] },
        styles: { fontSize: 8, cellPadding: 3 },
      });
    } else {
      doc.setFontSize(11);
      doc.setTextColor(120);
      doc.text('No data available in this report.', 14, 60);
    }

    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text('HU-VMS Confidential', 14, doc.internal.pageSize.height - 8);
    doc.save(`${report.reportName.replace(/\s+/g, '_')}.pdf`);
  };

  const handleDownloadExcel = (report) => {
    if (!report.data?.length || !report.columns?.length) {
      alert('No data to export.');
      return;
    }
    const rows = report.data.map(row => {
      const obj = {};
      report.columns.forEach((col, i) => { obj[col] = row[i] ?? ''; });
      return obj;
    });
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, report.reportName.slice(0, 31));
    XLSX.writeFile(wb, `${report.reportName.replace(/\s+/g, '_')}.xlsx`);
  };

  const selStyle = {
    padding: '9px 12px',
    borderRadius: '8px',
    background: 'rgba(255,255,255,0.07)',
    border: '1px solid rgba(255,255,255,0.15)',
    color: 'var(--text-primary)',
    fontSize: '13px',
  };

  const filtered = filter === 'all' ? reports
    : reports.filter(r => r.reportType === filter);

  return (
    <div className="transport-reports-page">
      <div className="dashboard-header">
        <div>
          <h1>Reports</h1>
          <p>Reports sent to you by the Admin</p>
        </div>
      </div>

      {/* ── Request a Report ── */}
      <div style={{
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(255,255,255,0.10)',
        borderRadius: '12px',
        padding: '20px 24px',
        marginBottom: '24px',
      }}>
        <h3 style={{ marginBottom: '16px', fontSize: '15px', color: 'var(--text-primary)' }}>
          📋 Request a Report from Admin
        </h3>
        <form onSubmit={handleRequestSubmit} style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

          {/* Report Type */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '180px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Report Type</label>
            <select value={reqType} onChange={e => setReqType(e.target.value)} style={selStyle}>
              <option value="vehicle_usage">Vehicle Usage Report</option>
              <option value="driver_activity">Driver Activity Report</option>
              <option value="trip_summary">Trip Summary Report</option>
              <option value="fuel_consumption">Fuel Consumption Report</option>
              <option value="request_analytics">Request Analytics Report</option>
              <option value="driver_performance">Driver Performance Report</option>
              <option value="maintenance">Maintenance Report</option>
            </select>
          </div>

          {/* Period */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '1', minWidth: '150px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Period</label>
            <select value={reqPeriod} onChange={e => setReqPeriod(e.target.value)} style={selStyle}>
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
              <option value="annually">Annually</option>
            </select>
          </div>

          {/* Message */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: '2', minWidth: '200px' }}>
            <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Note (optional)</label>
            <input
              type="text"
              value={reqMessage}
              onChange={e => setReqMessage(e.target.value)}
              placeholder="e.g. Need report for March 2025"
              style={selStyle}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            style={{
              padding: '9px 20px', borderRadius: '8px', border: 'none',
              background: 'var(--primary-color, #1e40af)', color: '#fff',
              fontWeight: 600, fontSize: '13px', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '6px',
              opacity: submitting ? 0.7 : 1, whiteSpace: 'nowrap',
            }}
          >
            <Send size={14} /> {submitting ? 'Sending...' : 'Submit Request'}
          </button>
        </form>

        {submitMsg && (
          <div style={{
            marginTop: '10px', padding: '8px 12px', borderRadius: '6px', fontSize: '13px',
            background: submitMsg.type === 'success' ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
            color: submitMsg.type === 'success' ? '#4ade80' : '#f87171',
            border: `1px solid ${submitMsg.type === 'success' ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)'}`,
          }}>
            {submitMsg.text}
          </div>
        )}
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        {['all', 'vehicle_usage', 'driver_activity'].map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            style={{
              padding: '7px 16px',
              borderRadius: '20px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 600,
              fontSize: '13px',
              background: filter === f ? 'var(--primary-color, #1e40af)' : 'rgba(255,255,255,0.08)',
              color: filter === f ? '#fff' : 'var(--text-secondary, #aaa)',
              transition: '0.2s',
            }}
          >
            {f === 'all' ? 'All' : f === 'vehicle_usage' ? 'Vehicle Usage' : 'Driver Activity'}
          </button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          Loading reports...
        </div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
          <Inbox size={48} style={{ marginBottom: '12px', opacity: 0.4 }} />
          <p>No reports received yet.</p>
          <p style={{ fontSize: '13px', marginTop: '6px', opacity: 0.6 }}>
            Reports sent by the Admin will appear here.
          </p>
        </div>
      ) : (
        <div className="reports-grid">
          {filtered.map(report => (
            <div key={report._id} className="report-card">
              <div className="rc-header">
                <div className="rc-icon">
                  <FileText size={24} />
                </div>
                <span className="rc-badge" style={{ background: 'rgba(30,64,175,0.12)', color: '#1e40af' }}>
                  {report.reportType === 'vehicle_usage' ? 'Vehicle Usage' : 'Driver Activity'}
                </span>
              </div>

              <div className="rc-body">
                <h3>{report.reportName}</h3>
                <p>Sent by {report.sentBy}</p>
              </div>

              <div className="rc-meta">
                <div className="rc-meta-item">
                  <Clock size={13} />
                  <span>{new Date(report.createdAt).toLocaleString()}</span>
                </div>
                <div className="rc-meta-item">
                  <span>{report.data?.length || 0} rows</span>
                </div>
              </div>

              <div className="rc-footer">
                <button
                  className="btn-text secondary"
                  onClick={() => handleDownloadPDF(report)}
                  title="Download PDF"
                >
                  <FileText size={14} /> PDF
                </button>
                <button
                  className="btn-text secondary"
                  onClick={() => handleDownloadExcel(report)}
                  title="Download Excel"
                >
                  <FileSpreadsheet size={14} /> Excel
                </button>
                <button
                  className="btn-icon primary-light"
                  onClick={() => handleDownloadPDF(report)}
                  title="Download"
                >
                  <Download size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransportReports;
