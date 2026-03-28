const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password, role } = req.body;

    const user = await User.findOne({ username, role });
    if (!user) return res.status(400).json({ message: 'Invalid credentials or role' });

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ message: 'Wrong password' });

    if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });

    const token = jwt.sign(
      { id: user._id, role: user.role, name: user.name },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        email: user.email,
        role: user.role,
        department: user.department,
      },
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// POST /api/auth/register (admin only in production)
router.post('/register', async (req, res) => {
  try {
    const { name, username, email, password, role, phone, department, employeeId } = req.body;

    if (!name || !username || !email || !password || !role) {
      return res.status(400).json({ message: 'name, username, email, password and role are required' });
    }

    const exists = await User.findOne({ $or: [{ username }, { email }] });
    if (exists) {
      const field = exists.username === username ? 'Username' : 'Email';
      return res.status(400).json({ message: `${field} already exists` });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ name, username, email, password: hashed, role, phone, department, employeeId });
    await user.save();

    const { password: _pw, ...userOut } = user.toObject();
    res.status(201).json({ message: 'User created successfully', user: userOut });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;
