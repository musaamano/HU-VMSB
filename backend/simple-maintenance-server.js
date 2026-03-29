const express = require('express');
const cors = require('cors');

console.log('🚀 Starting Simple Maintenance Server...');

const app = express();

// Enable CORS for all requests
app.use(cors());
app.use(express.json());

// In-memory storage for issues
let issues = [];

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Simple maintenance server running' });
});

// Authentication (mock)
app.post('/api/auth/login', (req, res) => {
  res.json({
    success: true,
    token: 'mock-token-123',
    user: {
      _id: 'user-123',
      name: 'Test Driver',
      email: 'driver@test.com',
      role: 'DRIVER'
    }
  });
});

// Driver routes
app.get('/api/driver/test', (req, res) => {
  res.json({ message: 'Driver routes working!' });
});

// Main issue submission endpoint
app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('📝 New maintenance request:', req.body);

  const issue = {
    id: issues.length + 1,
    reportReference: `HU-MNT-${Date.now()}`,
    vehicle: { plateNumber: 'TEST-123', model: 'Test Vehicle' },
    reportedBy: { name: 'Test Driver', email: 'driver@test.com' },
    issueType: req.body.issueType || 'Other',
    severity: req.body.severity || 'Minor',
    description: req.body.description || 'No description',
    status: 'reported',
    createdAt: new Date().toISOString(),
    priority: req.body.severity === 'Critical' ? 'Urgent' :
      req.body.severity === 'Moderate' ? 'High' : 'Medium'
  };

  issues.push(issue);

  // Simulate maintenance notification
  console.log('🔧 MAINTENANCE OFFICE NOTIFIED:');
  console.log(`   Reference: ${issue.reportReference}`);
  console.log(`   Vehicle: ${issue.vehicle.plateNumber}`);
  console.log(`   Issue: ${issue.issueType} - ${issue.severity}`);
  console.log(`   Description: ${issue.description}`);
  console.log(`   Priority: ${issue.priority}`);

  res.status(201).json({
    success: true,
    message: 'Professional maintenance report submitted to Maintenance Office',
    issue: issue,
    reportReference: issue.reportReference,
    notifiedMaintenanceOfficers: 2,
    priority: issue.priority,
    estimatedWaitTime: issue.severity === 'Critical' ? 'Immediate' :
      issue.severity === 'Moderate' ? '2-4 hours' : '24-48 hours'
  });
});

// Maintenance routes
app.get('/api/maintenance/issues', (req, res) => {
  const { status } = req.query;
  let filteredIssues = issues;
  if (status && status !== 'all') {
    filteredIssues = issues.filter(i => i.status === status);
  }
  res.json(filteredIssues);
});

app.put('/api/maintenance/issues/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const issue = issues.find(i => i.id === id);

  if (!issue) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  if (req.body.status === 'acknowledged') {
    issue.status = 'acknowledged';
    issue.acknowledgedAt = new Date().toISOString();
    issue.acknowledgedBy = 'Maintenance Officer';
    console.log(`✅ Issue ${issue.reportReference} acknowledged`);
  }

  if (req.body.status === 'resolved') {
    issue.status = 'resolved';
    issue.resolvedAt = new Date().toISOString();
    issue.resolvedBy = 'Maintenance Officer';
    issue.resolutionNotes = req.body.resolutionNotes || 'Issue resolved';
    issue.partsUsed = req.body.partsUsed || 'N/A';
    issue.laborHours = req.body.laborHours || 'N/A';
    issue.finalCost = req.body.finalCost || 'N/A';

    const createdAt = new Date(issue.createdAt);
    const resolvedAt = new Date(issue.resolvedAt);
    const durationHours = Math.round(((resolvedAt - createdAt) / (1000 * 60 * 60)) * 10) / 10;
    issue.timeToResolve = `${durationHours} hour(s)`;

    issue.driverNotification = `Dear ${issue.reportedBy.name},\n\n` +
      `Your maintenance request (${issue.reportReference}) is complete.\n` +
      `Issue: ${issue.issueType} - ${issue.severity} with notes: ${issue.resolutionNotes}.\n` +
      `Total resolution time: ${issue.timeToResolve}.\n` +
      `Please collect your vehicle ${issue.vehicle.plateNumber} from maintenance within 24 hours.\n\n` +
      `Thank you,\nMaintenance Office`;

    console.log(`🔧 Issue ${issue.reportReference} resolved:`);
    console.log(`   Work Done: ${issue.resolutionNotes}`);
    console.log(`   Parts Used: ${issue.partsUsed}`);
    console.log(`   Labor Hours: ${issue.laborHours}`);
    console.log(`   Final Cost: ${issue.finalCost}`);
    console.log(`🔔 Driver notification: ${issue.driverNotification}`);
  }

  res.json({ success: true, issue, driverNotification: issue.driverNotification || null });
});

// Reporting endpoints
app.get('/api/maintenance/reports/data', (req, res) => {
  const { from, to, status } = req.query;

  let filteredIssues = issues;
  if (status && status !== 'all') {
    filteredIssues = issues.filter(i => i.status === status);
  }

  const stats = {
    total: issues.length,
    reported: issues.filter(i => i.status === 'reported').length,
    acknowledged: issues.filter(i => i.status === 'acknowledged').length,
    inRepair: issues.filter(i => i.status === 'in_repair').length,
    resolved: issues.filter(i => i.status === 'resolved').length,
    bySeverity: {
      critical: issues.filter(i => i.severity === 'Critical').length,
      moderate: issues.filter(i => i.severity === 'Moderate').length,
      minor: issues.filter(i => i.severity === 'Minor').length
    },
    byPriority: {
      urgent: issues.filter(i => i.priority === 'Urgent').length,
      high: issues.filter(i => i.priority === 'High').length,
      medium: issues.filter(i => i.priority === 'Medium').length,
      low: issues.filter(i => i.priority === 'Low').length
    },
    safetyHazards: issues.filter(i => i.safetyHazard === true).length
  };

  res.json({
    issues: filteredIssues,
    statistics: {
      ...stats,
      completionRate: stats.total > 0 ? ((stats.resolved / stats.total) * 100).toFixed(1) : 0,
      avgResolutionTime: stats.resolved > 0 ? '24 hours' : 'N/A'
    },
    summary: {
      totalRepairs: stats.resolved,
      inProgress: stats.inRepair,
      pending: stats.reported + stats.acknowledged,
      urgentIssues: stats.byPriority.urgent,
      criticalIssues: stats.bySeverity.critical,
      safetyConcerns: stats.safetyHazards
    }
  });
});

app.post('/api/maintenance/reports/send', (req, res) => {
  const { reportType, includeDetails } = req.body;

  let report = `🔧 COMPREHENSIVE MAINTENANCE REPORT\n\n`;
  report += `Report Type: ${reportType}\n`;
  report += `Generated: ${new Date().toLocaleString()}\n`;
  report += `Generated By: Maintenance Office\n\n`;

  // Summary Statistics
  report += `📊 SUMMARY STATISTICS:\n`;
  report += `• Total Issues: ${issues.length}\n`;
  report += `• Status Breakdown:\n`;
  report += `  - Reported: ${issues.filter(i => i.status === 'reported').length}\n`;
  report += `  - Acknowledged: ${issues.filter(i => i.status === 'acknowledged').length}\n`;
  report += `  - In Repair: ${issues.filter(i => i.status === 'in_repair').length}\n`;
  report += `  - Completed: ${issues.filter(i => i.status === 'resolved').length}\n\n`;

  report += `• Severity Breakdown:\n`;
  report += `  - Critical: ${issues.filter(i => i.severity === 'Critical').length}\n`;
  report += `  - Moderate: ${issues.filter(i => i.severity === 'Moderate').length}\n`;
  report += `  - Minor: ${issues.filter(i => i.severity === 'Minor').length}\n\n`;

  report += `• Priority Breakdown:\n`;
  report += `  - Urgent: ${issues.filter(i => i.priority === 'Urgent').length}\n`;
  report += `  - High: ${issues.filter(i => i.priority === 'High').length}\n`;
  report += `  - Medium: ${issues.filter(i => i.priority === 'Medium').length}\n`;
  report += `  - Low: ${issues.filter(i => i.priority === 'Low').length}\n\n`;

  report += `• Safety Hazards: ${issues.filter(i => i.safetyHazard === true).length}\n`;
  report += `• Completion Rate: ${issues.length > 0 ? ((issues.filter(i => i.status === 'resolved').length / issues.length) * 100).toFixed(1) : 0}%\n\n`;

  // Detailed Issues Section
  if (includeDetails) {
    report += `📋 DETAILED ISSUES BY STATUS:\n\n`;

    // Reported Issues
    const reportedIssues = issues.filter(i => i.status === 'reported');
    if (reportedIssues.length > 0) {
      report += `🔴 REPORTED ISSUES (${reportedIssues.length}):\n`;
      reportedIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.reportReference}\n`;
        report += `   Vehicle: ${issue.vehicle.plateNumber} (${issue.vehicle.model})\n`;
        report += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
        report += `   Description: ${issue.description}\n`;
        report += `   Reported By: ${issue.reportedBy.name}\n`;
        report += `   Date: ${new Date(issue.createdAt).toLocaleDateString()}\n`;
        report += `   Status: ⏳ Pending Acknowledgment\n\n`;
      });
    }

    // Acknowledged Issues  
    const acknowledgedIssues = issues.filter(i => i.status === 'acknowledged');
    if (acknowledgedIssues.length > 0) {
      report += `🟡 ACKNOWLEDGED ISSUES (${acknowledgedIssues.length}):\n`;
      acknowledgedIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.reportReference}\n`;
        report += `   Vehicle: ${issue.vehicle.plateNumber} (${issue.vehicle.model})\n`;
        report += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
        report += `   Acknowledged By: ${issue.acknowledgedBy}\n`;
        report += `   Acknowledged: ${new Date(issue.acknowledgedAt).toLocaleDateString()}\n`;
        report += `   Status: 🔧 In Progress\n\n`;
      });
    }

    // Issues In Repair
    const inRepairIssues = issues.filter(i => i.status === 'in_repair');
    if (inRepairIssues.length > 0) {
      report += `🔧 ISSUES IN REPAIR (${inRepairIssues.length}):\n`;
      inRepairIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.reportReference}\n`;
        report += `   Vehicle: ${issue.vehicle.plateNumber} (${issue.vehicle.model})\n`;
        report += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
        report += `   Status: 🔧 Currently Being Repaired\n`;
        report += `   Started: ${new Date(issue.acknowledgedAt || issue.createdAt).toLocaleDateString()}\n\n`;
      });
    }

    // Completed Issues
    const completedIssues = issues.filter(i => i.status === 'resolved');
    if (completedIssues.length > 0) {
      report += `✅ COMPLETED ISSUES (${completedIssues.length}):\n`;
      completedIssues.forEach((issue, index) => {
        report += `${index + 1}. ${issue.reportReference}\n`;
        report += `   Vehicle: ${issue.vehicle.plateNumber} (${issue.vehicle.model})\n`;
        report += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
        report += `   Status: ✅ Completed\n`;
        report += `   Completed By: ${issue.resolvedBy}\n`;
        report += `   Completed: ${new Date(issue.resolvedAt).toLocaleDateString()}\n`;
        report += `   🔧 Work Done: ${issue.resolutionNotes}\n`;
        report += `   🛠️ Parts Used: ${issue.partsUsed}\n`;
        report += `   ⏱️ Labor Hours: ${issue.laborHours}\n`;
        report += `   💰 Final Cost: ${issue.finalCost}\n\n`;
      });
    }
  }

  // Performance Metrics
  report += `\n📈 PERFORMANCE METRICS:\n`;
  const resolvedIssues = issues.filter(i => i.status === 'resolved');
  if (resolvedIssues.length > 0) {
    const avgTime = resolvedIssues.reduce((sum, i) => {
      if (i.resolvedAt && i.createdAt) {
        return sum + (i.resolvedAt - i.createdAt);
      }
      return sum;
    }, 0) / resolvedIssues.length;
    const avgHours = Math.round(avgTime / (1000 * 60 * 60));

    report += `• Average Resolution Time: ${avgHours} hours\n`;
    report += `• Critical Issues Resolved: ${resolvedIssues.filter(i => i.severity === 'Critical').length}\n`;
    report += `• Safety Hazards Addressed: ${resolvedIssues.filter(i => i.safetyHazard).length}\n`;
    report += `• Total Parts Cost: $${resolvedIssues.reduce((sum, i) => sum + (parseFloat(i.finalCost) || 0), 0).toFixed(2)}\n`;
    report += `• Total Labor Hours: ${resolvedIssues.reduce((sum, i) => sum + (parseFloat(i.laborHours) || 0), 0)}\n\n`;
  }

  // Recommendations
  report += `🎯 RECOMMENDATIONS:\n`;
  const criticalCount = issues.filter(i => i.severity === 'Critical').length;
  const pendingCount = issues.filter(i => i.status === 'reported').length + issues.filter(i => i.status === 'acknowledged').length;

  if (criticalCount > 0) {
    report += `• ${criticalCount} critical issues require immediate attention\n`;
  }
  if (pendingCount > issues.filter(i => i.status === 'resolved').length) {
    report += `• Consider allocating more resources to reduce ${pendingCount} pending issues\n`;
  }
  if (issues.filter(i => i.status === 'resolved').length > issues.filter(i => i.status === 'in_repair').length) {
    report += `• Good completion rate - keep current workflow\n`;
  }

  console.log('📊 Comprehensive maintenance report generated');
  console.log(report);

  res.json({
    success: true,
    notified: 2,
    message: 'Comprehensive report generated successfully',
    reportData: {
      summary: {
        totalIssues: issues.length,
        ...stats,
        completionRate: `${issues.length > 0 ? ((issues.filter(i => i.status === 'resolved').length / issues.length) * 100).toFixed(1) : 0}%`
      },
      detailedReport: report
    }
  });
});

// 404 handler
app.use((req, res) => {
  console.log('❌ 404:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Start server
const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`✅ Simple Maintenance Server running on port ${PORT}`);
  console.log(`📋 Available endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/driver/vehicle/issue`);
  console.log(`   GET  http://localhost:${PORT}/api/maintenance/issues`);
  console.log(`   PUT  http://localhost:${PORT}/api/maintenance/issues/:id`);
  console.log(`   GET  http://localhost:${PORT}/api/maintenance/reports/data`);
  console.log(`   POST http://localhost:${PORT}/api/maintenance/reports/send`);
  console.log(`\n🎯 Ready for maintenance issue reporting!`);
});
