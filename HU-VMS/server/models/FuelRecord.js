const mongoose = require('mongoose');

const fuelRecordSchema = new mongoose.Schema(
  {
    vehicle:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
    plateNumber: String,
    model:       String,
    driver:     { type: mongoose.Schema.Types.ObjectId, ref: 'Driver' },
    driverName:  String,
    fuelType:   { type: String, enum: ['Diesel', 'Gasoline', 'Electric', 'Hybrid'], default: 'Diesel' },
    quantity:   { type: Number, required: true },   // litres
    cost:       { type: Number, required: true },   // ETB
    odometer:   { type: Number, default: 0 },       // km
    date:       { type: Date, default: Date.now },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('FuelRecord', fuelRecordSchema);
