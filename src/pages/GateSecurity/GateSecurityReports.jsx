import { useState } from 'react';
import pdfGenerator from '../../utils/pdfGenerator';
import './GateSecurityReports.css';

// UNIVERSITY LOGO INTEGRATION:
// The PDF generator now automatically includes the Haramaya University logo
// in the top-right corner of all generated reports. To set the actual logo:
// pdfGenerator.setHaramayaLogo('data:image/png;base64,YOUR_BASE64_STRING');

const GateSecurityReports = () => {
    const [reportConfig, setReportConfig] = useState({
        reportType: 'daily',
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        recipient: 'Admin',
        includeVehicleMovements: true,
        includeSecurityIncidents: true,
        includeAuthorizations: true,
        includeInspections: true
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Mock data - replace with actual API calls
    const reportData = {
        daily: {
            totalVehicleEntries: 47,
            totalVehicleExits: 43,
            pendingVehicles: 4,
            authorizedTrips: 28,
            rejectedTrips: 3,
            securityIncidents: 1,
            inspectionsCompleted: 15,
            alprDetections: 52,
            unauthorizedAttempts: 2,
            averageProcessingTime: 3.2
        },
        weekly: {
            totalVehicleEntries: 312,
            totalVehicleExits: 298,
            pendingVehicles: 14,
            authorizedTrips: 189,
            rejectedTrips: 18,
            securityIncidents: 4,
            inspectionsCompleted: 98,
            alprDetections: 356,
            unauthorizedAttempts: 7,
            averageProcessingTime: 2.8
        },
        monthly: {
            totalVehicleEntries: 1247,
            totalVehicleExits: 1198,
            pendingVehicles: 49,
            authorizedTrips: 756,
            rejectedTrips: 67,
            securityIncidents: 12,
            inspectionsCompleted: 389,
            alprDetections: 1456,
            unauthorizedAttempts: 23,
            averageProcessingTime: 2.5
        }
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
            const data = reportData[reportConfig.reportType];

            const pdfData = {
                reportType: 'gate_security',
                period: reportConfig.reportType.charAt(0).toUpperCase() + reportConfig.reportType.slice(1),
                startDate: reportConfig.startDate,
                endDate: reportConfig.endDate,
                totalEntries: data.totalVehicleEntries,
                totalExits: data.totalVehicleExits,
                pendingVehicles: data.pendingVehicles,
                authorizedTrips: data.authorizedTrips,
                rejectedTrips: data.rejectedTrips,
                securityIncidents: data.securityIncidents,
                inspectionsCompleted: data.inspectionsCompleted,
                alprDetections: data.alprDetections,
                unauthorizedAttempts: data.unauthorizedAttempts,
                averageProcessingTime: data.averageProcessingTime,
                recipient: reportConfig.recipient,
                generatedBy: 'Gate Security Officer',
                date: new Date().toLocaleDateString(),
                includeVehicleMovements: reportConfig.includeVehicleMovements,
                includeSecurityIncidents: reportConfig.includeSecurityIncidents,
                includeAuthorizations: reportConfig.includeAuthorizations,
                includeInspections: reportConfig.includeInspections
            };

            // Simulate API call to send report
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Generate PDF report (you'll need to implement this in pdfGenerator)
            pdfGenerator.generateGateSecurityReport(pdfData, reportConfig.recipient);

            alert(`✅ Gate Security Report Generated Successfully!\n\n` +
                `Report Type: ${reportConfig.reportType.toUpperCase()}\n` +
                `Recipient: ${reportConfig.recipient}\n` +
                `Period: ${reportConfig.startDate} to ${reportConfig.endDate}\n\n` +
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
        return reportData[reportConfig.reportType];
    };

    return (
        <div className="gate-reports-page">
            <div className="gate-page-header">
                <h2 className="gate-roman-title">🚧 Generate Security Reports</h2>
                <p className="roman-emphasis">Create and send comprehensive gate security reports to administration</p>
                <div className="gate-roman-divider"></div>
            </div>

            <div className="reports-container">
                {/* Report Configuration Card */}
                <div className="report-config-card roman-card">
                    <div className="card-header">
                        <h3 className="roman-strong">📄 Report Configuration</h3>
                        <p>Configure your security report settings</p>
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
                                    <option value="daily">Daily Security Report</option>
                                    <option value="weekly">Weekly Security Report</option>
                                    <option value="monthly">Monthly Security Report</option>
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
                                    <option value="Security Department">Security Department</option>
                                    <option value="Transport Office">Transport Office</option>
                                    <option value="All Departments">All Departments</option>
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
                                        checked={reportConfig.includeVehicleMovements}
                                        onChange={(e) => handleInputChange('includeVehicleMovements', e.target.checked)}
                                    />
                                    <span>Vehicle Movement Logs</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeAuthorizations}
                                        onChange={(e) => handleInputChange('includeAuthorizations', e.target.checked)}
                                    />
                                    <span>Trip Authorizations</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeInspections}
                                        onChange={(e) => handleInputChange('includeInspections', e.target.checked)}
                                    />
                                    <span>Vehicle Inspections</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeSecurityIncidents}
                                        onChange={(e) => handleInputChange('includeSecurityIncidents', e.target.checked)}
                                    />
                                    <span>Security Incidents</span>
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
                                <h4>🚧 Gate Security Report</h4>
                                <p className="preview-period">{reportConfig.reportType.toUpperCase()} REPORT</p>
                                <p className="preview-date">
                                    Period: {reportConfig.startDate} to {reportConfig.endDate}
                                </p>
                            </div>

                            {reportConfig.includeVehicleMovements && (
                                <div className="preview-section">
                                    <h5>🚗 Vehicle Movement Statistics</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Vehicle Entries</span>
                                            <span className="stat-value">{getCurrentData().totalVehicleEntries}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Vehicle Exits</span>
                                            <span className="stat-value">{getCurrentData().totalVehicleExits}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Pending Vehicles</span>
                                            <span className="stat-value">{getCurrentData().pendingVehicles}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">ALPR Detections</span>
                                            <span className="stat-value">{getCurrentData().alprDetections}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeAuthorizations && (
                                <div className="preview-section">
                                    <h5>✅ Trip Authorization Summary</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Authorized Trips</span>
                                            <span className="stat-value">{getCurrentData().authorizedTrips}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Rejected Trips</span>
                                            <span className="stat-value">{getCurrentData().rejectedTrips}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Avg Processing Time</span>
                                            <span className="stat-value">{getCurrentData().averageProcessingTime} min</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeInspections && (
                                <div className="preview-section">
                                    <h5>🔧 Vehicle Inspection Summary</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Inspections Completed</span>
                                            <span className="stat-value">{getCurrentData().inspectionsCompleted}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeSecurityIncidents && (
                                <div className="preview-section">
                                    <h5>⚠️ Security Incidents</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Security Incidents</span>
                                            <span className="stat-value">{getCurrentData().securityIncidents}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Unauthorized Attempts</span>
                                            <span className="stat-value">{getCurrentData().unauthorizedAttempts}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="preview-footer">
                                <p><strong>Recipient:</strong> {reportConfig.recipient}</p>
                                <p><strong>Generated By:</strong> Gate Security Officer</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="quick-stats-grid">
                    <div className="quick-stat-card">
                        <div className="stat-icon">🚗</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().totalVehicleEntries}</div>
                            <div className="stat-label">Vehicle Entries</div>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="stat-icon">✅</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().authorizedTrips}</div>
                            <div className="stat-label">Authorized</div>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="stat-icon">🔧</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().inspectionsCompleted}</div>
                            <div className="stat-label">Inspections</div>
                        </div>
                    </div>

                    <div className="quick-stat-card">
                        <div className="stat-icon">⚠️</div>
                        <div className="stat-info">
                            <div className="stat-value">{getCurrentData().securityIncidents}</div>
                            <div className="stat-label">Incidents</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GateSecurityReports;