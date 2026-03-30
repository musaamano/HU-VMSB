require('dotenv').config();
const mongoose = require('mongoose');

async function testModel() {
  try {
    console.log('Testing VehicleIssue model...');
    
    // Connect to database
    await mongoose.connect(process.env.MONGO_URI);
    console.log('✅ Connected to MongoDB');
    
    // Load the model
    const VehicleIssue = require('./models/VehicleIssue');
    console.log('✅ VehicleIssue model loaded');
    
    // Create a test document without saving
    const testDoc = new VehicleIssue({
      vehicle: new mongoose.Types.ObjectId(),
      reportedBy: new mongoose.Types.ObjectId(),
      issueType: 'Engine',
      severity: 'Minor',
      description: 'Test description'
    });
    
    console.log('✅ Test document created in memory');
    console.log('Document data:', testDoc);
    
    // Validate the document
    const validationError = testDoc.validateSync();
    if (validationError) {
      console.log('❌ Validation error:', validationError);
    } else {
      console.log('✅ Document validation passed');
    }
    
    // Try to save
    console.log('Attempting to save...');
    const saved = await testDoc.save();
    console.log('✅ Document saved successfully:', saved);
    
    await mongoose.disconnect();
    console.log('✅ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Model test failed:', error.message);
    console.error('Full error:', error);
    await mongoose.disconnect();
  }
}

testModel();
