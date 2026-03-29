require('dotenv').config();
const express = require('express');
const cors = require('cors');

console.log('Starting minimal working server...');

const app = express();

// Basic middleware
app.use(cors());
app.use(express.json());

// Basic routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Minimal server working' });
});

app.post('/api/auth/login', (req, res) => {
  console.log('Login request:', req.body);
  res.json({
    success: true,
    token: 'test-token',
    user: { name: 'Test Driver', role: 'DRIVER' }
  });
});

app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('Vehicle issue request:', req.body);
  res.json({
    success: true,
    message: 'Issue submitted successfully',
    issue: {
      _id: 'test-issue-id',
      reportReference: `HU-MNT-${Date.now()}`,
      ...req.body
    }
  });
});

// Maintenance routes
app.get('/api/maintenance/issues', (req, res) => {
  res.json([]);
});

app.put('/api/maintenance/issues/:id', (req, res) => {
  console.log('Maintenance update:', req.params.id, req.body);
  res.json({ success: true, message: 'Issue updated' });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

// Error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ message: err.message });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`✅ Minimal server running on port ${PORT}`);
  console.log(`✅ Test endpoints available:`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/driver/vehicle/issue`);
  console.log(`   GET  http://localhost:${PORT}/api/maintenance/issues`);
});
