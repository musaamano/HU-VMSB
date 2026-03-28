require('dotenv').config();
const mongoose = require('mongoose');

async function debugTest() {
  try {
    console.log('Starting debug test...');
    console.log('MONGO_URI:', process.env.MONGO_URI);
    
    // Test database connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ MongoDB connected successfully');
    
    // Test creating a basic document without model
    const db = mongoose.connection.db;
    const collections = await db.listCollections().toArray();
    console.log('📁 Collections in database:', collections.map(c => c.name));
    
    // Test if VehicleIssue model loads
    try {
      const VehicleIssue = require('./models/VehicleIssue');
      console.log('✅ VehicleIssue model loaded');
      
      // Test schema
      const schema = VehicleIssue.schema;
      console.log('📋 Schema paths:', Object.keys(schema.paths));
      
      // Create a minimal test document
      const testDoc = {
        vehicle: new mongoose.Types.ObjectId(),
        reportedBy: new mongoose.Types.ObjectId(),
        issueType: 'Engine',
        severity: 'Minor',
        description: 'Test description'
      };
      
      console.log('📝 Creating test document...');
      const issue = new VehicleIssue(testDoc);
      console.log('✅ Document created in memory');
      
      const validationError = issue.validateSync();
      if (validationError) {
        console.log('❌ Validation error:', validationError.message);
      } else {
        console.log('✅ Document validation passed');
      }
      
    } catch (modelError) {
      console.log('❌ Model error:', modelError.message);
    }
    
    await mongoose.disconnect();
    console.log('✅ Test completed');
    
  } catch (error) {
    console.error('❌ Debug test failed:', error.message);
    console.error('Full error:', error);
  }
}

debugTest();
