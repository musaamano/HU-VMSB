require('dotenv').config();
const mongoose = require('mongoose');

// Test database connection only
async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB successfully');
    console.log('Database name:', mongoose.connection.name);
    
    // Test if VehicleIssue model can be loaded
    const VehicleIssue = require('./models/VehicleIssue');
    console.log('VehicleIssue model loaded successfully');
    
    // Test schema validation
    const testIssue = new VehicleIssue({
      issueType: 'Engine',
      severity: 'Minor',
      description: 'Test issue description'
    });
    
    console.log('Test issue created (without required refs)');
    console.log('Validation error expected:', testIssue.validateSync());
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Test failed:', error);
    await mongoose.disconnect();
  }
}

testConnection();
