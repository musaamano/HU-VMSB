const mongoose = require('mongoose');

const gateLogSchema = new mongoose.Schema({
  plateNumber:    { type: String, required: true },
  vehicle:        { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  driver:         { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trip:           { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  direction:      { type: String, enum: ['Entry', 'Exit'], required: true },
  detectionTime:  { type: Date, default: Date.now },
  status:         { type: String, enum: ['Approved', 'Pending', 'Rejected'], default: 'Pending' },
  detectionMethod:{ type: String, enum: ['ALPR', 'Manual'], default: 'Manual' },
  inspectionNotes:{ type: String },
  officerOnDuty:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedBy:     { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectionReason:{ type: String },
  vehicleCondition: { type: String, enum: ['Good', 'Minor Issues', 'Major Issues'] },
}, { timestamps: true });

module.exports = mongoose.model('GateLog', gateLogSchema);
