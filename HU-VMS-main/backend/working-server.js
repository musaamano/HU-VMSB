require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('Starting working maintenance server...');

const app = express();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());

// Mock data storage (in memory)
let mockIssues = [
  {
    _id: '1',
    reportReference: 'HU-MNT-20240327-001',
    vehicle: { plateNumber: 'TEST-123', model: 'Toyota Camry', type: 'Sedan' },
    reportedBy: { name: 'Driver One', email: 'driver1@test.com' },
    issueType: 'Engine',
    severity: 'Critical',
    description: 'Engine making strange noise',
    status: 'resolved',
    createdAt: new Date('2024-03-25'),
    acknowledgedAt: new Date('2024-03-25'),
    resolvedAt: new Date('2024-03-26'),
    acknowledgedBy: { name: 'Mechanic John', email: 'mechanic@test.com' },
    resolvedBy: { name: 'Mechanic Smith', email: 'mechanic@test.com' },
    resolutionNotes: 'Replaced timing belt and tensioner',
    partsUsed: 'Timing belt, tensioner, coolant',
    laborHours: '4',
    finalCost: '$350.00'
  },
  {
    _id: '2',
    reportReference: 'HU-MNT-20240327-002',
    vehicle: { plateNumber: 'TEST-456', model: 'Honda Civic', type: 'Sedan' },
    reportedBy: { name: 'Driver Two', email: 'driver2@test.com' },
    issueType: 'Brakes',
    severity: 'Moderate',
    description: 'Brake pads worn out',
    status: 'in_repair',
    createdAt: new Date('2024-03-26'),
    acknowledgedAt: new Date('2024-03-27'),
    acknowledgedBy: { name: 'Mechanic John', email: 'mechanic@test.com' },
    resolvedBy: null,
    resolvedAt: null,
    resolutionNotes: '',
    partsUsed: '',
    laborHours: '',
    finalCost: ''
  }
];

// Authentication
app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({
    success: true,
    token: 'mock-jwt-token-working',
    user: {
      _id: 'mock-user-id',
      name: 'Test Maintenance Officer',
      email: 'maintenance@test.com',
      role: 'MAINTENANCE'
    }
  });
});

// Driver issue submission (without authentication for testing)
app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('Vehicle issue submission:', req.body);
  const newIssue = {
    _id: String(mockIssues.length + 1),
    reportReference: `HU-MNT-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-${String(mockIssues.length + 1).padStart(3, '0')}`,
    vehicle: { plateNumber: 'TEST-789', model: 'Test Vehicle', type: 'Sedan' },
    reportedBy: { name: 'Test Driver', email: 'driver@test.com' },
    issueType: req.body.issueType || 'Other',
    severity: req.body.severity || 'Minor',
    description: req.body.description || 'Test issue',
    status: 'reported',
    createdAt: new Date(),
    acknowledgedAt: null,
    resolvedAt: null,
    acknowledgedBy: null,
    resolvedBy: null,
    resolutionNotes: '',
    partsUsed: '',
    laborHours: '',
    finalCost: ''
  };

  mockIssues.push(newIssue);
  console.log('Issue created:', newIssue);

  // Simulate notification to maintenance office
  console.log('🔧 NOTIFICATION SENT TO MAINTENANCE OFFICE:');
  console.log(`   Report Reference: ${newIssue.reportReference}`);
  console.log(`   Vehicle: ${newIssue.vehicle.plateNumber}`);
  console.log(`   Issue: ${newIssue.issueType} - ${newIssue.severity}`);
  console.log(`   Description: ${newIssue.description}`);
  console.log(`   Reported By: ${newIssue.reportedBy.name}`);

  res.status(201).json({
    success: true,
    message: 'Professional maintenance report successfully submitted to Maintenance Office',
    issue: newIssue,
    reportReference: newIssue.reportReference,
    notifiedMaintenanceOfficers: 2,
    priority: newIssue.severity === 'Critical' ? 'Urgent' : newIssue.severity === 'Moderate' ? 'High' : 'Medium',
    estimatedWaitTime: newIssue.severity === 'Critical' ? 'Immediate - Under 1 hour' : newIssue.severity === 'Moderate' ? '2-4 hours' : '24-48 hours'
  });
});

// Maintenance endpoints
app.get('/api/maintenance/issues', (req, res) => {
  const { status } = req.query;
  let filteredIssues = mockIssues;
  if (status && status !== 'all') {
    filteredIssues = mockIssues.filter(issue => issue.status === status);
  }
  res.json(filteredIssues);
});

app.put('/api/maintenance/issues/:id', (req, res) => {
  const { id } = req.params;
  const issueIndex = mockIssues.findIndex(issue => issue._id === id);

  if (issueIndex === -1) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  const issue = mockIssues[issueIndex];

  if (req.body.status === 'acknowledged') {
    issue.status = 'acknowledged';
    issue.acknowledgedAt = new Date();
    issue.acknowledgedBy = { name: 'Test Maintenance', email: 'maintenance@test.com' };
    issue.estimatedRepairTime = req.body.estimatedRepairTime || '2-4 hours';
  }

  if (req.body.status === 'resolved') {
    issue.status = 'resolved';
    issue.resolvedAt = new Date();
    issue.resolvedBy = { name: 'Test Maintenance', email: 'maintenance@test.com' };
    issue.resolutionNotes = req.body.resolutionNotes || 'Issue resolved successfully';
    issue.partsUsed = req.body.partsUsed || 'No parts required';
    issue.laborHours = req.body.laborHours || 'Not specified';
    issue.finalCost = req.body.finalCost || 'Not specified';

    const durationMs = issue.resolvedAt - new Date(issue.createdAt);
    const durationHours = Math.round((durationMs / (1000 * 60 * 60)) * 10) / 10;
    issue.timeToResolve = `${durationHours} hour(s)`;

    issue.driverNotification = `Dear ${issue.reportedBy.name},\n\n` +
      `Your reported case (${issue.reportReference}) for vehicle ${issue.vehicle.plateNumber} (${issue.vehicle.model}) has been fully resolved by the Maintenance Office.\n` +
      `Resolution provided by: ${issue.resolvedBy.name}.\n` +
      `Total work duration: ${issue.timeToResolve}.\n` +
      `Summary: ${issue.resolutionNotes}.\n\n` +
      `Please collect your vehicle from the maintenance bay within the next 24 hours. We appreciate your patience and ensure all safety checks are completed.\n\n` +
      `Thank you,\nMaintenance Office`;

    console.log('🔔 DRIVER NOTIFICATION (case resolved):');
    console.log(issue.driverNotification);
  }

  console.log('Issue updated:', issue);
  res.json({ success: true, issue, driverNotification: issue.driverNotification || null });
});

app.post('/api/maintenance/issues/:id/message-driver', (req, res) => {
  const { id } = req.params;
  const { message, updateStatus } = req.body;

  const issueIndex = mockIssues.findIndex(issue => issue._id === id);
  if (issueIndex === -1) {
    return res.status(404).json({ message: 'Issue not found' });
  }

  if (updateStatus) {
    mockIssues[issueIndex].status = updateStatus;
  }

  const issue = mockIssues[issueIndex];
  const responseToDriver = `Dear ${issue.reportedBy.name},\n\n` +
    `Your maintenance request (Ref: ${issue.reportReference}) is being handled by the maintenance office.\n` +
    `${message}\n\n` +
    `Current status: ${issue.status}.` +
    (issue.status === 'resolved' ? `\nThe issue was resolved in ${issue.timeToResolve || 'N/A'}, and your vehicle is ready for pickup at the maintenance bay. Please collect the car within 24 hours.` : `\nWe will update you when the work is complete.`) +
    `\n\nThank you,\nMaintenance Office`;

  console.log(`Message sent to driver for issue ${id}:`, responseToDriver);
  res.json({
    success: true,
    message: 'Message dispatched to driver successfully',
    driverName: issue.reportedBy.name,
    responseToDriver
  });
});

// Enhanced reporting endpoints
app.get('/api/maintenance/reports/data', (req, res) => {
  const { from, to, status } = req.query;

  let filteredIssues = mockIssues;
  if (status && status !== 'all') {
    filteredIssues = mockIssues.filter(issue => issue.status === status);
  }

  const stats = {
    reported: mockIssues.filter(i => i.status === 'reported').length,
    acknowledged: mockIssues.filter(i => i.status === 'acknowledged').length,
    inRepair: mockIssues.filter(i => i.status === 'in_repair').length,
    resolved: mockIssues.filter(i => i.status === 'resolved').length,
    critical: mockIssues.filter(i => i.severity === 'Critical').length,
    safetyHazards: mockIssues.filter(i => i.severity === 'Critical').length,
    urgent: mockIssues.filter(i => i.severity === 'Critical').length
  };

  const totalIssues = stats.reported + stats.acknowledged + stats.inRepair + stats.resolved;
  const completionRate = totalIssues > 0 ? ((stats.resolved / totalIssues) * 100).toFixed(1) : 0;

  res.json({
    issues: filteredIssues,
    statistics: {
      totalIssues,
      ...stats,
      completionRate: `${completionRate}%`,
      avgResolutionTime: '24 hours'
    },
    summary: {
      totalRepairs: stats.resolved,
      inProgress: stats.inRepair,
      pending: stats.reported + stats.acknowledged,
      urgentIssues: stats.urgent,
      safetyConcerns: stats.safetyHazards
    }
  });
});

app.post('/api/maintenance/reports/send', (req, res) => {
  const { reportType, startDate, endDate, recipient, includeDetails } = req.body;

  let reportMessage = `🔧 COMPREHENSIVE MAINTENANCE REPORT\n\n`;
  reportMessage += `Report Type: ${reportType}\n`;
  reportMessage += `Period: ${startDate} to ${endDate}\n`;
  reportMessage += `Generated: ${new Date().toLocaleString()}\n`;
  reportMessage += `Generated By: Test Maintenance (MAINTENANCE)\n\n`;

  const stats = {
    totalIssues: mockIssues.length,
    resolved: mockIssues.filter(i => i.status === 'resolved').length,
    inRepair: mockIssues.filter(i => i.status === 'in_repair').length,
    pending: mockIssues.filter(i => i.status === 'reported' || i.status === 'acknowledged').length,
    critical: mockIssues.filter(i => i.severity === 'Critical').length
  };

  reportMessage += `📊 SUMMARY STATISTICS:\n`;
  reportMessage += `• Total Issues: ${stats.totalIssues}\n`;
  reportMessage += `• Resolved: ${stats.resolved}\n`;
  reportMessage += `• In Progress: ${stats.inRepair}\n`;
  reportMessage += `• Pending: ${stats.pending}\n`;
  reportMessage += `• Critical Issues: ${stats.critical}\n`;
  reportMessage += `• Completion Rate: ${stats.totalIssues > 0 ? ((stats.resolved / stats.totalIssues) * 100).toFixed(1) : 0}%\n\n`;

  if (includeDetails) {
    reportMessage += `📋 DETAILED ISSUES & WORK COMPLETED:\n`;
    mockIssues.forEach((issue, index) => {
      reportMessage += `\n${index + 1}. ${issue.reportReference}\n`;
      reportMessage += `   Vehicle: ${issue.vehicle.plateNumber} (${issue.vehicle.model})\n`;
      reportMessage += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
      reportMessage += `   Status: ${issue.status}\n`;
      reportMessage += `   Reported By: ${issue.reportedBy.name}\n`;
      reportMessage += `   Reported Date: ${new Date(issue.createdAt).toLocaleDateString()}\n`;

      if (issue.status === 'resolved') {
        reportMessage += `   ✅ RESOLVED By: ${issue.resolvedBy.name}\n`;
        reportMessage += `   Resolution Date: ${new Date(issue.resolvedAt).toLocaleDateString()}\n`;
        reportMessage += `   🔧 Work Done: ${issue.resolutionNotes}\n`;
        reportMessage += `   🛠️ Parts Used: ${issue.partsUsed}\n`;
        reportMessage += `   ⏱️ Labor Hours: ${issue.laborHours}\n`;
        reportMessage += `   💰 Final Cost: ${issue.finalCost}\n`;
      }
    });
  }

  console.log('Maintenance report generated and sent');
  res.json({
    success: true,
    notified: 2,
    reportSummary: stats
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Working maintenance server running' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`✅ Working maintenance server running on port ${PORT}`);
  console.log(`✅ All endpoints available:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/driver/vehicle/issue`);
  console.log(`   GET  http://localhost:${PORT}/api/maintenance/issues`);
  console.log(`   PUT  http://localhost:${PORT}/api/maintenance/issues/:id`);
  console.log(`   GET  http://localhost:${PORT}/api/maintenance/reports/data`);
  console.log(`   POST http://localhost:${PORT}/api/maintenance/reports/send`);
});
