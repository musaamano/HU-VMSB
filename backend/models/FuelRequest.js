const mongoose = require('mongoose');

const fuelRequestSchema = new mongoose.Schema({
  requestId:        { type: String, unique: true },
  vehicle:          { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle', required: true },
  driver:           { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip:             { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  fuelType:         { type: String, enum: ['Diesel', 'Petrol'], required: true },
  requestedAmount:  { type: Number, required: true },
  dispensedAmount:  { type: Number },
  currentOdometer:  { type: Number },
  purpose:          { type: String },
  destination:      { type: String },
  priority:         { type: String, enum: ['Low', 'Normal', 'High'], default: 'Normal' },
  status:           { type: String, enum: ['Pending', 'Approved', 'Rejected', 'Dispensed'], default: 'Pending' },
  authorizationCode:{ type: String },
  authorizedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispensedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  dispensedAt:      { type: Date },
  notes:            { type: String },
  rejectionReason:  { type: String },
}, { timestamps: true });

fuelRequestSchema.pre('save', async function (next) {
  if (!this.requestId) {
    const count = await mongoose.model('FuelRequest').countDocuments();
    this.requestId = `REQ-${String(count + 1).padStart(3, '0')}`;
  }
  next();
});

module.exports = mongoose.model('FuelRequest', fuelRequestSchema);
