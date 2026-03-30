import { useState } from 'react';
import pdfGenerator from '../../../utils/pdfGenerator';
import './DriverReports.css';

// UNIVERSITY LOGO INTEGRATION:
// The PDF generator now automatically includes the Haramaya University logo
// in the top-right corner of all generated reports. To set the actual logo:
// pdfGenerator.setHaramayaLogo('data:image/png;base64,YOUR_BASE64_STRING');

const DriverReports = () => {
    const [reportConfig, setReportConfig] = useState({
        reportType: 'performance', // 'performance', 'fuel'
        performanceType: 'daily', // for performance reports
        fuelType: 'refill', // 'refill' or 'consumption' for fuel reports
        startDate: new Date().toISOString().split('T')[0],
        endDate: new Date().toISOString().split('T')[0],
        recipient: 'Admin',
        includeTripSummary: true,
        includeFuelUsage: true,
        includeVehicleStatus: true,
        includePerformance: true,
        // Fuel report specific fields
        fuelAmount: '',
        fuelCost: '',
        odometer: '',
        station: '',
        notes: ''
    });

    const [isGenerating, setIsGenerating] = useState(false);
    const [showPreview, setShowPreview] = useState(false);

    // Mock data - replace with actual API calls
    const reportData = {
        daily: {
            totalTrips: 8,
            completedTrips: 7,
            cancelledTrips: 1,
            totalDistance: 245.6,
            totalFuelUsed: 28.4,
            averageFuelEfficiency: 8.6,
            onTimePerformance: 87.5,
            vehicleInspections: 2,
            maintenanceIssues: 0,
            workingHours: 8.5,
            overtimeHours: 0.5
        },
        weekly: {
            totalTrips: 42,
            completedTrips: 38,
            cancelledTrips: 4,
            totalDistance: 1287.3,
            totalFuelUsed: 149.8,
            averageFuelEfficiency: 8.6,
            onTimePerformance: 90.5,
            vehicleInspections: 7,
            maintenanceIssues: 1,
            workingHours: 42.5,
            overtimeHours: 2.5
        },
        monthly: {
            totalTrips: 186,
            completedTrips: 172,
            cancelledTrips: 14,
            totalDistance: 5642.8,
            totalFuelUsed: 656.2,
            averageFuelEfficiency: 8.6,
            onTimePerformance: 92.5,
            vehicleInspections: 28,
            maintenanceIssues: 3,
            workingHours: 184.0,
            overtimeHours: 8.0
        }
    };

    const handleInputChange = (field, value) => {
        setReportConfig(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const generateReportWithConfig = async (config) => {
        setIsGenerating(true);

        try {
            if (config.reportType === 'fuel') {
                // Generate fuel report
                const fuelReportData = {
                    reportType: config.fuelType,
                    date: config.startDate,
                    amount: config.fuelAmount,
                    cost: config.fuelCost,
                    odometer: config.odometer,
                    station: config.station,
                    notes: config.notes,
                    driverName: 'Ahmed Hassan', // Replace with actual driver name from context
                    vehicleId: 'VEH-001', // Replace with actual vehicle ID
                    licensePlate: 'ABC-1234' // Replace with actual license plate
                };

                // Simulate API call to send report
                await new Promise(resolve => setTimeout(resolve, 1500));

                const result = pdfGenerator.generateFuelReport(fuelReportData, config.recipient);

                alert(`✅ Fuel Report Generated Successfully!\n\n` +
                    `Report Type: ${config.fuelType.toUpperCase()}\n` +
                    `Recipient: ${config.recipient}\n` +
                    `Amount: ${config.fuelAmount}L\n\n` +
                    `The report has been generated and sent to ${config.recipient}.`);
            } else {
                // Generate performance report
                const data = reportData[config.performanceType];

                const pdfData = {
                    reportType: 'driver',
                    period: config.performanceType.charAt(0).toUpperCase() + config.performanceType.slice(1),
                    startDate: config.startDate,
                    endDate: config.endDate,
                    totalTrips: data.totalTrips,
                    completedTrips: data.completedTrips,
                    cancelledTrips: data.cancelledTrips,
                    totalDistance: data.totalDistance.toFixed(1),
                    totalFuelUsed: data.totalFuelUsed.toFixed(1),
                    averageFuelEfficiency: data.averageFuelEfficiency.toFixed(1),
                    onTimePerformance: data.onTimePerformance.toFixed(1),
                    vehicleInspections: data.vehicleInspections,
                    maintenanceIssues: data.maintenanceIssues,
                    workingHours: data.workingHours.toFixed(1),
                    overtimeHours: data.overtimeHours.toFixed(1),
                    recipient: config.recipient,
                    generatedBy: 'Driver',
                    date: new Date().toLocaleDateString(),
                    includeTripSummary: config.includeTripSummary,
                    includeFuelUsage: config.includeFuelUsage,
                    includeVehicleStatus: config.includeVehicleStatus,
                    includePerformance: config.includePerformance
                };

                // Simulate API call to send report
                await new Promise(resolve => setTimeout(resolve, 1500));

                // Test if pdfGenerator and its method exist
                if (!pdfGenerator) {
                    throw new Error('pdfGenerator is not available');
                }

                if (typeof pdfGenerator.generateDriverReport !== 'function') {
                    throw new Error('generateDriverReport method is not available');
                }

                const result = pdfGenerator.generateDriverReport(pdfData, config.recipient);

                alert(`✅ Performance Report Generated Successfully!\n\n` +
                    `Report Type: ${config.performanceType.toUpperCase()}\n` +
                    `Recipient: ${config.recipient}\n` +
                    `Period: ${config.startDate} to ${config.endDate}\n\n` +
                    `The report has been generated and sent to ${config.recipient}.`);
            }

            setIsGenerating(false);
            setShowPreview(false);
        } catch (error) {
            console.error('Error generating report:', error);
            alert(`❌ Error generating report: ${error.message || 'Unknown error'}\n\nPlease try again or contact support if the issue persists.`);
            setIsGenerating(false);
        }
    };

    const handleGenerateReport = async () => {
        await generateReportWithConfig(reportConfig);
    };

    const getCurrentData = () => {
        if (reportConfig.reportType === 'fuel') {
            return {
                fuelAmount: reportConfig.fuelAmount || '0',
                fuelCost: reportConfig.fuelCost || '0',
                odometer: reportConfig.odometer || '0',
                station: reportConfig.station || 'N/A'
            };
        }
        return reportData[reportConfig.performanceType];
    };

    return (
        <div className="driver-reports-page">
            <div className="driver-page-header">
                <h2>� Comprehensive Driver Reports</h2>
                <p>Generate performance reports and fuel reports with professional PDF output</p>
            </div>

            <div className="reports-container">
                {/* Report Configuration Card */}
                <div className="report-config-card">
                    <div className="card-header">
                        <h3>📄 Report Configuration</h3>
                        <p>Configure your driver report settings</p>
                    </div>

                    <div className="report-form">
                        {/* Main Report Type Selection */}
                        <div className="form-row">
                            <div className="form-group full-width">
                                <label className="form-label">
                                    <span className="label-icon">📊</span>
                                    Report Category
                                </label>
                                <div className="report-type-tabs">
                                    <button
                                        type="button"
                                        className={`tab-button ${reportConfig.reportType === 'performance' ? 'active' : ''}`}
                                        onClick={() => handleInputChange('reportType', 'performance')}
                                    >
                                        <span className="tab-icon">📈</span>
                                        Performance Reports
                                    </button>
                                    <button
                                        type="button"
                                        className={`tab-button ${reportConfig.reportType === 'fuel' ? 'active' : ''}`}
                                        onClick={() => handleInputChange('reportType', 'fuel')}
                                    >
                                        <span className="tab-icon">⛽</span>
                                        Fuel Reports
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Performance Report Configuration */}
                        {reportConfig.reportType === 'performance' && (
                            <>
                                {/* Report Type */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">📊</span>
                                            Performance Report Type
                                        </label>
                                        <select
                                            value={reportConfig.performanceType}
                                            onChange={(e) => handleInputChange('performanceType', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="daily">Daily Performance Report</option>
                                            <option value="weekly">Weekly Performance Report</option>
                                            <option value="monthly">Monthly Performance Report</option>
                                        </select>
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">�</span>
                                            Send To
                                        </label>
                                        <select
                                            value={reportConfig.recipient}
                                            onChange={(e) => handleInputChange('recipient', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="Admin">Administration Office</option>
                                            <option value="Transport Office">Transport Office</option>
                                            <option value="HR Department">HR Department</option>
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
                                                checked={reportConfig.includeTripSummary}
                                                onChange={(e) => handleInputChange('includeTripSummary', e.target.checked)}
                                            />
                                            <span>Trip Summary & Statistics</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={reportConfig.includeFuelUsage}
                                                onChange={(e) => handleInputChange('includeFuelUsage', e.target.checked)}
                                            />
                                            <span>Fuel Usage & Efficiency</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={reportConfig.includeVehicleStatus}
                                                onChange={(e) => handleInputChange('includeVehicleStatus', e.target.checked)}
                                            />
                                            <span>Vehicle Status & Maintenance</span>
                                        </label>
                                        <label className="checkbox-label">
                                            <input
                                                type="checkbox"
                                                checked={reportConfig.includePerformance}
                                                onChange={(e) => handleInputChange('includePerformance', e.target.checked)}
                                            />
                                            <span>Performance Metrics</span>
                                        </label>
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Fuel Report Configuration */}
                        {reportConfig.reportType === 'fuel' && (
                            <>
                                {/* Fuel Report Type */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">⛽</span>
                                            Fuel Report Type
                                        </label>
                                        <select
                                            value={reportConfig.fuelType}
                                            onChange={(e) => handleInputChange('fuelType', e.target.value)}
                                            className="form-select"
                                        >
                                            <option value="refill">Fuel Refill Report</option>
                                            <option value="consumption">Fuel Consumption Report</option>
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
                                        </select>
                                    </div>
                                </div>

                                {/* Fuel Report Details */}
                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">📅</span>
                                            Date
                                        </label>
                                        <input
                                            type="date"
                                            value={reportConfig.startDate}
                                            onChange={(e) => handleInputChange('startDate', e.target.value)}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">⛽</span>
                                            Amount (Liters)
                                        </label>
                                        <input
                                            type="number"
                                            value={reportConfig.fuelAmount}
                                            onChange={(e) => handleInputChange('fuelAmount', e.target.value)}
                                            className="form-input"
                                            step="0.1"
                                            required
                                        />
                                    </div>
                                </div>

                                {reportConfig.fuelType === 'refill' && (
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label className="form-label">
                                                <span className="label-icon">💰</span>
                                                Cost
                                            </label>
                                            <input
                                                type="number"
                                                value={reportConfig.fuelCost}
                                                onChange={(e) => handleInputChange('fuelCost', e.target.value)}
                                                className="form-input"
                                                step="0.01"
                                                required
                                            />
                                        </div>

                                        <div className="form-group">
                                            <label className="form-label">
                                                <span className="label-icon">🏪</span>
                                                Gas Station
                                            </label>
                                            <input
                                                type="text"
                                                value={reportConfig.station}
                                                onChange={(e) => handleInputChange('station', e.target.value)}
                                                className="form-input"
                                                placeholder="Station name"
                                            />
                                        </div>
                                    </div>
                                )}

                                <div className="form-row">
                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">🚗</span>
                                            Odometer Reading (km)
                                        </label>
                                        <input
                                            type="number"
                                            value={reportConfig.odometer}
                                            onChange={(e) => handleInputChange('odometer', e.target.value)}
                                            className="form-input"
                                            required
                                        />
                                    </div>

                                    <div className="form-group">
                                        <label className="form-label">
                                            <span className="label-icon">📝</span>
                                            Notes (Optional)
                                        </label>
                                        <textarea
                                            value={reportConfig.notes}
                                            onChange={(e) => handleInputChange('notes', e.target.value)}
                                            className="form-textarea"
                                            rows="2"
                                            placeholder="Additional information..."
                                        />
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Additional Report Options */}
                        <div className="form-group full-width">
                            <label className="form-label">
                                <span className="label-icon">⚙️</span>
                                Additional Options
                            </label>
                            <div className="checkbox-group">
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeRecommendations || true}
                                        onChange={(e) => handleInputChange('includeRecommendations', e.target.checked)}
                                    />
                                    <span>Include Performance Recommendations</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeCharts || false}
                                        onChange={(e) => handleInputChange('includeCharts', e.target.checked)}
                                    />
                                    <span>Include Performance Charts</span>
                                </label>
                                <label className="checkbox-label">
                                    <input
                                        type="checkbox"
                                        checked={reportConfig.includeComparison || false}
                                        onChange={(e) => handleInputChange('includeComparison', e.target.checked)}
                                    />
                                    <span>Include Period Comparison</span>
                                </label>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="form-actions">
                            <button
                                onClick={() => setShowPreview(true)}
                                className="btn-preview"
                            >
                                <span>👁️</span>
                                Preview Report
                            </button>
                            <button
                                onClick={handleGenerateReport}
                                className="btn-generate"
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
                                <h4>🚗 Driver Performance Report</h4>
                                <p className="preview-period">{reportConfig.reportType.toUpperCase()} REPORT</p>
                                <p className="preview-date">
                                    Period: {reportConfig.startDate} to {reportConfig.endDate}
                                </p>
                            </div>

                            {reportConfig.includeTripSummary && (
                                <div className="preview-section">
                                    <h5>🚗 Trip Summary</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Trips</span>
                                            <span className="stat-value">{getCurrentData().totalTrips}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Completed Trips</span>
                                            <span className="stat-value">{getCurrentData().completedTrips}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Cancelled Trips</span>
                                            <span className="stat-value">{getCurrentData().cancelledTrips}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Distance</span>
                                            <span className="stat-value">{getCurrentData().totalDistance} km</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeFuelUsage && (
                                <div className="preview-section">
                                    <h5>⛽ Fuel Usage & Efficiency</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Total Fuel Used</span>
                                            <span className="stat-value">{getCurrentData().totalFuelUsed} L</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Average Efficiency</span>
                                            <span className="stat-value">{getCurrentData().averageFuelEfficiency} km/L</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includeVehicleStatus && (
                                <div className="preview-section">
                                    <h5>🔧 Vehicle Status</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">Vehicle Inspections</span>
                                            <span className="stat-value">{getCurrentData().vehicleInspections}</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Maintenance Issues</span>
                                            <span className="stat-value">{getCurrentData().maintenanceIssues}</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {reportConfig.includePerformance && (
                                <div className="preview-section">
                                    <h5>📈 Performance Metrics</h5>
                                    <div className="preview-stats">
                                        <div className="preview-stat">
                                            <span className="stat-label">On-Time Performance</span>
                                            <span className="stat-value">{getCurrentData().onTimePerformance}%</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Working Hours</span>
                                            <span className="stat-value">{getCurrentData().workingHours} hrs</span>
                                        </div>
                                        <div className="preview-stat">
                                            <span className="stat-label">Overtime Hours</span>
                                            <span className="stat-value">{getCurrentData().overtimeHours} hrs</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="preview-footer">
                                <p><strong>Recipient:</strong> {reportConfig.recipient}</p>
                                <p><strong>Generated By:</strong> Driver</p>
                                <p><strong>Date:</strong> {new Date().toLocaleDateString()}</p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Stats */}
                <div className="quick-stats-grid">
                    {reportConfig.reportType === 'performance' ? (
                        <>
                            <div className="quick-stat-card">
                                <div className="stat-icon">🚗</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().totalTrips}</div>
                                    <div className="stat-label">Total Trips</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">✅</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().completedTrips}</div>
                                    <div className="stat-label">Completed</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">📏</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().totalDistance} km</div>
                                    <div className="stat-label">Distance</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">⛽</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().totalFuelUsed} L</div>
                                    <div className="stat-label">Fuel Used</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">📈</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().onTimePerformance}%</div>
                                    <div className="stat-label">On-Time Rate</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">⏰</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().workingHours} hrs</div>
                                    <div className="stat-label">Working Hours</div>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <div className="quick-stat-card">
                                <div className="stat-icon">⛽</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().fuelAmount} L</div>
                                    <div className="stat-label">Fuel Amount</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">💰</div>
                                <div className="stat-info">
                                    <div className="stat-value">${getCurrentData().fuelCost}</div>
                                    <div className="stat-label">Cost</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">🚗</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().odometer} km</div>
                                    <div className="stat-label">Odometer</div>
                                </div>
                            </div>

                            <div className="quick-stat-card">
                                <div className="stat-icon">🏪</div>
                                <div className="stat-info">
                                    <div className="stat-value">{getCurrentData().station}</div>
                                    <div className="stat-label">Station</div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="quick-actions-card">
                    <div className="card-header">
                        <h3>⚡ Quick Actions</h3>
                        <p>Generate common reports quickly</p>
                    </div>
                    <div className="quick-actions-grid">
                        <button
                            className="quick-action-btn"
                            onClick={async () => {
                                const newConfig = {
                                    ...reportConfig,
                                    reportType: 'performance',
                                    performanceType: 'daily',
                                    startDate: new Date().toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0],
                                    recipient: 'Admin'
                                };
                                setReportConfig(newConfig);
                                // Use the new config directly
                                await generateReportWithConfig(newConfig);
                            }}
                        >
                            <span className="action-icon">📅</span>
                            <span>Today's Performance</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={async () => {
                                const weekStart = new Date();
                                weekStart.setDate(weekStart.getDate() - weekStart.getDay());
                                const newConfig = {
                                    ...reportConfig,
                                    reportType: 'performance',
                                    performanceType: 'weekly',
                                    startDate: weekStart.toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0],
                                    recipient: 'Admin'
                                };
                                setReportConfig(newConfig);
                                // Use the new config directly
                                await generateReportWithConfig(newConfig);
                            }}
                        >
                            <span className="action-icon">📊</span>
                            <span>Weekly Performance</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={async () => {
                                const monthStart = new Date();
                                monthStart.setDate(1);
                                const newConfig = {
                                    ...reportConfig,
                                    reportType: 'performance',
                                    performanceType: 'monthly',
                                    startDate: monthStart.toISOString().split('T')[0],
                                    endDate: new Date().toISOString().split('T')[0],
                                    recipient: 'Transport Office'
                                };
                                setReportConfig(newConfig);
                                // Use the new config directly
                                await generateReportWithConfig(newConfig);
                            }}
                        >
                            <span className="action-icon">📈</span>
                            <span>Monthly Performance</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={() => {
                                setReportConfig(prev => ({
                                    ...prev,
                                    reportType: 'fuel',
                                    fuelType: 'refill',
                                    recipient: 'Admin'
                                }));
                            }}
                        >
                            <span className="action-icon">⛽</span>
                            <span>Quick Fuel Report</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={() => {
                                // Simple test to verify PDF generation works
                                try {
                                    console.log('Testing PDF generation...');
                                    console.log('pdfGenerator:', pdfGenerator);
                                    console.log('generateDriverReport method:', pdfGenerator.generateDriverReport);

                                    // Test with minimal data
                                    const testData = {
                                        reportType: 'driver',
                                        period: 'Daily',
                                        startDate: '2024-01-01',
                                        endDate: '2024-01-01',
                                        totalTrips: 5,
                                        completedTrips: 4,
                                        cancelledTrips: 1,
                                        totalDistance: '100.0',
                                        totalFuelUsed: '15.0',
                                        averageFuelEfficiency: '6.7',
                                        onTimePerformance: '80.0',
                                        vehicleInspections: 1,
                                        maintenanceIssues: 0,
                                        workingHours: '8.0',
                                        overtimeHours: '0.0',
                                        recipient: 'Admin',
                                        generatedBy: 'Driver',
                                        date: new Date().toLocaleDateString(),
                                        includeTripSummary: true,
                                        includeFuelUsage: true,
                                        includeVehicleStatus: true,
                                        includePerformance: true
                                    };

                                    const result = pdfGenerator.generateDriverReport(testData, 'Admin');
                                    console.log('Test PDF generation successful:', result);
                                    alert('✅ PDF Test Successful! Check console for details.');
                                } catch (error) {
                                    console.error('PDF Test Error:', error);
                                    alert(`❌ PDF Test Failed: ${error.message}`);
                                }
                            }}
                        >
                            <span className="action-icon">🧪</span>
                            <span>Test PDF</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DriverReports;