import { useState, useEffect } from 'react';
import pdfGenerator from '../../utils/pdfGenerator';
import './FuelReports.css';
import './fuelstation.css';

const BASE = '/api';
const token = () => localStorage.getItem('authToken');
const req = async (url, opts = {}) => {
    const res = await fetch(url, { ...opts, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token()}`, ...opts.headers } });
    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    if (!res.ok) throw new Error(data.message || `HTTP ${res.status}`);
    return data;
};

// UNIVERSITY LOGO INTEGRATION:
// The PDF generator now automatically includes the Haramaya University logo
// in the top-right corner of all generated reports. To set the actual logo:
// pdfGenerator.setHaramayaLogo('data:image/png;base64,YOUR_BASE64_STRING');

const FuelReports = () => {
    const [reportConfig, setReportConfig] = useState({
        reportType: 'daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        recipient: 'Admin',
        includeTransactions: true,
        includeInventory: true,
        includeSummary: true
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadReportData();
    }, []);

    const loadReportData = async () => {
        setLoading(true);
        try {
            const data = await req(`${BASE}/fuel/reports`);
            setReportData(data);
        } catch (err) {
            console.error('Error loading report data:', err);
            setReportData({ byType: [], byVehicle: [] });
        } finally {
            setLoading(false);
        }
    };

    // Calculate totals from real data
    const getTotals = () => {
        if (!reportData) return { totalFuel: 0, diesel: 0, petrol: 0, transactions: 0 };

        const diesel = reportData.byType.find(t => t._id === 'Diesel') || { totalDispensed: 0, count: 0 };
        const petrol = reportData.byType.find(t => t._id === 'Petrol') || { totalDispensed: 0, count: 0 };

        return {
            totalFuel: diesel.totalDispensed + petrol.totalDispensed,
            diesel: diesel.totalDispensed,
            petrol: petrol.totalDispensed,
            transactions: diesel.count + petrol.count
        };
    };

    const handleInputChange = (field, value) => {
        setReportConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleGenerateReport = async () => {
        setIsGenerating(true);

        try {
            const totals = getTotals();

            const pdfData = {
                reportType: 'fuel_station',
                period: reportConfig.reportType.charAt(0).toUpperCase() + reportConfig.reportType.slice(1),
                startDate: reportConfig.startDate,
                endDate: reportConfig.endDate,
                totalFuel: totals.totalFuel.toFixed(1),
                dieselDispensed: totals.diesel.toFixed(1),
                petrolDispensed: totals.petrol.toFixed(1),
                totalTransactions: totals.transactions,
                completedTransactions: totals.transactions,
                pendingAuthorizations: 0, // This would need a separate API call
                dieselAvailable: 0, // This would need inventory API call
                petrolAvailable: 0, // This would need inventory API call
                recipient: reportConfig.recipient,
                generatedBy: 'Fuel Station Officer',
                date: new Date().toLocaleDateString(),
                includeTransactions: reportConfig.includeTransactions,
                includeInventory: reportConfig.includeInventory,
                includeSummary: reportConfig.includeSummary
            };

            // Generate PDF report
            pdfGenerator.generateFuelStationReport(pdfData, reportConfig.recipient);

            alert(`✅ Report Generated Successfully!\n\n` +
                `Report Type: ${reportConfig.reportType.toUpperCase()}\n` +
                `Recipient: ${reportConfig.recipient}\n` +
                `Period: ${reportConfig.startDate} to ${reportConfig.endDate}\n\n` +
                `Total Fuel Dispensed: ${totals.totalFuel.toFixed(1)}L\n` +
                `Diesel: ${totals.diesel.toFixed(1)}L\n` +
                `Petrol: ${totals.petrol.toFixed(1)}L\n` +
                `Total Transactions: ${totals.transactions}\n\n` +
                `The report has been generated and sent to ${reportConfig.recipient}.`);

            setIsGenerating(false);
            setShowPreview(false);
        } catch (error) {
            console.error('Error generating report:', error);
            alert('❌ Error generating report. Please try again.');
            setIsGenerating(false);
        }
    };

    const getCurrentData = () => {
        return getTotals();
    };

    return (
        <div className="fuel-reports-page">
            <div className="fuel-page-header">
                <h2 className="fuel-roman-title">⛽ Generate Reports</h2>
                <p className="roman-emphasis">Create and send fuel station reports to administration</p>
                <div className="fuel-roman-divider"></div>
            </div>

            <div className="reports-container">
                {/* Report Configuration Card */}
                <div className="report-config-card roman-card">
                    <div className="card-header">
                        <h3 className="roman-strong">📄 Report Configuration</h3>
                        <p>Configure your report settings</p>
                    </div>

                    <div className="report-form">
                        {/* Report Type */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📊</span>
                                    Report Type
                                </label>
                                <select
                                    value={reportConfig.reportType}
                                    onChange={(e) => handleInputChange('reportType', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="daily">Daily Report</option>
                                    <option value="weekly">Weekly Report</option>
                                    <option value="monthly">Monthly Report</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">👤</span>
                                    Send To
                                </label>
                                <select
                                    value={reportConfig.recipient}
                                    onChange={(e) => handleInputChange('recipient', e.target.value)}
                                    className="form-select"
                                >
                                    <option value="Admin">Administration Office</option>
                                    <option value="Transport Office">Transport Office</option>
                                    <option value="Both">Both Offices</option>
                                </select>
                            </div>
                        </div>

                        {/* Date Range */}
                        <div className="form-row">
                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📅</span>
                                    Start Date
                                </label>
                                <input
                                    type="date"
                                    value={reportConfig.startDate}
                                    onChange={(e) => handleInputChange('startDate', e.target.value)}
                                    className="form-input"
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">
                                    <span className="label-icon">📅</span>
                                    End Date
                                </label>
                                <input
                                    type="date"
                                    value={reportConfig.endDate}
                                    onChange={(e) => handleInputChange('endDate', e.target.value)}
                                    className="form-input"
                                />
                            </div>
                        </div>

                        {/* Report Sections */}
                        <div className="form-group full-width">
                            <label className="form-label">
                                <span className="label-icon">📋</span>
                                Include in Report
                            </label>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeSummary}
                                        onChange={(e) => handleInputChange('includeSummary', e.target.checked)}
                                    />
                                    <span>Summary Statistics</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeTransactions}
                                        onChange={(e) => handleInputChange('includeTransactions', e.target.checked)}
                                    />
                                    <span>Transaction Details</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeInventory}
                                        onChange={(e) => handleInputChange('includeInventory', e.target.checked)}
                                    />
                                    <span>Inventory Status</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="form-actions">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="btn-preview roman-button"
                            >
                                <span>👁️</span>
                                Preview Report
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="btn-generate roman-button"
                                disabled={isGenerating}
                            >
                                {isGenerating ? (
                                    <>
                                        <span className="spinner">⏳</span>
                                        Generating...
                                    </>
                                ) : (
                                    <>
                                        <span>📄</span>
                                        Generate & Send Report
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Report Preview Card */}
                {showPreview && (
                    <div className="report-preview-card">
                        <div className="card-header">
                            <h3>📊 Report Preview</h3>
                            <button onClick={() => setShowPreview(false)} className="close-preview">×</button>
                        </div>

                        <div className="preview-content">
                            <div className="preview-header">
                                <h4>Fuel Station Report</h4>
                                <p className="preview-period">{reportConfig.reportType.toUpperCase()} REPORT</p>
                                <p className="preview-date">
                                    Period: {reportConfig.startDate} to {reportConfig.endDate}
                                </p>
                            </div>

                            {reportConfig.includeSummary && (
                                <div className="preview-section">
                                    <h5>📈 Summary Statistics</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Fuel Dispensed</span>
                                            <span className="stat-value">{getCurrentData().totalFuel.toFixed(1)}L</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Diesel Dispensed</span>
                                            <span className="stat-value">{getCurrentData().diesel.toFixed(1)}L</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Petrol Dispensed</span>
                                            <span className="stat-value">{getCurrentData().petrol.toFixed(1)}L</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Transactions</span>
                                            <span className="stat-value">{getCurrentData().transactions}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeInventory && (
                                <div className="preview-section">
                                    <h5>📦 Current Inventory</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Diesel Available</span>
                                            <span className="stat-value">Loading...</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Petrol Available</span>
                                            <span className="stat-value">Loading...</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="preview-footer">
                                <p><strong>Recipient:</strong> {reportConfig.recipient}</p>
                                <p><strong>Generated By:</strong> Fuel Station Officer</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="quick-stats-grid">
                    <div className="quick-stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().totalFuelDispensed}L</div>
                            <div className="stat-label">Total Fuel</div>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().completedTransactions}</div>
                            <div className="stat-label">Completed</div>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().pendingAuthorizations}</div>
                            <div className="stat-label">Pending</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FuelReports;
