require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

console.log('Starting simple backend server...');

// Test route
app.get('/api/driver/test', (req, res) => {
  console.log('Driver test route hit');
  res.json({ message: 'Driver routes are working!' });
});

// Mock authentication endpoint
app.post('/api/auth/login', (req, res) => {
  console.log('Login attempt:', req.body);
  res.json({
    success: true,
    token: 'mock-jwt-token-12345',
    user: {
      _id: 'mock-user-id',
      name: 'Test Driver',
      email: 'driver@test.com',
      role: 'DRIVER',
      availability: 'available'
    }
  });
});

// Mock vehicle issue endpoint without authentication
app.post('/api/driver/vehicle/issue-test', (req, res) => {
  console.log('TEST: Vehicle issue submission (no auth):', req.body);
  res.status(201).json({ 
    success: true, 
    message: 'TEST: Issue submitted successfully without auth', 
    received: req.body,
    reportReference: `HU-MNT-${Date.now()}`
  });
});

// Mock vehicle issue endpoint with authentication check
app.post('/api/driver/vehicle/issue', (req, res) => {
  const authHeader = req.headers.authorization;
  console.log('Auth header:', authHeader);
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Not authorized, no token' });
  }
  
  const token = authHeader.split(' ')[1];
  if (token !== 'mock-jwt-token-12345') {
    return res.status(401).json({ message: 'Token invalid' });
  }
  
  console.log('Vehicle issue submission (with auth):', req.body);
  res.status(201).json({ 
    success: true, 
    message: 'Issue submitted successfully with auth', 
    issue: {
      _id: 'mock-issue-id',
      reportReference: `HU-MNT-${Date.now()}`,
      ...req.body
    }
  });
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// 404 handler
app.use((req, res) => {
  console.log('404 for:', req.method, req.originalUrl);
  res.status(404).json({ message: `Route ${req.originalUrl} not found` });
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`✅ Simple backend server running on port ${PORT}`);
  console.log(`✅ Test endpoints available:`);
  console.log(`   GET  http://localhost:${PORT}/api/driver/test`);
  console.log(`   POST http://localhost:${PORT}/api/auth/login`);
  console.log(`   POST http://localhost:${PORT}/api/driver/vehicle/issue-test`);
  console.log(`   POST http://localhost:${PORT}/api/driver/vehicle/issue (with auth)`);
});
