const router = require('express').Router();
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { authMiddleware, requireRole } = require('../middleware/auth');

// GET /api/users  (admin only)
router.get('/', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// PATCH /api/users/:id
router.patch('/:id', authMiddleware, async (req, res) => {
  try {
    if (req.body.password) {
      req.body.password = await bcrypt.hash(req.body.password, 10);
    }
    const updated = await User.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/reset-password  (admin sets a new password)
router.post('/:id/reset-password', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6)
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    const hashed = await bcrypt.hash(newPassword, 10);
    const updated = await User.findByIdAndUpdate(req.params.id, { password: hashed }, { new: true }).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Password reset successfully', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/users/:id/reset-username  (admin sets a new username)
router.post('/:id/reset-username', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    const { newUsername } = req.body;
    if (!newUsername || newUsername.trim().length < 3)
      return res.status(400).json({ message: 'Username must be at least 3 characters' });
    const exists = await User.findOne({ username: newUsername.trim() });
    if (exists) return res.status(400).json({ message: 'Username already taken' });
    const updated = await User.findByIdAndUpdate(
      req.params.id, { username: newUsername.trim() }, { new: true }
    ).select('-password');
    if (!updated) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Username reset successfully', user: updated });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// DELETE /api/users/:id  (admin only)
router.delete('/:id', authMiddleware, requireRole('ADMIN'), async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
