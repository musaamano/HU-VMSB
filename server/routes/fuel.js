const router = require('express').Router();
const FuelRecord = require('../models/FuelRecord');
const { authMiddleware } = require('../middleware/auth');

// GET /api/fuel
router.get('/', authMiddleware, async (req, res) => {
  try {
    const records = await FuelRecord.find()
      .populate('vehicle', 'plateNumber model')
      .populate('driver', 'name')
      .sort({ date: -1 });
    res.json(records);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/fuel
router.post('/', authMiddleware, async (req, res) => {
  try {
    const record = new FuelRecord({ ...req.body, recordedBy: req.user.id });
    await record.save();
    const populated = await record.populate('vehicle', 'plateNumber model');
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/fuel/:id
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    await FuelRecord.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
