require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');

const app = express();
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Simple test endpoint
app.post('/test-simple', async (req, res) => {
  try {
    console.log('Simple test request:', req.body);
    
    // Create a simple object without any model
    const simpleData = {
      message: 'Test successful',
      received: req.body,
      timestamp: new Date()
    };
    
    res.json(simpleData);
  } catch (error) {
    console.error('Simple test error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3004;
app.listen(PORT, () => {
  console.log(`Simple test server running on port ${PORT}`);
  console.log(`Test with: curl -X POST http://localhost:${PORT}/test-simple -H "Content-Type: application/json" -d '{"test":"data"}'`);
});
