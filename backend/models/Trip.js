const mongoose = require('mongoose');

const tripSchema = new mongoose.Schema({
  tripId:          { type: String, unique: true },
  requestedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  assignedDriver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedVehicle: { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  pickupLocation:  { type: String, required: true },
  destination:     { type: String, required: true },
  purpose:         { type: String },
  passengerCount:  { type: Number, default: 1 },
  scheduledTime:   { type: Date, required: true },
  startedAt:       { type: Date },
  completedAt:     { type: Date },
  status: {
    type: String,
    enum: ['pending', 'approved', 'assigned', 'accepted', 'started', 'completed', 'cancelled', 'rejected'],
    default: 'pending'
  },
  fuelUsed:        { type: Number },
  startOdometer:   { type: Number },
  endOdometer:     { type: Number },
  driverNotes:     { type: String },
  rejectionReason: { type: String },
  approvedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  gateExitLog:     { type: mongoose.Schema.Types.ObjectId, ref: 'GateLog' },
  gateEntryLog:    { type: mongoose.Schema.Types.ObjectId, ref: 'GateLog' },
}, { timestamps: true });

// Auto-generate tripId
tripSchema.pre('save', async function (next) {
  if (!this.tripId) {
    const count = await mongoose.model('Trip').countDocuments();
    this.tripId = `TRIP-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Trip', tripSchema);
