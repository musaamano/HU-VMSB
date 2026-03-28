require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/admin',       require('./routes/admin'));
app.use('/api/driver',      require('./routes/driver'));
app.use('/api/transport',   require('./routes/transport'));
app.use('/api/fuel',        require('./routes/fuel'));
app.use('/api/gate',        require('./routes/gate'));
app.use('/api/user',        require('./routes/user'));
app.use('/api/maintenance', require('./routes/maintenance'));

// Debug test endpoint without authentication
app.post('/api/debug/issue', async (req, res) => {
  try {
    console.log('Debug endpoint hit:', req.body);
    const mongoose = require('mongoose');
    const VehicleIssue = require('./models/VehicleIssue');
    const issue = new VehicleIssue({
      vehicle: new mongoose.Types.ObjectId(),
      reportedBy: new mongoose.Types.ObjectId(),
      issueType: req.body.issueType || 'Engine',
      severity: req.body.severity || 'Minor',
      description: req.body.description || 'Debug test'
    });
    await issue.save();
    console.log('Debug issue saved:', issue);
    res.json({ success: true, issue });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Simple health check
app.get('/api/debug/health', (req, res) => {
  console.log('Health check called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server is running'
  });
});

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'OK', timestamp: new Date() }));

// 404 handler
app.use((req, res) => res.status(404).json({ message: `Route ${req.originalUrl} not found` }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: err.message || 'Internal server error' });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => console.log(`🚀 HU-VMS Server running on port ${PORT}`));
