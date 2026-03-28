const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const FuelRequest = require('../models/FuelRequest');
const Complaint = require('../models/Complaint');
const GateLog = require('../models/GateLog');
const guard = [protect, authorize('ADMIN')];

// ── Dashboard Overview ──────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  const [totalVehicles, availableVehicles, totalDrivers, activeDrivers,
         pendingRequests, activeTrips, totalUsers, openComplaints] = await Promise.all([
    Vehicle.countDocuments(),
    Vehicle.countDocuments({ status: 'Available' }),
    User.countDocuments({ role: 'DRIVER' }),
    User.countDocuments({ role: 'DRIVER', availability: 'on_trip' }),
    Trip.countDocuments({ status: 'pending' }),
    Trip.countDocuments({ status: { $in: ['assigned', 'accepted', 'started'] } }),
    User.countDocuments({ role: 'USER' }),
    Complaint.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
  ]);
  res.json({ totalVehicles, availableVehicles, totalDrivers, activeDrivers,
             pendingRequests, activeTrips, totalUsers, openComplaints });
});

// ── Users ───────────────────────────────────────────────────────
router.get('/users', ...guard, async (req, res) => {
  const { role, search } = req.query;
  const filter = {};
  if (role) filter.role = role;
  if (search) filter.$or = [
    { name: new RegExp(search, 'i') },
    { username: new RegExp(search, 'i') },
    { email: new RegExp(search, 'i') }
  ];
  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });
  res.json(users);
});

router.post('/users', ...guard, async (req, res) => {
  const exists = await User.findOne({ username: req.body.username });
  if (exists) return res.status(400).json({ message: 'Username already exists' });
  const user = await User.create(req.body);
  res.status(201).json({ message: 'User created', user: { ...user.toObject(), password: undefined } });
});

router.put('/users/:id', ...guard, async (req, res) => {
  const { password, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.params.id, data, { new: true }).select('-password');
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

router.delete('/users/:id', ...guard, async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { isActive: false });
  res.json({ message: 'User deactivated' });
});

// ── Vehicles ────────────────────────────────────────────────────
router.get('/vehicles', ...guard, async (req, res) => {
  const vehicles = await Vehicle.find().populate('assignedDriver', 'name username').sort({ createdAt: -1 });
  res.json(vehicles);
});

router.post('/vehicles', ...guard, async (req, res) => {
  const vehicle = await Vehicle.create(req.body);
  res.status(201).json(vehicle);
});

router.put('/vehicles/:id', ...guard, async (req, res) => {
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json(vehicle);
});

router.delete('/vehicles/:id', ...guard, async (req, res) => {
  await Vehicle.findByIdAndDelete(req.params.id);
  res.json({ message: 'Vehicle deleted' });
});

// ── Drivers ─────────────────────────────────────────────────────
router.get('/drivers', ...guard, async (req, res) => {
  const drivers = await User.find({ role: 'DRIVER' }).select('-password').sort({ name: 1 });
  res.json(drivers);
});

// ── Reports ─────────────────────────────────────────────────────
router.get('/reports/trips', ...guard, async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.scheduledTime = {};
    if (from) filter.scheduledTime.$gte = new Date(from);
    if (to)   filter.scheduledTime.$lte = new Date(to);
  }
  const trips = await Trip.find(filter)
    .populate('requestedBy', 'name')
    .populate('assignedDriver', 'name')
    .populate('assignedVehicle', 'plateNumber model')
    .sort({ scheduledTime: -1 });
  res.json(trips);
});

router.get('/reports/fuel', ...guard, async (req, res) => {
  const records = await FuelRequest.find({ status: 'Dispensed' })
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .sort({ dispensedAt: -1 });
  res.json(records);
});

router.get('/reports/driver-performance', ...guard, async (req, res) => {
  const drivers = await User.find({ role: 'DRIVER' }).select('-password');
  const performance = await Promise.all(drivers.map(async (d) => {
    const [completed, cancelled, complaints] = await Promise.all([
      Trip.countDocuments({ assignedDriver: d._id, status: 'completed' }),
      Trip.countDocuments({ assignedDriver: d._id, status: 'cancelled' }),
      Complaint.countDocuments({ againstDriver: d._id }),
    ]);
    return { driver: d, completedTrips: completed, cancelledTrips: cancelled, complaints };
  }));
  res.json(performance);
});

router.get('/reports/gate', ...guard, async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.detectionTime = {};
    if (from) filter.detectionTime.$gte = new Date(from);
    if (to)   filter.detectionTime.$lte = new Date(to);
  }
  const logs = await GateLog.find(filter)
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .sort({ detectionTime: -1 });
  res.json(logs);
});

// ── Broadcast notification to role groups ───────────────────────
router.post('/broadcast', ...guard, async (req, res) => {
  const { title, message, roles } = req.body;
  if (!title || !message || !roles?.length) {
    return res.status(400).json({ message: 'title, message, and roles are required' });
  }
  const Notification = require('../models/Notification');
  const recipients = await User.find({ role: { $in: roles }, isActive: true }).select('_id');
  if (recipients.length === 0) return res.status(404).json({ message: 'No active users found for selected roles' });
  await Notification.insertMany(recipients.map(r => ({
    recipient: r._id,
    type: 'system',
    title,
    message,
    severity: 'normal',
  })));
  res.json({ success: true, notified: recipients.length });
});

// ── Fuel requests (admin view) ───────────────────────────────────
router.get('/fuel-requests', ...guard, async (req, res) => {
  const requests = await FuelRequest.find()
    .populate('vehicle', 'plateNumber model fuelType')
    .populate('driver', 'name')
    .populate('trip', 'destination scheduledTime')
    .sort({ createdAt: -1 });
  res.json(requests);
});

router.put('/fuel-requests/:id/approve', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  const code = `AUTH-${Date.now().toString(36).toUpperCase()}`;
  const request = await FuelRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'Approved', authorizationCode: code, authorizedBy: req.user._id },
    { new: true }
  ).populate('driver', 'name _id');
  if (!request) return res.status(404).json({ message: 'Request not found' });
  // Notify driver
  await Notification.create({
    recipient: request.driver._id,
    type: 'fuel_alert',
    title: 'Fuel Request Approved',
    message: `Your fuel request has been approved by Admin. Authorization code: ${code}. Proceed to the fuel station.`,
    severity: 'normal'
  });
  res.json({ success: true, request });
});

router.put('/fuel-requests/:id/reject', ...guard, async (req, res) => {
  const request = await FuelRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected', rejectionReason: req.body.reason, authorizedBy: req.user._id },
    { new: true }
  );
  if (!request) return res.status(404).json({ message: 'Request not found' });
  res.json({ success: true, request });
});

// ── Fuel Records ─────────────────────────────────────────────────
router.get('/fuel-records', ...guard, async (req, res) => {
  const records = await FuelRequest.find({ status: 'Dispensed' })
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .sort({ dispensedAt: -1 });
  res.json(records);
});

router.post('/fuel-records', ...guard, async (req, res) => {
  const record = await FuelRequest.create({ ...req.body, status: 'Dispensed', dispensedBy: req.user._id, dispensedAt: new Date() });
  res.status(201).json(record);
});

router.delete('/fuel-records/:id', ...guard, async (req, res) => {
  await FuelRequest.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ── Complaints ──────────────────────────────────────────────────
router.get('/complaints', ...guard, async (req, res) => {
  const complaints = await Complaint.find()
    .populate('submittedBy', 'name role')
    .populate('againstDriver', 'name')
    .sort({ createdAt: -1 });
  res.json(complaints);
});

router.put('/complaints/:id', ...guard, async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(complaint);
});

// ── Admin Trip Control ──────────────────────────────────────────
router.put('/trips/:id/cancel', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { status: 'cancelled', rejectionReason: req.body.reason || 'Cancelled by Admin' },
    { new: true }
  ).populate('requestedBy', 'name _id').populate('assignedDriver', 'name _id').populate('assignedVehicle', 'plateNumber');

  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  // Free up driver and vehicle
  if (trip.assignedDriver) await User.findByIdAndUpdate(trip.assignedDriver._id, { availability: 'available' });
  if (trip.assignedVehicle) await Vehicle.findByIdAndUpdate(trip.assignedVehicle._id, { status: 'Available' });

  // Notify requester and driver
  const notifs = [];
  if (trip.requestedBy?._id) notifs.push({ recipient: trip.requestedBy._id, type: 'approval', title: 'Trip Cancelled by Admin', message: `Your trip to ${trip.destination} has been cancelled by the Admin. Reason: ${req.body.reason || 'Administrative decision'}`, severity: 'medium' });
  if (trip.assignedDriver?._id) notifs.push({ recipient: trip.assignedDriver._id, type: 'trip_update', title: 'Trip Cancelled', message: `Your assigned trip to ${trip.destination} has been cancelled by Admin.`, severity: 'medium' });
  if (notifs.length) await Notification.insertMany(notifs);

  res.json({ success: true, trip });
});

router.put('/trips/:id/assign', ...guard, async (req, res) => {
  const { driverId, vehicleId } = req.body;
  const Notification = require('../models/Notification');
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { assignedDriver: driverId, assignedVehicle: vehicleId, status: 'assigned', approvedBy: req.user._id },
    { new: true }
  ).populate('requestedBy', 'name _id');

  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  await Promise.all([
    User.findByIdAndUpdate(driverId, { availability: 'on_trip' }),
    Vehicle.findByIdAndUpdate(vehicleId, { status: 'Assigned', assignedDriver: driverId }),
  ]);
  if (driverId) await Notification.create({ recipient: driverId, type: 'trip_assignment', title: 'Trip Assigned by Admin', message: `Admin assigned you a trip to ${trip.destination}.`, severity: 'normal' });
  res.json({ success: true, trip });
});

// ── Admin Maintenance Control ───────────────────────────────────
router.get('/maintenance/issues', ...guard, async (req, res) => {
  const VehicleIssue = require('../models/VehicleIssue');
  const issues = await VehicleIssue.find()
    .populate('vehicle', 'plateNumber model')
    .populate('reportedBy', 'name')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(issues);
});

router.put('/maintenance/issues/:id', ...guard, async (req, res) => {
  const VehicleIssue = require('../models/VehicleIssue');
  const Notification = require('../models/Notification');
  const update = { ...req.body };
  if (req.body.status === 'resolved') { update.resolvedAt = new Date(); update.resolvedBy = req.user._id; }

  const issue = await VehicleIssue.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('vehicle', 'plateNumber model _id')
    .populate('reportedBy', 'name _id');

  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (req.body.status === 'resolved' && issue.vehicle?._id) {
    await Vehicle.findByIdAndUpdate(issue.vehicle._id, { status: 'Available' });
    if (issue.reportedBy?._id) {
      await Notification.create({ recipient: issue.reportedBy._id, type: 'vehicle_alert', title: 'Vehicle Repair Complete (Admin)', message: `Your ${issue.issueType} issue on ${issue.vehicle?.plateNumber} has been resolved by Admin. ${req.body.resolutionNotes || ''}`, severity: 'normal' });
    }
  }
  res.json({ success: true, issue });
});

// ── Admin Password Reset ────────────────────────────────────────
router.put('/users/:id/reset-password', ...guard, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword || newPassword.length < 6) return res.status(400).json({ message: 'Password must be at least 6 characters' });
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found' });
  user.password = newPassword;
  await user.save();
  res.json({ success: true, message: `Password reset for ${user.name}` });
});

// ── Admin Notifications ─────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

router.put('/notifications/read-all', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

router.put('/notifications/:id/read', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ success: true });
});

module.exports = router;
