const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const Trip = require('../models/Trip');
const Complaint = require('../models/Complaint');
const Notification = require('../models/Notification');
const User = require('../models/User');

const guard = [protect, authorize('USER', 'ADMIN')];

// ── Dashboard ────────────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  const [total, pending, approved, rejected, complaints] = await Promise.all([
    Trip.countDocuments({ requestedBy: req.user._id }),
    Trip.countDocuments({ requestedBy: req.user._id, status: 'pending' }),
    Trip.countDocuments({ requestedBy: req.user._id, status: { $in: ['approved', 'assigned', 'accepted', 'started', 'completed'] } }),
    Trip.countDocuments({ requestedBy: req.user._id, status: 'rejected' }),
    Complaint.countDocuments({ submittedBy: req.user._id }),
  ]);
  res.json({ totalRequests: total, pendingRequests: pending, approvedRequests: approved, rejectedRequests: rejected, totalComplaints: complaints });
});

// ── Vehicle Requests ─────────────────────────────────────────────
router.post('/requests', ...guard, async (req, res) => {
  const trip = await Trip.create({ requestedBy: req.user._id, ...req.body });

  // Notify all Transport Officers and Admins about the new request
  const notifyUsers = await User.find({ role: { $in: ['TRANSPORT', 'ADMIN'] }, isActive: true }).select('_id');
  if (notifyUsers.length > 0) {
    await Notification.insertMany(notifyUsers.map(user => ({
      recipient: user._id,
      type: 'trip_update',
      title: 'New Vehicle Request',
      message: `${req.user.name} submitted a trip request to ${trip.destination} scheduled for ${new Date(trip.scheduledTime).toLocaleString()}.`,
      severity: trip.priority === 'emergency' ? 'high' : 'normal',
      relatedId: trip._id,
      relatedModel: 'Trip',
    })));
  }

  res.status(201).json({ success: true, message: 'Request submitted', trip });
});

router.get('/requests', ...guard, async (req, res) => {
  const requests = await Trip.find({ requestedBy: req.user._id })
    .populate('assignedDriver', 'name phone')
    .populate('assignedVehicle', 'plateNumber model')
    .sort({ createdAt: -1 });
  res.json(requests);
});
router.delete('/requests/:id', ...guard, async (req, res) => {
  const trip = await Trip.findOneAndUpdate(
    { _id: req.params.id, requestedBy: req.user._id, status: 'pending' },
    { status: 'cancelled' }, { new: true }
  );
  if (!trip) return res.status(404).json({ message: 'Request not found or cannot be cancelled' });
  res.json({ success: true });
});

// ── Complaints ───────────────────────────────────────────────────
router.post('/complaints', ...guard, async (req, res) => {
  const complaint = await Complaint.create({ submittedBy: req.user._id, ...req.body });
  res.status(201).json({ success: true, message: 'Complaint submitted', complaint });
});

router.get('/complaints', ...guard, async (req, res) => {
  const complaints = await Complaint.find({ submittedBy: req.user._id }).sort({ createdAt: -1 });
  res.json(complaints);
});

// ── Notifications ────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const notifications = await Notification.find({ recipient: req.user._id })
    .sort({ createdAt: -1 }).limit(50);
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

// ── Profile ──────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => res.json(req.user));
router.put('/profile', ...guard, async (req, res) => {
  const { password, role, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
