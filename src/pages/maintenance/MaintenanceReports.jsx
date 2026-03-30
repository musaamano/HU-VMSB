import { useState, useEffect } from "react";
import pdfGenerator from "../../utils/pdfGenerator";
import logoHelper from "../../utils/logoHelper"; // ensures logo is loaded before PDF generation
import "../fuelStationOfficer/FuelReports.css";
import "../fuelStationOfficer/fuelstation.css";

const BASE = "/api/maintenance";
const authReq = async (url, opts = {}) => {
  const token = localStorage.getItem("authToken");
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...opts.headers },
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : {};
  if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
  return data;
};

const SEV_STYLE = {
  Critical: { bg: "#fee2e2", color: "#dc2626" },
  Moderate: { bg: "#fef3c7", color: "#d97706" },
  Minor:    { bg: "#fef9c3", color: "#92400e" },
};

const MaintenanceReports = () => {
  const [config, setConfig] = useState({
    reportType: "daily",
    startDate: new Date().toISOString().split("T")[0],
    endDate:   new Date().toISOString().split("T")[0],
    recipient: "Both",
    includeSummary:       true,
    includeRepairDetails: true,
    includeCostBreakdown: true,
  });

  const [data, setData]           = useState(null);
  const [loading, setLoading]     = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [toast, setToast]         = useState("");

  const notify = (msg) => { setToast(msg); setTimeout(() => setToast(""), 4000); };

  const loadData = async () => {
    setLoading(true);
    try {
      const d = await authReq(`${BASE}/reports/data?from=${config.startDate}&to=${config.endDate}`).catch(() => null);
      setData(d);
    } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, [config.startDate, config.endDate]);

  const set = (k, v) => setConfig(p => ({ ...p, [k]: v }));

  const handleSend = async () => {
    setGenerating(true);
    try {
      const resolved = data?.resolved || [];
      const summary = {
        totalRepairs: resolved.length,
        resolved:     resolved.length,
        inRepair:     data?.inRepair || 0,
        reported:     data?.reported || 0,
        details: resolved.slice(0, 3).map(r => `${r.vehicle?.plateNumber || "?"} (${r.issueType})`).join(", "),
      };

      // 1. Generate and download the PDF
      pdfGenerator.generateMaintenanceReport({
        period:        config.reportType.charAt(0).toUpperCase() + config.reportType.slice(1),
        startDate:     config.startDate,
        endDate:       config.endDate,
        totalResolved: resolved.length,
        inRepair:      data?.inRepair || 0,
        pending:       data?.reported || 0,
        criticalCount: resolved.filter(r => r.severity === "Critical").length,
        resolved,
        generatedBy:   "Maintenance Officer",
      }, config.recipient);

      // 2. Send real DB notifications to Admin + Transport
      const res = await authReq(`${BASE}/reports/send`, {
        method: "POST",
        body: JSON.stringify({
          reportType: config.reportType.toUpperCase(),
          startDate:  config.startDate,
          endDate:    config.endDate,
          recipient:  config.recipient,
          summary,
        }),
      });

      notify(`✅ PDF downloaded & report sent to ${res.notified} recipient(s)!`);
      setShowPreview(false);
    } catch (err) {
      notify("❌ Error: " + err.message);
    } finally { setGenerating(false); }
  };

  const resolved = data?.resolved || [];
  const totalResolved  = resolved.length;
  const criticalCount  = resolved.filter(r => r.severity === "Critical").length;
  const inRepair       = data?.inRepair || 0;
  const pending        = data?.reported || 0;

  return (
    <div className="fuel-reports-page">
      {toast && (
        <div style={{ position: "fixed", top: 20, right: 20, background: toast.startsWith("✅") ? "#166534" : "#991b1b", color: "#fff", padding: "14px 22px", borderRadius: 12, zIndex: 9999, fontSize: 14, fontWeight: 600, boxShadow: "0 8px 24px rgba(0,0,0,0.2)" }}>
          {toast}
        </div>
      )}

      {/* Page header */}
      <div className="fuel-page-header">
        <h2 style={{ margin: "0 0 8px", fontSize: 28, fontWeight: 700, color: "#fff" }}>🔧 Maintenance Reports</h2>
        <p style={{ margin: 0, color: "rgba(255,255,255,0.9)", fontSize: 14 }}>Generate and send vehicle repair reports to Admin and Transport Office</p>
      </div>

      <div className="reports-container">

        {/* Config card */}
        <div className="report-config-card">
          <div className="card-header">
            <h3>📄 Report Configuration</h3>
            <p>Configure your maintenance report settings and recipients</p>
          </div>
          <div className="report-form">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label"><span className="label-icon">📊</span>Report Type</label>
                <select value={config.reportType} onChange={e => set("reportType", e.target.value)} className="form-select">
                  <option value="daily">Daily Report</option>
                  <option value="weekly">Weekly Report</option>
                  <option value="monthly">Monthly Report</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
              <div className="form-group">
                <label className="form-label"><span className="label-icon">📨</span>Send To</label>
                <select value={config.recipient} onChange={e => set("recipient", e.target.value)} className="form-select">
                  <option value="Admin">Administration Office</option>
                  <option value="Transport">Transport Office</option>
                  <option value="Both">Both Offices</option>
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label"><span className="label-icon">📅</span>Start Date</label>
                <input type="date" value={config.startDate} onChange={e => set("startDate", e.target.value)} className="form-input" />
              </div>
              <div className="form-group">
                <label className="form-label"><span className="label-icon">📅</span>End Date</label>
                <input type="date" value={config.endDate} onChange={e => set("endDate", e.target.value)} className="form-input" />
              </div>
            </div>
            <div className="form-group full-width">
              <label className="form-label"><span className="label-icon">📋</span>Include in Report</label>
              <div className="checkbox-group">
                <label className="checkbox-label"><input type="checkbox" checked={config.includeSummary} onChange={e => set("includeSummary", e.target.checked)} /><span>Summary Statistics</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={config.includeRepairDetails} onChange={e => set("includeRepairDetails", e.target.checked)} /><span>Repair Details</span></label>
                <label className="checkbox-label"><input type="checkbox" checked={config.includeCostBreakdown} onChange={e => set("includeCostBreakdown", e.target.checked)} /><span>Resolution Notes</span></label>
              </div>
            </div>
            <div className="form-actions">
              <button onClick={() => setShowPreview(v => !v)} className="btn-preview">
                <span>👁️</span> {showPreview ? "Hide Preview" : "Preview Report"}
              </button>
              <button onClick={handleSend} className="btn-generate" disabled={generating}>
                {generating ? <><span className="spinner">⏳</span> Generating...</> : <><span>📄</span> Generate PDF &amp; Send Report</>}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {showPreview && (
          <div className="report-preview-card">
            <div className="card-header">
              <h3>📊 Report Preview</h3>
              <button onClick={() => setShowPreview(false)} className="close-preview">×</button>
            </div>
            <div className="preview-content">
              <div className="preview-header">
                <h4>🔧 Maintenance Report — Haramaya University VMS</h4>
                <p className="preview-period">{config.reportType.toUpperCase()} REPORT</p>
                <p className="preview-date">Period: {config.startDate} to {config.endDate}</p>
              </div>

              {config.includeSummary && (
                <div className="preview-section">
                  <h5>📈 Summary Statistics</h5>
                  <div className="preview-stats">
                    <div className="preview-stat"><span className="stat-label">Total Resolved</span><span className="stat-value">{totalResolved}</span></div>
                    <div className="preview-stat"><span className="stat-label">Critical Repairs</span><span className="stat-value">{criticalCount}</span></div>
                    <div className="preview-stat"><span className="stat-label">Currently In Repair</span><span className="stat-value">{inRepair}</span></div>
                    <div className="preview-stat"><span className="stat-label">Pending Review</span><span className="stat-value">{pending}</span></div>
                  </div>
                </div>
              )}

              {config.includeRepairDetails && resolved.length > 0 && (
                <div className="preview-section">
                  <h5>🚗 Repaired Vehicles</h5>
                  <div style={{ overflowX: "auto" }}>
                    <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                      <thead>
                        <tr style={{ background: "linear-gradient(135deg,#4a90e2,#357abd)", color: "#fff" }}>
                          {["Vehicle", "Issue Type", "Severity", "Resolved By", "Date"].map(h => (
                            <th key={h} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 700 }}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {resolved.slice(0, 8).map((r, i) => (
                          <tr key={r._id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                            <td style={{ padding: "10px 14px", fontWeight: 700 }}>{r.vehicle?.plateNumber || "—"} <span style={{ fontWeight: 400, color: "#6b7280", fontSize: 11 }}>{r.vehicle?.model || ""}</span></td>
                            <td style={{ padding: "10px 14px" }}>{r.issueType}</td>
                            <td style={{ padding: "10px 14px" }}>
                              <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, ...(SEV_STYLE[r.severity] || {}) }}>{r.severity}</span>
                            </td>
                            <td style={{ padding: "10px 14px" }}>{r.resolvedBy?.name || "—"}</td>
                            <td style={{ padding: "10px 14px", color: "#6b7280" }}>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : "—"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {resolved.length > 8 && <p style={{ fontSize: 12, color: "#6b7280", padding: "8px 14px" }}>...and {resolved.length - 8} more records</p>}
                  </div>
                </div>
              )}

              {config.includeCostBreakdown && resolved.filter(r => r.resolutionNotes).length > 0 && (
                <div className="preview-section">
                  <h5>💰 Resolution Notes</h5>
                  <div className="preview-stats">
                    {resolved.filter(r => r.resolutionNotes).slice(0, 4).map(r => (
                      <div key={r._id} className="preview-stat" style={{ borderLeft: "5px solid #22c55e" }}>
                        <span className="stat-label">{r.vehicle?.plateNumber || "—"} — {r.issueType}</span>
                        <span style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{r.resolutionNotes?.slice(0, 80)}{r.resolutionNotes?.length > 80 ? "..." : ""}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="preview-footer">
                <p><strong>Recipient:</strong> {config.recipient === "Both" ? "Administration Office & Transport Office" : config.recipient + " Office"}</p>
                <p><strong>Generated By:</strong> Maintenance Officer</p>
                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick stats */}
        <div className="quick-stats-grid">
          {[
            { icon: "✅", value: loading ? "..." : totalResolved,  label: "Resolved in Period" },
            { icon: "🔧", value: loading ? "..." : inRepair,       label: "Currently In Repair" },
            { icon: "📋", value: loading ? "..." : pending,        label: "Pending Review" },
            { icon: "🚨", value: loading ? "..." : criticalCount,  label: "Critical Repairs" },
          ].map((s, i) => (
            <div key={i} className="quick-stat-card">
              <div className="stat-icon">{s.icon}</div>
              <div className="stat-info">
                <div className="stat-value">{s.value}</div>
                <div className="stat-label">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Full resolved table */}
        {!loading && resolved.length > 0 && (
          <div className="report-config-card" style={{ marginTop: 24 }}>
            <div className="card-header">
              <h3>✅ Resolved Repairs ({resolved.length})</h3>
              <p>All vehicles repaired in the selected period</p>
            </div>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "linear-gradient(135deg,#4a90e2,#357abd)", color: "#fff" }}>
                    {["Vehicle", "Issue Type", "Severity", "Reported By", "Resolved By", "Resolution Notes", "Date"].map(h => (
                      <th key={h} style={{ padding: "12px 16px", textAlign: "left", fontWeight: 700, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {resolved.map((r, i) => (
                    <tr key={r._id} style={{ background: i % 2 === 0 ? "#f9fafb" : "#fff", borderBottom: "1px solid #e5e7eb" }}>
                      <td style={{ padding: "12px 16px" }}><strong>{r.vehicle?.plateNumber || "—"}</strong><br /><span style={{ fontSize: 11, color: "#6b7280" }}>{r.vehicle?.model || ""}</span></td>
                      <td style={{ padding: "12px 16px" }}>{r.issueType}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700, ...(SEV_STYLE[r.severity] || {}) }}>{r.severity}</span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>{r.reportedBy?.name || "—"}</td>
                      <td style={{ padding: "12px 16px" }}>{r.resolvedBy?.name || "—"}</td>
                      <td style={{ padding: "12px 16px", maxWidth: 220, fontSize: 12, color: "#374151" }}>{r.resolutionNotes || "—"}</td>
                      <td style={{ padding: "12px 16px", color: "#6b7280", whiteSpace: "nowrap" }}>{r.resolvedAt ? new Date(r.resolvedAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {!loading && resolved.length === 0 && (
          <div style={{ textAlign: "center", padding: "3rem", color: "#94a3b8", background: "#fff", borderRadius: 16, marginTop: 24, border: "2px dashed #e2e8f0" }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📋</div>
            <p style={{ fontSize: 15, fontWeight: 600 }}>No resolved repairs in this period.</p>
            <p style={{ fontSize: 13 }}>Adjust the date range to see repair history.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default MaintenanceReports;
