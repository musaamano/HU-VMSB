const router = require('express').Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });

// POST /api/auth/login
router.post('/login', async (req, res) => {
  const { username, password, role } = req.body;
  if (!username || !password || !role)
    return res.status(400).json({ message: 'Username, password and role are required' });

  const user = await User.findOne({ username, role, isActive: true });
  if (!user || !(await user.matchPassword(password)))
    return res.status(401).json({ message: 'Invalid credentials' });

  const token = signToken(user._id);
  res.json({
    token,
    user: {
      id: user._id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      profilePhoto: user.profilePhoto,
    }
  });
});

// GET /api/auth/me
router.get('/me', protect, (req, res) => {
  res.json({ user: req.user });
});

// PUT /api/auth/change-password
router.put('/change-password', protect, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);
  if (!(await user.matchPassword(currentPassword)))
    return res.status(400).json({ message: 'Current password is incorrect' });
  user.password = newPassword;
  await user.save();
  res.json({ message: 'Password updated successfully' });
});

module.exports = router;
