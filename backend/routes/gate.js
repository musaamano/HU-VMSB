const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const GateLog = require('../models/GateLog');
const Vehicle = require('../models/Vehicle');
const Trip = require('../models/Trip');
const Notification = require('../models/Notification');
const User = require('../models/User');

const guard = [protect, authorize('GATE_OFFICER', 'ADMIN')];

// ── Dashboard ────────────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  try {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const [vehiclesDetectedToday, universityVehicles, externalVehicles, pendingApprovals, recentActivity] = await Promise.all([
      GateLog.countDocuments({ detectionTime: { $gte: today } }),
      GateLog.countDocuments({ detectionTime: { $gte: today }, vehicle: { $ne: null } }),
      GateLog.countDocuments({ detectionTime: { $gte: today }, vehicle: null }),
      GateLog.countDocuments({ status: 'Pending' }),
      GateLog.find().populate('vehicle', 'plateNumber model').populate('driver', 'name')
        .sort({ detectionTime: -1 }).limit(10)
    ]);
    res.json({ vehiclesDetectedToday, universityVehicles, externalVehicles, pendingApprovals, recentActivity });
  } catch (err) {
    console.error('Gate dashboard error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── ALPR / Vehicle Detection ─────────────────────────────────────
router.post('/detect', ...guard, async (req, res) => {
  const { plateNumber, direction } = req.body;
  // Look up vehicle in DB
  const vehicle = await Vehicle.findOne({ plateNumber }).populate('assignedDriver', 'name');
  const log = await GateLog.create({
    plateNumber,
    vehicle: vehicle?._id,
    driver: vehicle?.assignedDriver?._id,
    direction,
    detectionMethod: 'ALPR',
    status: vehicle ? 'Pending' : 'Pending',
    officerOnDuty: req.user._id,
  });
  res.status(201).json({ log, vehicleFound: !!vehicle, vehicle });
});

// ── Vehicle Verification ─────────────────────────────────────────
router.get('/verify/:plateNumber', ...guard, async (req, res) => {
  const vehicle = await Vehicle.findOne({ plateNumber: req.params.plateNumber })
    .populate('assignedDriver', 'name licenseNumber availability');
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found in system', isRegistered: false });
  const activeTrip = await Trip.findOne({
    assignedVehicle: vehicle._id,
    status: { $in: ['assigned', 'accepted', 'started'] }
  }).populate('requestedBy', 'name');
  res.json({ vehicle, activeTrip, isRegistered: true });
});

// ── Trip Authorization ───────────────────────────────────────────
router.get('/trip-authorization', ...guard, async (req, res) => {
  const trips = await Trip.find({ status: { $in: ['assigned', 'accepted', 'started'] } })
    .populate('requestedBy', 'name department')
    .populate('assignedDriver', 'name')
    .populate('assignedVehicle', 'plateNumber model')
    .sort({ scheduledTime: 1 });
  res.json(trips);
});

router.get('/trip-authorization/:plateNumber', ...guard, async (req, res) => {
  const vehicle = await Vehicle.findOne({ plateNumber: req.params.plateNumber });
  if (!vehicle) return res.status(404).json({ message: 'Vehicle not found' });
  const trip = await Trip.findOne({
    assignedVehicle: vehicle._id,
    status: { $in: ['assigned', 'accepted', 'started'] }
  }).populate('requestedBy', 'name department').populate('assignedDriver', 'name');
  if (!trip) return res.status(404).json({ message: 'No active trip for this vehicle' });
  res.json(trip);
});

// ── Gate Logs ────────────────────────────────────────────────────
router.get('/logs', ...guard, async (req, res) => {
  const { from, to, direction, status } = req.query;
  const filter = {};
  if (direction) filter.direction = direction;
  if (status) filter.status = status;
  if (from || to) {
    filter.detectionTime = {};
    if (from) filter.detectionTime.$gte = new Date(from);
    if (to)   filter.detectionTime.$lte = new Date(to);
  }
  const logs = await GateLog.find(filter)
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .populate('officerOnDuty', 'name')
    .sort({ detectionTime: -1 });
  res.json(logs);
});

router.put('/logs/:id/approve', ...guard, async (req, res) => {
  const log = await GateLog.findByIdAndUpdate(
    req.params.id,
    { status: 'Approved', approvedBy: req.user._id },
    { new: true }
  );
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json({ success: true, log });
});

router.put('/logs/:id/reject', ...guard, async (req, res) => {
  const log = await GateLog.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected', rejectionReason: req.body.reason, approvedBy: req.user._id },
    { new: true }
  );
  if (!log) return res.status(404).json({ message: 'Log not found' });
  res.json({ success: true, log });
});

// ── Vehicle Inspection ───────────────────────────────────────────
router.post('/inspection', ...guard, async (req, res) => {
  const { plateNumber, vehicleCondition, inspectionNotes, direction } = req.body;
  const vehicle = await Vehicle.findOne({ plateNumber });
  const log = await GateLog.create({
    plateNumber, direction,
    vehicle: vehicle?._id,
    vehicleCondition, inspectionNotes,
    officerOnDuty: req.user._id,
    status: 'Approved',
    detectionMethod: 'Manual'
  });
  res.status(201).json({ success: true, log });
});

// ── Vehicle Movement ─────────────────────────────────────────────
router.get('/movement', ...guard, async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const movements = await GateLog.find({ detectionTime: { $gte: today } })
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .sort({ detectionTime: -1 });
  res.json(movements);
});

// ── Reports ──────────────────────────────────────────────────────
router.get('/reports', ...guard, async (req, res) => {
  const { from, to } = req.query;
  const filter = {};
  if (from || to) {
    filter.detectionTime = {};
    if (from) filter.detectionTime.$gte = new Date(from);
    if (to)   filter.detectionTime.$lte = new Date(to);
  }
  const [total, byDirection, byStatus] = await Promise.all([
    GateLog.countDocuments(filter),
    GateLog.aggregate([{ $match: filter }, { $group: { _id: '$direction', count: { $sum: 1 } } }]),
    GateLog.aggregate([{ $match: filter }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
  ]);
  res.json({ total, byDirection, byStatus });
});

// ── Notifications ────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// ── Profile ──────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => res.json(req.user));
router.put('/profile', ...guard, async (req, res) => {
  const { password, role, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
