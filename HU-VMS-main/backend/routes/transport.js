const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Trip = require('../models/Trip');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');

const guard = [protect, authorize('TRANSPORT', 'ADMIN')];

// ── Dashboard ────────────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  const [pendingRequests, activeTrips, availableVehicles, driversOnDuty, openComplaints] = await Promise.all([
    Trip.countDocuments({ status: 'pending' }),
    Trip.countDocuments({ status: { $in: ['assigned', 'accepted', 'started'] } }),
    Vehicle.countDocuments({ status: 'Available' }),
    User.countDocuments({ role: 'DRIVER', availability: 'on_trip' }),
    Complaint.countDocuments({ status: { $in: ['pending', 'under_review'] } }),
  ]);
  const recentTrips = await Trip.find()
    .populate('requestedBy', 'name')
    .populate('assignedDriver', 'name')
    .populate('assignedVehicle', 'plateNumber model')
    .sort({ createdAt: -1 }).limit(5);
  res.json({ pendingRequests, activeTrips, availableVehicles, driversOnDuty, openComplaints, recentTrips });
});

// ── Requests ─────────────────────────────────────────────────────
router.get('/requests', ...guard, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await Trip.find(filter)
    .populate('requestedBy', 'name email department')
    .populate('assignedDriver', 'name phone')
    .populate('assignedVehicle', 'plateNumber model')
    .sort({ createdAt: -1 });
  res.json(requests);
});

router.put('/requests/:id/reject', ...guard, async (req, res) => {
  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { status: 'rejected', rejectionReason: req.body.reason, approvedBy: req.user._id },
    { new: true }
  );
  if (!trip) return res.status(404).json({ message: 'Request not found' });
  await Notification.create({
    recipient: trip.requestedBy,
    type: 'approval',
    title: 'Trip Request Rejected',
    message: `Your trip to ${trip.destination} was rejected. Reason: ${req.body.reason}`,
    severity: 'medium',
  });
  res.json({ success: true, trip });
});

// ── Trips ─────────────────────────────────────────────────────────
router.get('/trips', ...guard, async (req, res) => {
  const trips = await Trip.find()
    .populate('requestedBy', 'name')
    .populate('assignedDriver', 'name availability')
    .populate('assignedVehicle', 'plateNumber model status')
    .sort({ scheduledTime: 1 });
  res.json(trips);
});

// Assign driver+vehicle — notifies driver AND requester
router.put('/trips/:id/assign', ...guard, async (req, res) => {
  const { driverId, vehicleId } = req.body;
  const [driver, vehicle, tripBeforeAssign] = await Promise.all([
    User.findById(driverId),
    Vehicle.findById(vehicleId),
    Trip.findById(req.params.id).populate('requestedBy', 'name'),
  ]);
  if (!driver || driver.role !== 'DRIVER') return res.status(400).json({ message: 'Invalid driver' });
  if (!vehicle) return res.status(400).json({ message: 'Invalid vehicle' });
  if (!tripBeforeAssign) return res.status(404).json({ message: 'Trip not found' });

  const trip = await Trip.findByIdAndUpdate(
    req.params.id,
    { assignedDriver: driverId, assignedVehicle: vehicleId, status: 'assigned', approvedBy: req.user._id },
    { new: true }
  ).populate('requestedBy', 'name _id').populate('assignedDriver', 'name').populate('assignedVehicle', 'plateNumber model');

  if (!trip) return res.status(404).json({ message: 'Trip not found' });

  await Promise.all([
    User.findByIdAndUpdate(driverId, { availability: 'on_trip' }),
    Vehicle.findByIdAndUpdate(vehicleId, { status: 'Assigned', assignedDriver: driverId }),
  ]);

  // Notify driver
  await Notification.create({
    recipient: driverId,
    type: 'trip_assignment',
    title: 'New Trip Assigned',
    message: `You have been assigned a trip to ${trip.destination} scheduled for ${new Date(trip.scheduledTime).toLocaleString()}.`,
    severity: 'normal',
  });

  // Notify requester
  const requesterId = tripBeforeAssign?.requestedBy?._id || tripBeforeAssign?.requestedBy || trip.requestedBy?._id || trip.requestedBy;
  if (requesterId) {
    await Notification.create({
      recipient: requesterId,
      type: 'approval',
      title: 'Trip Request Approved',
      message: `Your trip to ${trip.destination} has been approved and is now assigned. Vehicle: ${vehicle.plateNumber}, Driver: ${driver.name}.`,
      severity: 'normal',
      relatedId: trip._id,
      relatedModel: 'Trip',
    });
  }

  res.json({ success: true, trip });
});

router.put('/trips/:id/status', ...guard, async (req, res) => {
  const { status } = req.body;
  const update = { status };
  if (status === 'started') update.startedAt = new Date();
  if (status === 'completed') update.completedAt = new Date();
  const trip = await Trip.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!trip) return res.status(404).json({ message: 'Trip not found' });
  if (status === 'completed') {
    if (trip.assignedDriver) await User.findByIdAndUpdate(trip.assignedDriver, { availability: 'available' });
    if (trip.assignedVehicle) await Vehicle.findByIdAndUpdate(trip.assignedVehicle, { status: 'Available' });
  }
  res.json({ success: true, trip });
});

// ── Vehicles (transport-accessible) ──────────────────────────────
router.get('/vehicles', ...guard, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status: new RegExp(`^${status}$`, 'i') } : {};
  const vehicles = await Vehicle.find(filter)
    .populate('assignedDriver', 'name availability')
    .sort({ createdAt: -1 });
  res.json(vehicles);
});

// Permanently assign a driver to a vehicle (1:1 link)
router.put('/vehicles/:id/assign-driver', ...guard, async (req, res) => {
  const { driverId } = req.body;
  const driver = await User.findById(driverId);
  if (!driver || driver.role !== 'DRIVER') return res.status(400).json({ message: 'Invalid driver' });

  // Remove this driver from any previously assigned vehicle
  await Vehicle.updateMany({ assignedDriver: driverId }, { $unset: { assignedDriver: '' } });

  const vehicle = await Vehicle.findByIdAndUpdate(
    req.params.id,
    { assignedDriver: driverId },
    { new: true }
  ).populate('assignedDriver', 'name availability');

  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  res.json({ success: true, vehicle });
});

// ── Drivers ───────────────────────────────────────────────────────
router.get('/drivers', ...guard, async (req, res) => {
  const drivers = await User.find({ role: 'DRIVER', isActive: true }).select('-password');
  const driverIds = drivers.map(d => d._id);
  const vehicles = await Vehicle.find({ assignedDriver: { $in: driverIds } }).select('plateNumber model assignedDriver');
  const vehicleMap = {};
  vehicles.forEach(v => { vehicleMap[v.assignedDriver.toString()] = v; });
  const result = drivers.map(d => ({ ...d.toObject(), assignedVehicle: vehicleMap[d._id.toString()] || null }));
  res.json(result);
});

// ── Vehicle Issues / Maintenance ──────────────────────────────────
router.get('/vehicle-issues', ...guard, async (req, res) => {
  const VehicleIssue = require('../models/VehicleIssue');
  const issues = await VehicleIssue.find()
    .populate('vehicle', 'plateNumber model')
    .populate('reportedBy', 'name')
    .populate('resolvedBy', 'name')
    .sort({ createdAt: -1 });
  res.json(issues);
});

router.put('/vehicle-issues/:id', ...guard, async (req, res) => {
  const VehicleIssue = require('../models/VehicleIssue');
  const issue = await VehicleIssue.findByIdAndUpdate(
    req.params.id,
    { ...req.body, ...(req.body.status === 'resolved' ? { resolvedAt: new Date(), resolvedBy: req.user._id } : {}) },
    { new: true }
  ).populate('vehicle', 'plateNumber model').populate('reportedBy', 'name');
  if (!issue) return res.status(404).json({ message: 'Issue not found' });
  if (req.body.status === 'resolved' && issue.vehicle) {
    await Vehicle.findByIdAndUpdate(issue.vehicle._id, { status: 'Available' });
  }
  res.json({ success: true, issue });
});

// ── Notifications — IMPORTANT: static routes BEFORE :id routes ───
router.get('/notifications', ...guard, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// read-all MUST come before /:id/read to avoid Express matching 'read-all' as an id
router.put('/notifications/read-all', ...guard, async (req, res) => {
  await Notification.updateMany({ recipient: req.user._id, read: false }, { read: true });
  res.json({ success: true });
});

router.put('/notifications/:id/read', ...guard, async (req, res) => {
  await Notification.findOneAndUpdate({ _id: req.params.id, recipient: req.user._id }, { read: true });
  res.json({ success: true });
});

// ── Complaints ────────────────────────────────────────────────────
router.get('/complaints', ...guard, async (req, res) => {
  const complaints = await Complaint.find()
    .populate('submittedBy', 'name role')
    .populate('againstDriver', 'name')
    .sort({ createdAt: -1 });
  res.json(complaints);
});

router.put('/complaints/:id/respond', ...guard, async (req, res) => {
  const complaint = await Complaint.findByIdAndUpdate(
    req.params.id,
    { response: req.body.response, status: 'responded', respondedBy: req.user._id, respondedAt: new Date() },
    { new: true }
  );
  res.json({ success: true, complaint });
});

// ── Vehicle Tracking ──────────────────────────────────────────────
router.get('/tracking', ...guard, async (req, res) => {
  const activeDrivers = await User.find({ role: 'DRIVER', availability: 'on_trip' })
    .select('name lastLocation availability');
  res.json(activeDrivers);
});

// ── Reports ───────────────────────────────────────────────────────
router.get('/reports', ...guard, async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.scheduledTime = {};
    if (from) filter.scheduledTime.$gte = new Date(from);
    if (to) filter.scheduledTime.$lte = new Date(to);
  }
  const [trips, byStatus] = await Promise.all([
    Trip.find(filter)
      .populate('assignedDriver', 'name')
      .populate('assignedVehicle', 'plateNumber')
      .sort({ scheduledTime: -1 }),
    Trip.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ trips, byStatus });
});

module.exports = router;
