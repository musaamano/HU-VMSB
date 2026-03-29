const mongoose = require('mongoose');
require('dotenv').config();
const User = require('./backend/models/User');
const Vehicle = require('./backend/models/Vehicle');
const Trip = require('./backend/models/Trip');

async function checkDrivers() {
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vms');
  
  const drivers = await User.find({ role: 'DRIVER' });
  console.log('--- Drivers ---');
  for (const d of drivers) {
    const vehicle = await Vehicle.findOne({ assignedDriver: d._id });
    const trip = await Trip.findOne({ assignedDriver: d._id, status: { $in: ['assigned', 'accepted', 'started'] } });
    console.log(`Driver: ${d.username} (${d.name})`);
    console.log(`  Assigned Vehicle: ${vehicle ? vehicle.plateNumber : 'None'}`);
    console.log(`  Active Trip Vehicle: ${trip ? trip.assignedVehicle : 'None'}`);
  }
  
  await mongoose.disconnect();
}

checkDrivers().catch(console.error);
