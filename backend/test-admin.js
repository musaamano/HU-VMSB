require('dotenv').config();
const mongoose = require('mongoose');

async function testConnection() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    const User = require('./models/User');
    const notifyUsers = await User.find({ role: { $in: ['TRANSPORT', 'ADMIN'] }, isActive: true }).select('_id role');
    console.log("Found notification targets:", notifyUsers);
    
    const allAdmins = await User.find({ role: 'ADMIN' });
    console.log("All admins:", allAdmins.map(a => ({ _id: a._id, role: a.role, isActive: a.isActive })));
    
    await mongoose.disconnect();
  } catch (error) {
    console.error('Test failed:', error);
    await mongoose.disconnect();
  }
}

testConnection();
