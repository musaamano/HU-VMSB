const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const VehicleIssue = require('../models/VehicleIssue');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const User = require('../models/User');

const guard = [protect, authorize('MAINTENANCE', 'ADMIN', 'TRANSPORT')];

// ── Dashboard stats ───────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  const [reported, acknowledged, inRepair, resolved] = await Promise.all([
    VehicleIssue.countDocuments({ status: 'reported' }),
    VehicleIssue.countDocuments({ status: 'acknowledged' }),
    VehicleIssue.countDocuments({ status: 'in_repair' }),
    VehicleIssue.countDocuments({ status: 'resolved' }),
  ]);
  res.json({ reported, acknowledged, inRepair, resolved, total: reported + acknowledged + inRepair + resolved });
});

// ── Get all vehicle issues ────────────────────────────────────────
router.get('/issues', ...guard, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const issues = await VehicleIssue.find(filter)
    .populate('vehicle', 'plateNumber model')
    .populate('reportedBy', 'name')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(issues);
});

// ── Send message to driver about maintenance request ─────────────────
router.post('/issues/:id/message-driver', ...guard, async (req, res) => {
  const { message, updateStatus } = req.body;

  try {
    const issue = await VehicleIssue.findById(req.params.id).populate('reportedBy', 'name email');
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    // Update issue status if provided
    if (updateStatus) {
      await VehicleIssue.findByIdAndUpdate(req.params.id, { status: updateStatus });
    }

    // verify reported driver exists
    if (!issue.reportedBy || !issue.reportedBy._id) {
      return res.status(400).json({ success: false, message: 'Driver information missing on issue' });
    }

    // Send message to driver
    const driverNotification = await Notification.create({
      recipient: issue.reportedBy._id,
      type: 'vehicle_alert',
      title: `🔧 Maintenance Update - Ref: ${issue.reportReference}`,
      message: `MAINTENANCE TEAM UPDATE\n\n` +
        `Report Reference: ${issue.reportReference}\n` +
        `From: ${req.user.name} (Maintenance Officer)\n` +
        `Time: ${new Date().toLocaleString()}\n` +
        `Status: ${updateStatus || issue.status}\n\n` +
        `MESSAGE FROM MAINTENANCE:\n${message}\n\n` +
        `Issue: ${issue.issueType} - ${issue.severity}\n` +
        `Reported: ${issue.createdAt.toLocaleDateString()}\n\n` +
        `If you have questions, please contact the maintenance office.`,
      severity: 'high',
    });

    if (!driverNotification) {
      return res.status(500).json({ success: false, message: 'Failed to create driver notification' });
    }

    console.log(`Maintenance message sent to driver ${issue.reportedBy.name} for issue ${issue.reportReference}`);

    res.json({
      success: true,
      message: 'Message sent to driver successfully',
      driverName: issue.reportedBy.name,
      responseToDriver: `MAINTENANCE TEAM UPDATE: ${message} (Status: ${updateStatus || issue.status})`
    });

  } catch (error) {
    console.error('Error sending message to driver:', error);
    res.status(500).json({ message: 'Failed to send message to driver' });
  }
});

// ── Update issue status ───────────────────────────────────────────
router.put('/issues/:id', ...guard, async (req, res) => {
  const update = { ...req.body };

  // Handle acknowledgment with driver notification
  if (req.body.status === 'acknowledged') {
    update.acknowledgedAt = new Date();
    update.acknowledgedBy = req.user._id;
    update.estimatedRepairTime = req.body.estimatedRepairTime || 'To be determined';

    // Notify driver that issue has been acknowledged with detailed response
    const issue = await VehicleIssue.findById(req.params.id).populate('reportedBy', 'name email vehicle');
    if (issue && issue.reportedBy) {
      await Notification.create({
        recipient: issue.reportedBy._id,
        type: 'vehicle_alert',
        title: `🔧 Maintenance Team Responding - Ref: ${issue.reportReference}`,
        message: `MAINTENANCE TEAM RESPONSE\n\n` +
          `Report Reference: ${issue.reportReference}\n` +
          `Status: ACKNOWLEDGED - Team Assigned\n` +
          `Acknowledged By: ${req.user.name} (Maintenance Officer)\n` +
          `Response Time: ${new Date().toLocaleString()}\n` +
          `Estimated Repair Time: ${req.body.estimatedRepairTime || 'To be determined after inspection'}\n\n` +
          `NEXT STEPS:\n` +
          `• Maintenance team will inspect your vehicle\n` +
          `• You will receive updates on progress\n` +
          `• Vehicle will be returned after repairs are complete\n\n` +
          `Issue: ${issue.issueType} - ${issue.severity}\n` +
          `Description: ${issue.description}\n\n` +
          `Please wait for further instructions from the maintenance team.`,
        severity: 'normal',
      });

      console.log(`Maintenance acknowledgment sent to driver: ${issue.reportedBy.name}`);
    }
  }

  // Handle in_repair — notify driver repair has started
  if (req.body.status === 'in_repair') {
    const issueForNotif = await VehicleIssue.findById(req.params.id)
      .populate('reportedBy', 'name _id')
      .populate('vehicle', 'plateNumber model');
    if (issueForNotif?.reportedBy?._id) {
      const plate = issueForNotif.vehicle?.plateNumber || 'your vehicle';
      const model = issueForNotif.vehicle?.model || '';
      await Notification.create({
        recipient: issueForNotif.reportedBy._id,
        type:      'vehicle_alert',
        title:     '🔧 Repair In Progress',
        message:   `Your ${issueForNotif.issueType} issue on ${plate} ${model} is now being actively repaired by the Maintenance Team.\n\nEstimated completion: ${req.body.estimatedRepairTime || 'In progress — you will be notified when complete'}.\n\nWork notes: ${req.body.repairNotes || 'Under repair'}.\n\nPlease do not attempt to use the vehicle until you receive a completion notice.`,
        severity:  'medium',
        relatedId:    issueForNotif._id,
        relatedModel: 'VehicleIssue',
      });
    }
  }

  // Handle resolution (when maintenance office marks as fixed)
  if (req.body.status === 'resolved') {
    update.resolvedAt = new Date();
    update.resolvedBy = req.user._id;
    update.resolutionNotes = req.body.resolutionNotes || 'Issue resolved by maintenance team';
    update.partsUsed = req.body.partsUsed || '';
    update.laborHours = req.body.laborHours || '';
    update.finalCost = req.body.finalCost || '';

    console.log('Issue marked as resolved:', {
      issueId: req.params.id,
      resolvedBy: req.user.name,
      resolutionNotes: req.body.resolutionNotes,
      partsUsed: req.body.partsUsed,
      laborHours: req.body.laborHours,
      finalCost: req.body.finalCost
    });
  }

  const issue = await VehicleIssue.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('vehicle', 'plateNumber model')
    .populate('reportedBy', 'name')
    .populate('acknowledgedBy', 'name')
    .populate('resolvedBy', 'name');

  if (!issue) return res.status(404).json({ message: 'Issue not found' });

  // If resolved, set vehicle back to Available
  if (req.body.status === 'resolved' && issue.vehicle) {
    await Vehicle.findByIdAndUpdate(issue.vehicle._id, { status: 'Available' });
  }

  // Notify Admin and Transport Officers when repair is complete
  if (req.body.status === 'resolved') {
    const recipients = await User.find({
      role: { $in: ['ADMIN', 'TRANSPORT'] }, isActive: true
    }).select('_id');

    if (recipients.length > 0) {
      await Notification.insertMany(recipients.map(r => ({
        recipient: r._id,
        type: 'vehicle_alert',
        title: `🔧 MAINTENANCE COMPLETE - Ref: ${issue.reportReference}`,
        message: `OFFICIAL MAINTENANCE COMPLETION NOTIFICATION\n\n` +
          `Report Reference: ${issue.reportReference}\n` +
          `Vehicle: ${issue.vehicle?.plateNumber} (${issue.vehicle?.model})\n` +
          `Issue Type: ${issue.issueType}\n` +
          `Severity: ${issue.severity}\n` +
          `Reported By: ${issue.reportedBy?.name}\n` +
          `Resolution Date: ${new Date().toLocaleDateString()}\n` +
          `Resolved By: ${req.user.name} (Maintenance)\n\n` +
          `RESOLUTION DETAILS:\n` +
          `Resolution Notes: ${req.body.resolutionNotes || 'Issue resolved successfully'}\n` +
          `Parts Used: ${req.body.partsUsed || 'No parts required'}\n` +
          `Labor Hours: ${req.body.laborHours || 'Not specified'}\n` +
          `Final Cost: ${req.body.finalCost || 'Not specified'}\n\n` +
          `Vehicle Status: Available for use\n` +
          `This maintenance request has been officially completed and closed.`,
        severity: 'normal',
        relatedId: issue._id,
        relatedModel: 'VehicleIssue',
      })));
    }

    // Also notify the driver who reported it with complete details
    if (issue.reportedBy?._id) {
      await Notification.create({
        recipient: issue.reportedBy._id,
        type: 'vehicle_alert',
        title: `✅ Vehicle Repair Complete - Ref: ${issue.reportReference}`,
        message: `Your maintenance report has been successfully resolved!\n\n` +
          `Report Reference: ${issue.reportReference}\n` +
          `Vehicle: ${issue.vehicle?.plateNumber}\n` +
          `Issue: ${issue.issueType} - ${issue.severity}\n` +
          `Resolved By: ${req.user.name}\n` +
          `Resolution Date: ${new Date().toLocaleDateString()}\n\n` +
          `WORK COMPLETED:\n` +
          `${req.body.resolutionNotes || 'Repairs completed successfully'}\n` +
          `Parts Used: ${req.body.partsUsed || 'No parts required'}\n` +
          `Labor Hours: ${req.body.laborHours || 'Not specified'}\n\n` +
          `Your vehicle is now ready for use. Thank you for reporting the issue!`,
        severity: 'normal',
      });
    }
  }

  res.json({ success: true, issue });
});

// ── Notifications ─────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

router.put('/notifications/read-all', ...guard, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

router.put('/notifications/:id/read', ...guard, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ success: true });
});

// ── Send Report (notify Admin + Transport) ────────────────────────
router.post('/reports/send', ...guard, async (req, res) => {
  const { reportType, startDate, endDate, recipient, summary, includeDetails } = req.body;

  try {
    // Get comprehensive data for the report
    const filter = {};
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) filter.createdAt.$lte = new Date(endDate);
    }

    const [issues, stats] = await Promise.all([
      VehicleIssue.find(filter)
        .populate('vehicle', 'plateNumber model type')
        .populate('reportedBy', 'name email')
        .populate('resolvedBy', 'name')
        .sort({ createdAt: -1 }),

      Promise.all([
        VehicleIssue.countDocuments({ status: 'resolved' }),
        VehicleIssue.countDocuments({ status: 'in_repair' }),
        VehicleIssue.countDocuments({ status: 'reported' }),
        VehicleIssue.countDocuments({ status: 'acknowledged' }),
        VehicleIssue.countDocuments({ severity: 'Critical' }),
        VehicleIssue.countDocuments({ safetyHazard: true }),
      ])
    ]);

    const [resolved, inRepair, reported, acknowledged, critical, safetyHazards] = stats;
    const totalIssues = reported + acknowledged + inRepair + resolved;

    // Build comprehensive report message
    let reportMessage = `🔧 COMPREHENSIVE MAINTENANCE REPORT\n\n`;
    reportMessage += `Report Type: ${reportType}\n`;
    reportMessage += `Period: ${startDate} to ${endDate}\n`;
    reportMessage += `Generated: ${new Date().toLocaleString()}\n`;
    reportMessage += `Generated By: ${req.user.name} (${req.user.role})\n\n`;

    reportMessage += `📊 SUMMARY STATISTICS:\n`;
    reportMessage += `• Total Issues: ${totalIssues}\n`;
    reportMessage += `• Resolved: ${resolved}\n`;
    reportMessage += `• In Progress: ${inRepair}\n`;
    reportMessage += `• Pending: ${reported + acknowledged}\n`;
    reportMessage += `• Critical Issues: ${critical}\n`;
    reportMessage += `• Safety Hazards: ${safetyHazards}\n`;
    reportMessage += `• Completion Rate: ${totalIssues > 0 ? ((resolved / totalIssues) * 100).toFixed(1) : 0}%\n\n`;

    // Add detailed issues if requested
    if (includeDetails && issues.length > 0) {
      reportMessage += `📋 DETAILED ISSUES & WORK COMPLETED:\n`;
      issues.slice(0, 10).forEach((issue, index) => {
        reportMessage += `\n${index + 1}. ${issue.reportReference || 'N/A'}\n`;
        reportMessage += `   Vehicle: ${issue.vehicle?.plateNumber || 'N/A'} (${issue.vehicle?.model || 'N/A'})\n`;
        reportMessage += `   Issue: ${issue.issueType} - ${issue.severity}\n`;
        reportMessage += `   Status: ${issue.status}\n`;
        reportMessage += `   Reported By: ${issue.reportedBy?.name || 'N/A'}\n`;
        reportMessage += `   Reported Date: ${new Date(issue.createdAt).toLocaleDateString()}\n`;

        if (issue.acknowledgedAt && issue.acknowledgedBy) {
          reportMessage += `   Acknowledged By: ${issue.acknowledgedBy.name} on ${new Date(issue.acknowledgedAt).toLocaleDateString()}\n`;
        }

        if (issue.status === 'resolved') {
          reportMessage += `   ✅ RESOLVED By: ${issue.resolvedBy?.name || 'N/A'}\n`;
          reportMessage += `   Resolution Date: ${issue.resolvedAt ? new Date(issue.resolvedAt).toLocaleDateString() : 'N/A'}\n`;

          // Show what maintenance work was done
          if (issue.resolutionNotes) {
            reportMessage += `   🔧 Work Done: ${issue.resolutionNotes}\n`;
          }
          if (issue.partsUsed) {
            reportMessage += `   🛠️ Parts Used: ${issue.partsUsed}\n`;
          }
          if (issue.laborHours) {
            reportMessage += `   ⏱️ Labor Hours: ${issue.laborHours}\n`;
          }
          if (issue.finalCost) {
            reportMessage += `   💰 Final Cost: ${issue.finalCost}\n`;
          }
        } else if (issue.status === 'in_repair') {
          reportMessage += `   🔧 Currently In Progress\n`;
        } else {
          reportMessage += `   ⏳ Pending: ${issue.status}\n`;
        }
      });

      if (issues.length > 10) {
        reportMessage += `\n... and ${issues.length - 10} more issues\n`;
      }
    }

    reportMessage += `\n📈 PERFORMANCE METRICS:\n`;
    if (resolved > 0) {
      const avgTime = issues
        .filter(i => i.resolvedAt && i.createdAt)
        .reduce((sum, i) => sum + (i.resolvedAt - i.createdAt), 0) / resolved;
      const avgHours = Math.round(avgTime / (1000 * 60 * 60));
      reportMessage += `• Average Resolution Time: ${avgHours} hours\n`;
    }

    reportMessage += `• Critical Issues Resolved: ${issues.filter(i => i.severity === 'Critical' && i.status === 'resolved').length}\n`;
    reportMessage += `• Safety Hazards Addressed: ${issues.filter(i => i.safetyHazard && i.status === 'resolved').length}\n\n`;

    reportMessage += `🔔 RECOMMENDATIONS:\n`;
    if (critical > 0) {
      reportMessage += `• ${critical} critical issues require immediate attention\n`;
    }
    if (safetyHazards > 0) {
      reportMessage += `• ${safetyHazards} safety hazards need priority handling\n`;
    }
    if (inRepair > reported + acknowledged) {
      reportMessage += `• Good progress on active repairs\n`;
    } else {
      reportMessage += `• Consider allocating more resources to reduce backlog\n`;
    }

    // Determine recipients
    const recipients = await User.find({
      role: { $in: recipient === 'Admin' ? ['ADMIN'] : recipient === 'Transport' ? ['TRANSPORT'] : ['ADMIN', 'TRANSPORT'] },
      isActive: true,
    }).select('_id');

    if (recipients.length > 0) {
      await Notification.insertMany(recipients.map(r => ({
        recipient: r._id,
        type: 'vehicle_alert',
        title: `📊 Comprehensive Maintenance Report — ${reportType}`,
        message: reportMessage,
        severity: critical > 0 ? 'high' : safetyHazards > 0 ? 'medium' : 'normal',
        relatedModel: 'VehicleIssue',
      })));
    }

    res.json({
      success: true,
      notified: recipients.length,
      reportSummary: {
        totalIssues,
        resolved,
        inProgress,
        pending: reported + acknowledged,
        critical,
        safetyHazards,
        completionRate: `${totalIssues > 0 ? ((resolved / totalIssues) * 100).toFixed(1) : 0}%`
      }
    });

  } catch (error) {
    console.error('Error sending maintenance report:', error);
    res.status(500).json({ message: 'Failed to send report: ' + error.message });
  }
});

// ── Report data ───────────────────────────────────────────────────
router.get('/reports/data', ...guard, async (req, res) => {
  const { from, to, status } = req.query;

  // Build filter based on query parameters
  const filter = {};
  if (status && status !== 'all') {
    filter.status = status;
  }

  if (from || to) {
    if (status === 'resolved') {
      filter.resolvedAt = {};
      if (from) filter.resolvedAt.$gte = new Date(from);
      if (to) filter.resolvedAt.$lte = new Date(to);
    } else {
      filter.createdAt = {};
      if (from) filter.createdAt.$gte = new Date(from);
      if (to) filter.createdAt.$lte = new Date(to);
    }
  }

  try {
    const [issues, stats] = await Promise.all([
      // Get detailed issues with all populated data
      VehicleIssue.find(filter)
        .populate('vehicle', 'plateNumber model type fuelType')
        .populate('reportedBy', 'name email')
        .populate('acknowledgedBy', 'name email')
        .populate('resolvedBy', 'name email')
        .sort({ createdAt: -1 }),

      // Get comprehensive statistics
      Promise.all([
        VehicleIssue.countDocuments({ status: 'reported' }),
        VehicleIssue.countDocuments({ status: 'acknowledged' }),
        VehicleIssue.countDocuments({ status: 'in_repair' }),
        VehicleIssue.countDocuments({ status: 'resolved' }),
        VehicleIssue.countDocuments({ severity: 'Critical' }),
        VehicleIssue.countDocuments({ severity: 'Moderate' }),
        VehicleIssue.countDocuments({ severity: 'Minor' }),
        VehicleIssue.countDocuments({ safetyHazard: true }),
        VehicleIssue.countDocuments({ priority: 'Urgent' }),
      ])
    ]);

    const [reported, acknowledged, inRepair, resolved, critical, moderate, minor, safetyHazards, urgent] = stats;

    // Calculate additional metrics
    const totalIssues = reported + acknowledged + inRepair + resolved;
    const completionRate = totalIssues > 0 ? ((resolved / totalIssues) * 100).toFixed(1) : 0;
    const avgResolutionTime = resolved > 0 ?
      issues.reduce((sum, issue) => {
        if (issue.resolvedAt && issue.createdAt) {
          return sum + (issue.resolvedAt - issue.createdAt);
        }
        return sum;
      }, 0) / resolved : 0;

    // Format issues with comprehensive information
    const formattedIssues = issues.map(issue => ({
      ...issue.toObject(),
      // Time calculations
      resolutionTimeHours: issue.resolvedAt && issue.createdAt ?
        Math.round((issue.resolvedAt - issue.createdAt) / (1000 * 60 * 60)) : null,

      // Status timeline
      reportedAt: issue.createdAt,
      acknowledgedAt: issue.acknowledgedAt,
      resolvedAt: issue.resolvedAt,

      // Vehicle information
      vehicleInfo: issue.vehicle ? {
        plateNumber: issue.vehicle.plateNumber,
        model: issue.vehicle.model,
        type: issue.vehicle.type,
        fuelType: issue.vehicle.fuelType
      } : null,

      // People information
      reportedByInfo: issue.reportedBy ? {
        name: issue.reportedBy.name,
        email: issue.reportedBy.email
      } : null,

      acknowledgedByInfo: issue.acknowledgedBy ? {
        name: issue.acknowledgedBy.name,
        email: issue.acknowledgedBy.email
      } : null,

      resolvedByInfo: issue.resolvedBy ? {
        name: issue.resolvedBy.name,
        email: issue.resolvedBy.email
      } : null,

      // Resolution details
      resolutionDetails: issue.status === 'resolved' ? {
        notes: issue.resolutionNotes,
        partsUsed: issue.partsUsed,
        laborHours: issue.laborHours,
        finalCost: issue.finalCost
      } : null
    }));

    res.json({
      issues: formattedIssues,
      statistics: {
        totalIssues,
        reported,
        acknowledged,
        inRepair,
        resolved,
        critical,
        moderate,
        minor,
        safetyHazards,
        urgent,
        completionRate: `${completionRate}%`,
        avgResolutionTime: avgResolutionTime > 0 ?
          `${Math.round(avgResolutionTime / (1000 * 60 * 60))} hours` : 'N/A'
      },
      summary: {
        totalRepairs: resolved,
        inProgress: inRepair,
        pending: reported + acknowledged,
        urgentIssues: urgent,
        safetyConcerns: safetyHazards
      }
    });

  } catch (error) {
    console.error('Error generating maintenance report:', error);
    res.status(500).json({ message: 'Failed to generate report: ' + error.message });
  }
});
router.get('/profile', ...guard, async (req, res) => res.json(req.user));
router.put('/profile', ...guard, async (req, res) => {
  const { password, role, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
