const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicleId:    { type: String, required: true, unique: true },
  plateNumber:  { type: String, required: true, unique: true },
  model:        { type: String, required: true },
  type:         { type: String, enum: ['Van', 'Bus', 'Truck', 'Car', 'Pickup'], required: true },
  year:         { type: Number },
  capacity:     { type: Number },
  fuelType:     { type: String, enum: ['Diesel', 'Petrol', 'Hybrid', 'Electric'], default: 'Diesel' },
  status:       { type: String, enum: ['Available', 'Assigned', 'Maintenance', 'Out of Service'], default: 'Available' },
  assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department:   { type: String },
  fuelLevel:    { type: Number, default: 100, min: 0, max: 100 },
  odometer:     { type: Number, default: 0 },
  lastMaintenance: { type: Date },
  nextMaintenanceDue: { type: Date },
  insuranceExpiry: { type: Date },
  notes:        { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Vehicle', vehicleSchema);
