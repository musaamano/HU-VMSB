const router = require('express').Router();
const Complaint = require('../models/Complaint');
const { authMiddleware } = require('../middleware/auth');

// GET /api/complaints — all complaints (transport officer)
router.get('/', authMiddleware, async (req, res) => {
  try {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/complaints — submit a complaint (any user)
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { vehicle, driver, tripId, category, description, priority } = req.body;
    const complaint = new Complaint({
      sender: req.user.name,
      senderUsername: req.user.username,
      role: req.user.role === 'DRIVER' ? 'Driver' : 'User',
      vehicle: vehicle || '',
      driver: driver || '',
      tripId: tripId || '',
      category,
      description,
      priority: priority || 'Medium',
    });
    await complaint.save();
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PATCH /api/complaints/:id — update status / resolve
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    const updates = { ...req.body };
    if (updates.status === 'Resolved' && !updates.resolvedAt) {
      updates.resolvedAt = new Date();
    }
    const updated = await Complaint.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: 'Complaint not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE /api/complaints/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await Complaint.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
