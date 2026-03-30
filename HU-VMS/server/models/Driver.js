const mongoose = require('mongoose');

const driverSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    employeeId: { type: String, unique: true },
    phone: String,
    licenseNumber: String,
    licenseExpiry: String,
    status: {
      type: String,
      enum: ['available', 'on-trip', 'off-duty'],
      default: 'available',
    },
    assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
    assignedVehiclePlate: String,
    totalTrips: { type: Number, default: 0 },
    rating: { type: Number, default: 5 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Driver', driverSchema);
