require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const VehicleIssue = require('./models/VehicleIssue');

const app = express();
app.use(express.json());

// Test route without authentication
app.post('/test-issue', async (req, res) => {
  try {
    console.log('Test route hit with body:', req.body);
    
    const testIssue = new VehicleIssue({
      vehicle: new mongoose.Types.ObjectId(),
      reportedBy: new mongoose.Types.ObjectId(),
      issueType: req.body.issueType || 'Engine',
      severity: req.body.severity || 'Minor',
      description: req.body.description || 'Test description'
    });

    console.log('Creating issue...');
    const savedIssue = await testIssue.save();
    console.log('Issue saved:', savedIssue);
    
    res.json({ success: true, issue: savedIssue });
  } catch (error) {
    console.error('Error in test route:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3003;
app.listen(PORT, () => {
  console.log(`Test server running on port ${PORT}`);
  console.log('Test with: curl -X POST http://localhost:3003/test-issue -H "Content-Type: application/json" -d "{\"issueType\":\"Engine\",\"severity\":\"Minor\",\"description\":\"Test\"}"');
});
