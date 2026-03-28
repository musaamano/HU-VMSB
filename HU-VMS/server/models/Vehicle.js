const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    plateNumber: { type: String, required: true, unique: true },
    model: { type: String, required: true },
    type: { type: String, enum: ['bus', 'minibus', 'car', 'truck', 'van'], required: true },
    capacity: { type: Number, required: true },
    status: {
      type: String,
      enum: ['available', 'in-use', 'maintenance', 'out-of-service'],
      default: 'available',
    },
    assignedDriver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    assignedDriverName: String,
    fuelLevel: { type: Number, default: 100 },
    mileage: { type: Number, default: 0 },
    department: String,
    year: Number,
    color: String,
    location: {
      name: { type: String, default: 'Haramaya University' },
      lat:  { type: Number, default: 9.4140 },
      lng:  { type: Number, default: 42.0360 },
    },
    speed: { type: Number, default: 0 },
    destination: { type: String, default: '' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
