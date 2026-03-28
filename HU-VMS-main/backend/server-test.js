require('dotenv').config();
const express = require('express');

const app = express();
app.use(express.json());

// Skip MongoDB connection for testing
console.log('Starting server without MongoDB...');

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  // Mock successful login response
  res.json({
    success: true,
    token: 'mock-jwt-token',
    user: {
      _id: 'mock-user-id',
      name: 'Test Driver',
      email: 'driver@test.com',
      role: 'DRIVER',
      availability: 'available'
    }
  });
});

// Mock driver endpoints
app.get('/api/driver/profile', (req, res) => {
  res.json({
    _id: 'mock-user-id',
    name: 'Test Driver',
    email: 'driver@test.com',
    role: 'DRIVER',
    availability: 'available'
  });
});

app.get('/api/driver/vehicle', (req, res) => {
  res.json({
    _id: 'mock-vehicle-id',
    plateNumber: 'TEST-123',
    model: 'Test Model',
    type: 'Car',
    status: 'Available'
  });
});

app.get('/api/driver/trips/assigned', (req, res) => {
  res.json([]);
});

app.get('/api/driver/notifications', (req, res) => {
  res.json([]);
});

// Vehicle issue endpoint (the one we're testing)
app.post('/api/driver/vehicle/issue', (req, res) => {
  console.log('Vehicle issue submission:', req.body);
  // Mock successful issue creation
  const mockIssue = {
    _id: 'mock-issue-id',
    vehicle: 'mock-vehicle-id',
    reportedBy: 'mock-user-id',
    issueType: req.body.issueType,
    severity: req.body.severity,
    description: req.body.description,
    status: 'reported',
    createdAt: new Date(),
    reportReference: `HU-VMS-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}${String(new Date().getDate()).padStart(2, '0')}-1234`
  };
  
  res.status(201).json({ 
    success: true, 
    message: 'Issue submitted successfully', 
    issue: mockIssue
  });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
  console.log('Test endpoint called');
  res.json({ 
    status: 'OK', 
    timestamp: new Date(),
    message: 'Server is running without MongoDB'
  });
});

// Debug endpoint
app.post('/api/debug/issue', (req, res) => {
  console.log('Debug endpoint hit (no MongoDB):', req.body);
  res.json({ 
    success: true, 
    message: 'Debug endpoint working',
    received: req.body 
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  console.log('404 for API route:', req.originalUrl);
  res.status(404).json({ message: `API endpoint ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🚀 Test Server running on port ${PORT}`);
  console.log(`Test with: http://localhost:${PORT}/api/test`);
  console.log(`Login endpoint: http://localhost:${PORT}/api/auth/login`);
});
