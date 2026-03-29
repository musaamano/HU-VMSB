const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');
const Complaint = require('../models/Complaint');
const FuelRequest = require('../models/FuelRequest');
const VehicleIssue = require('../models/VehicleIssue');
const GateLog = require('../models/GateLog');
const User = require('../models/User');

const guard = [protect, authorize('DRIVER')];

// Debug route to test if driver routes are working
router.get('/test', (req, res) => {
  console.log('Driver test route hit');
  res.json({ message: 'Driver routes are working!' });
});

// ── Trips ────────────────────────────────────────────────────────
router.get('/trips/assigned', ...guard, async (req, res) => {
  const trips = await Trip.find({
    assignedDriver: req.user._id,
    status: { $in: ['assigned', 'accepted', 'started'] }
  }).populate('assignedVehicle', 'plateNumber model fuelLevel').sort({ scheduledTime: 1 });
  res.json(trips);
});

router.get('/trips/history', ...guard, async (req, res) => {
  const trips = await Trip.find({
    assignedDriver: req.user._id,
    status: { $in: ['completed', 'cancelled'] }
  }).populate('assignedVehicle', 'plateNumber model').sort({ completedAt: -1 });
  res.json(trips);
});

router.post('/trips/:id/accept', ...guard, async (req, res) => {
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, assignedDriver: req.user._id, status: 'assigned' },
    { status: 'accepted' }, { new: true }
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found or already actioned' });
  res.json({ success: true, trip });
});

router.post('/trips/:id/reject', ...guard, async (req, res) => {
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, assignedDriver: req.user._id, status: { $in: ['assigned', 'accepted'] } },
    { status: 'rejected', rejectionReason: req.body.reason }, { new: true }
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json({ success: true });
});

router.put('/trips/:id/status', ...guard, async (req, res) => {
  const { status, startOdometer, endOdometer, fuelUsed, driverNotes } = req.body;
  const update = { status };
  if (status === 'started') update.startedAt = new Date();
  if (status === 'completed') {
    update.completedAt = new Date();
    if (endOdometer) update.endOdometer = endOdometer;
    if (fuelUsed) update.fuelUsed = fuelUsed;
    if (driverNotes) update.driverNotes = driverNotes;
    // Update driver availability
    await User.findByIdAndUpdate(req.user._id, { availability: 'available' });
  }
  if (startOdometer) update.startOdometer = startOdometer;
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, assignedDriver: req.user._id }, update, { new: true }
  );
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  res.json({ success: true, trip });
});

// ── Vehicle ──────────────────────────────────────────────────────
router.get('/vehicle', ...guard, async (req, res) => {
  // 1. Check permanent assignment
  let vehicle = await Vehicle.findOne({ assignedDriver: req.user._id });
  
  // 2. If no permanent vehicle, check if driver is currently on an active trip
  if (!vehicle) {
    const activeTrip = await Trip.findOne({ 
      assignedDriver: req.user._id, 
      status: { $in: ['assigned', 'accepted', 'started'] } 
    }).populate('assignedVehicle');
    
    if (activeTrip && activeTrip.assignedVehicle) {
      vehicle = activeTrip.assignedVehicle;
    }
  }

  if (!vehicle) return res.status(404).json({ message: 'No vehicle assigned to you' });
  res.json(vehicle);
});

// ── Notifications ────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// read-all MUST come before /:id/read
router.put('/notifications/read-all', ...guard, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

router.put('/notifications/:id/read', ...guard, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ success: true });
});

// ── Fuel ─────────────────────────────────────────────────────────
router.post('/fuel/refill', ...guard, async (req, res) => {
  try {
    // 1. Check permanent assignment
    let vehicle = await Vehicle.findOne({ assignedDriver: req.user._id });

    // 2. Check active trip assignment
    if (!vehicle) {
      const activeTrip = await Trip.findOne({ 
        assignedDriver: req.user._id, 
        status: { $in: ['assigned', 'accepted', 'started'] } 
      });
      if (activeTrip && activeTrip.assignedVehicle) {
        vehicle = await Vehicle.findById(activeTrip.assignedVehicle);
      }
    }

    if (!vehicle) return res.status(404).json({ message: 'No vehicle currently assigned or on an active trip' });

    // Validate required fields
    const { fuelType, requestedAmount } = req.body;
    if (!fuelType || !requestedAmount) {
      return res.status(400).json({ message: 'fuelType and requestedAmount are required' });
    }

    const request = await FuelRequest.create({
      vehicle: vehicle._id,
      driver: req.user._id,
      fuelType,
      requestedAmount,
      ...req.body,
      status: 'Pending'
    });

    // Notify admins and fuel officers about new fuel request
    const adminsAndFuelOfficers = await User.find({
      role: { $in: ['ADMIN', 'FUEL_OFFICER'] },
      isActive: true
    });

    const notifications = adminsAndFuelOfficers.map(user => ({
      recipient: user._id,
      type: 'fuel_request',
      title: 'New Fuel Request',
      message: `Driver ${req.user.name} requested ${request.requestedAmount}L of ${request.fuelType} for vehicle ${vehicle.plateNumber}`,
      severity: request.priority === 'High' ? 'high' : 'normal',
      relatedId: request._id,
      relatedModel: 'FuelRequest'
    }));

    if (notifications.length > 0) {
      await Notification.insertMany(notifications);
    }

    res.status(201).json({ success: true, message: 'Fuel request submitted', request });
  } catch (error) {
    console.error('Fuel request error:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
});

router.get('/fuel/history', ...guard, async (req, res) => {
  const records = await FuelRequest.find({ driver: req.user._id })
    .populate('vehicle', 'plateNumber model')
    .sort({ createdAt: -1 });
  res.json(records);
});

// ── GPS Location ─────────────────────────────────────────────────
router.post('/location', ...guard, async (req, res) => {
  const { latitude, longitude } = req.body;
  // Store last known location on user document
  await User.findByIdAndUpdate(req.user._id, { lastLocation: { latitude, longitude, updatedAt: new Date() } });
  res.json({ success: true });
});

// ── Vehicle Issues ───────────────────────────────────────────────
router.post('/vehicle/issue', ...guard, async (req, res) => {
  try {
    const { issueType, severity, description } = req.body;

    // Validate required fields
    if (!issueType || !severity || !description) {
      return res.status(400).json({ message: 'issueType, severity, and description are required.' });
    }

    // Find assigned vehicle (look for permanent then active trip)
    let vehicle = await Vehicle.findOne({ assignedDriver: req.user._id });
    if (!vehicle) {
      const activeTrip = await Trip.findOne({ 
        assignedDriver: req.user._id, 
        status: { $in: ['assigned', 'accepted', 'started'] } 
      });
      if (activeTrip && activeTrip.assignedVehicle) {
        vehicle = await Vehicle.findById(activeTrip.assignedVehicle);
      }
    }

    // Map severity to priority enum
    const priorityMap = { Critical: 'Urgent', Moderate: 'High', Minor: 'Low' };
    const priority = priorityMap[severity] || 'Medium';

    // Create the issue
    const issueData = {
      reportedBy: req.user._id,
      issueType,
      severity,
      description,
      status: 'reported',
      priority,
      maintenanceOfficeNotified: true,
      maintenanceOfficeNotifiedAt: new Date(),
    };
    if (vehicle) issueData.vehicle = vehicle._id;

    const issue = await VehicleIssue.create(issueData);

    // Mark vehicle as Maintenance if Critical
    if (vehicle && severity === 'Critical') {
      await Vehicle.findByIdAndUpdate(vehicle._id, { status: 'Maintenance' });
    }

    // Notify Maintenance + Transport Officers
    const recipients = await User.find({
      role: { $in: ['MAINTENANCE', 'TRANSPORT'] },
      isActive: true,
    }).select('_id');

    if (recipients.length > 0) {
      await Notification.insertMany(recipients.map(r => ({
        recipient: r._id,
        type: 'vehicle_alert',
        title: `Maintenance Request — ${severity} Severity`,
        message: `Driver ${req.user.name} reported a ${issueType} issue${vehicle ? ` on vehicle ${vehicle.plateNumber} (${vehicle.model})` : ''}. Severity: ${severity}. ${description.slice(0, 100)}`,
        severity: severity === 'Critical' ? 'high' : severity === 'Moderate' ? 'medium' : 'normal',
        relatedId: issue._id,
        relatedModel: 'VehicleIssue',
      })));
    }

    // Confirm to driver
    await Notification.create({
      recipient: req.user._id,
      type: 'vehicle_alert',
      title: 'Maintenance Request Submitted',
      message: `Your ${issueType} issue report has been submitted. Priority: ${priority}. The maintenance team has been notified.`,
      severity: 'normal',
    });

    res.status(201).json({
      success: true,
      message: `Issue reported. ${recipients.length} officer(s) notified.`,
      issue,
    });
  } catch (err) {
    console.error('Vehicle issue error:', err.message);
    res.status(500).json({ message: err.message || 'Internal server error' });
  }
});

// Get driver's reported issues with status tracking
router.get('/vehicle/issues', ...guard, async (req, res) => {
  const issues = await VehicleIssue.find({ reportedBy: req.user._id })
    .populate('vehicle', 'plateNumber model')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(issues);
});

// ── Complaints ───────────────────────────────────────────────────
router.get('/complaints', ...guard, async (req, res) => {
  const complaints = await Complaint.find({ againstDriver: req.user._id })
    .populate('submittedBy', 'name').sort({ createdAt: -1 });
  res.json(complaints);
});

router.post('/complaints/:id/respond', ...guard, async (req, res) => {
  const complaint = await Complaint.findOneAndUpdate(
    { _id: req.params.id, againstDriver: req.user._id },
    { response: req.body.response, status: 'responded', respondedBy: req.user._id, respondedAt: new Date() },
    { new: true }
  );
  if (!complaint) return res.status(404).json({ message: 'Complaint not found' });
  res.json({ success: true, complaint });
});

router.post('/complaints/submit', ...guard, async (req, res) => {
  const categoryMap = {
    general: 'General',
    vehicle: 'Vehicle Condition',
    schedule: 'Schedule Concern',
    passenger: 'Passenger Issue',
    route: 'Route Issue',
    safety: 'Safety Concern',
    equipment: 'Equipment Issue',
    'driver behavior': 'Driver Behavior',
    'fuel issue': 'Fuel Issue',
    other: 'Other'
  };

  const priorityMap = {
    low: 'Low',
    normal: 'Medium',
    high: 'High',
    urgent: 'Urgent'
  };

  const { category, priority, ...rest } = req.body;
  const complaint = await Complaint.create({
    submittedBy: req.user._id,
    ...rest,
    category: categoryMap[category] || 'Other',
    priority: priorityMap[priority] || 'Medium',
  });
  res.status(201).json({ success: true, message: 'Complaint submitted', complaint });
});

// ── Gate Verification ────────────────────────────────────────────
router.post('/gate/exit', ...guard, async (req, res) => {
  const log = await GateLog.create({
    direction: 'Exit', driver: req.user._id,
    detectionMethod: 'Manual', status: 'Pending', ...req.body
  });
  res.status(201).json({ success: true, message: 'Exit logged', log });
});

router.post('/gate/entry', ...guard, async (req, res) => {
  const log = await GateLog.create({
    direction: 'Entry', driver: req.user._id,
    detectionMethod: 'Manual', status: 'Pending', ...req.body
  });
  res.status(201).json({ success: true, message: 'Entry logged', log });
});

// ── Availability ─────────────────────────────────────────────────
router.get('/availability', ...guard, async (req, res) => {
  res.json({ status: req.user.availability });
});

router.put('/availability', ...guard, async (req, res) => {
  const user = await User.findByIdAndUpdate(req.user._id, { availability: req.body.status }, { new: true });
  res.json({ success: true, status: user.availability });
});

// ── Profile ──────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => {
  res.json(req.user);
});

router.put('/profile', ...guard, async (req, res) => {
  const { password, role, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
