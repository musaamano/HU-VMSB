const router = require('express').Router();
const { protect, authorize } = require('../middleware/auth');
const FuelRequest = require('../models/FuelRequest');
const FuelInventory = require('../models/FuelInventory');
const Vehicle = require('../models/Vehicle');
const Notification = require('../models/Notification');

const guard = [protect, authorize('FUEL_OFFICER', 'ADMIN')];

// ── Dashboard ────────────────────────────────────────────────────
router.get('/dashboard', ...guard, async (req, res) => {
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const [pendingRequests, dispensedToday, inventory, totalTransactions] = await Promise.all([
    FuelRequest.countDocuments({ status: 'Pending' }),
    FuelRequest.find({ status: 'Dispensed', dispensedAt: { $gte: today } }),
    FuelInventory.find(),
    FuelRequest.countDocuments({ status: 'Dispensed' }),
  ]);
  const fuelDispensedToday = dispensedToday.reduce((sum, r) => sum + (r.dispensedAmount || 0), 0);
  res.json({ pendingRequests, fuelDispensedToday, inventory, totalTransactions });
});

// ── Fuel Requests ────────────────────────────────────────────────
router.get('/requests', ...guard, async (req, res) => {
  const { status } = req.query;
  const filter = status ? { status } : {};
  const requests = await FuelRequest.find(filter)
    .populate('vehicle', 'plateNumber model fuelType')
    .populate('driver', 'name')
    .sort({ createdAt: -1 });
  res.json(requests);
});

router.put('/requests/:id/approve', ...guard, async (req, res) => {
  const code = `AUTH-${Date.now().toString(36).toUpperCase()}`;
  const request = await FuelRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'Approved', authorizationCode: code, authorizedBy: req.user._id },
    { new: true }
  ).populate('driver', 'name').populate('vehicle', 'plateNumber');
  if (!request) return res.status(404).json({ message: 'Request not found' });

  // Notify driver about approval
  await Notification.create({
    recipient: request.driver._id,
    type: 'fuel_alert',
    title: 'Fuel Request Approved',
    message: `Your fuel request has been approved. Auth code: ${code}`,
    severity: 'normal',
    relatedId: request._id,
    relatedModel: 'FuelRequest'
  });

  // Notify fuel officers about approved request ready for dispensing
  const fuelOfficers = await User.find({
    role: 'FUEL_OFFICER',
    isActive: true
  });

  const fuelNotifications = fuelOfficers.map(officer => ({
    recipient: officer._id,
    type: 'fuel_request',
    title: 'Fuel Request Approved - Ready for Dispensing',
    message: `Fuel request ${request.requestId} for ${request.requestedAmount}L ${request.fuelType} has been approved. Vehicle: ${request.vehicle.plateNumber}`,
    severity: 'normal',
    relatedId: request._id,
    relatedModel: 'FuelRequest'
  }));

  if (fuelNotifications.length > 0) {
    await Notification.insertMany(fuelNotifications);
  }

  res.json({ success: true, request });
});

router.put('/requests/:id/reject', ...guard, async (req, res) => {
  const request = await FuelRequest.findByIdAndUpdate(
    req.params.id,
    { status: 'Rejected', rejectionReason: req.body.reason, authorizedBy: req.user._id },
    { new: true }
  ).populate('driver', 'name');
  if (!request) return res.status(404).json({ message: 'Request not found' });

  // Notify driver about rejection
  await Notification.create({
    recipient: request.driver._id,
    type: 'fuel_alert',
    title: 'Fuel Request Rejected',
    message: `Your fuel request has been rejected. Reason: ${req.body.reason || 'No reason provided'}`,
    severity: 'high',
    relatedId: request._id,
    relatedModel: 'FuelRequest'
  });

  res.json({ success: true, request });
});

// ── Dispense Fuel ────────────────────────────────────────────────
router.post('/dispense', ...guard, async (req, res) => {
  const { requestId, dispensedAmount, vehicleId } = req.body;
  const request = await FuelRequest.findById(requestId);
  if (!request || request.status !== 'Approved')
    return res.status(400).json({ message: 'Request not found or not approved' });

  // Deduct from inventory
  const inventory = await FuelInventory.findOne({ fuelType: request.fuelType });
  if (!inventory || inventory.currentStock < dispensedAmount)
    return res.status(400).json({ message: 'Insufficient fuel stock' });

  inventory.currentStock -= dispensedAmount;
  await inventory.save();

  // Update request
  request.status = 'Dispensed';
  request.dispensedAmount = dispensedAmount;
  request.dispensedBy = req.user._id;
  request.dispensedAt = new Date();
  await request.save();

  // Update vehicle fuel level
  if (vehicleId) {
    const vehicle = await Vehicle.findById(vehicleId);
    if (vehicle) {
      const newLevel = Math.min(100, vehicle.fuelLevel + (dispensedAmount / 50) * 100);
      await Vehicle.findByIdAndUpdate(vehicleId, { fuelLevel: Math.round(newLevel) });
    }
  }

  // Low stock alert
  if (inventory.currentStock <= inventory.lowStockAlert) {
    console.log(`⚠️  Low stock alert: ${request.fuelType} at ${inventory.currentStock}L`);
  }

  // Send notifications to admin and driver
  const populatedRequest = await FuelRequest.findById(requestId)
    .populate('driver', 'name')
    .populate('vehicle', 'plateNumber')
    .populate('authorizedBy', 'name');

  // Notify driver
  await Notification.create({
    recipient: populatedRequest.driver._id,
    type: 'fuel_alert',
    title: 'Fuel Dispensed Successfully',
    message: `${dispensedAmount}L of ${request.fuelType} has been dispensed to your vehicle ${populatedRequest.vehicle.plateNumber}`,
    severity: 'normal',
    relatedId: request._id,
    relatedModel: 'FuelRequest'
  });

  // Notify admins about fuel dispensing completion
  const admins = await User.find({
    role: 'ADMIN',
    isActive: true
  });

  const adminNotifications = admins.map(admin => ({
    recipient: admin._id,
    type: 'fuel_request',
    title: 'Fuel Dispensing Completed',
    message: `Fuel request ${populatedRequest.requestId} completed: ${dispensedAmount}L ${request.fuelType} dispensed to ${populatedRequest.vehicle.plateNumber} by ${req.user.name}`,
    severity: 'normal',
    relatedId: request._id,
    relatedModel: 'FuelRequest'
  }));

  if (adminNotifications.length > 0) {
    await Notification.insertMany(adminNotifications);
  }

  res.json({ success: true, message: 'Fuel dispensed successfully', request: populatedRequest });
});

// ── Inventory ────────────────────────────────────────────────────
router.get('/inventory', ...guard, async (req, res) => {
  const inventory = await FuelInventory.find();
  res.json(inventory);
});

router.put('/inventory/:fuelType/refill', ...guard, async (req, res) => {
  const { amount } = req.body;
  const inventory = await FuelInventory.findOneAndUpdate(
    { fuelType: req.params.fuelType },
    { $inc: { currentStock: amount }, lastRefilled: new Date(), lastRefilledBy: req.user._id },
    { new: true, upsert: true }
  );
  res.json({ success: true, inventory });
});

// ── Transaction History ──────────────────────────────────────────
router.get('/transactions', ...guard, async (req, res) => {
  const { from, to, fuelType } = req.query;
  const filter = { status: 'Dispensed' };
  if (fuelType) filter.fuelType = fuelType;
  if (from || to) {
    filter.dispensedAt = {};
    if (from) filter.dispensedAt.$gte = new Date(from);
    if (to) filter.dispensedAt.$lte = new Date(to);
  }
  const transactions = await FuelRequest.find(filter)
    .populate('vehicle', 'plateNumber model')
    .populate('driver', 'name')
    .populate('dispensedBy', 'name')
    .sort({ dispensedAt: -1 });
  res.json(transactions);
});

// ── Reports ──────────────────────────────────────────────────────
router.get('/reports', ...guard, async (req, res) => {
  const byType = await FuelRequest.aggregate([
    { $match: { status: 'Dispensed' } },
    { $group: { _id: '$fuelType', totalDispensed: { $sum: '$dispensedAmount' }, count: { $sum: 1 } } }
  ]);
  const byVehicle = await FuelRequest.aggregate([
    { $match: { status: 'Dispensed' } },
    { $group: { _id: '$vehicle', totalDispensed: { $sum: '$dispensedAmount' } } },
    { $sort: { totalDispensed: -1 } }, { $limit: 10 }
  ]);
  res.json({ byType, byVehicle });
});

// ── Notifications ────────────────────────────────────────────────
router.get('/notifications', ...guard, async (req, res) => {
  const Notification = require('../models/Notification');
  const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 }).limit(50);
  res.json(notifications);
});

// ── Profile ──────────────────────────────────────────────────────
router.get('/profile', ...guard, async (req, res) => res.json(req.user));
router.put('/profile', ...guard, async (req, res) => {
  const User = require('../models/User');
  const { password, role, ...data } = req.body;
  const user = await User.findByIdAndUpdate(req.user._id, data, { new: true }).select('-password');
  res.json(user);
});

module.exports = router;
