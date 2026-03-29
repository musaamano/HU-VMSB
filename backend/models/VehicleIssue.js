const mongoose = require('mongoose');

const vehicleIssueSchema = new mongoose.Schema({
  vehicle:      { type: mongoose.Schema.Types.ObjectId, ref: 'Vehicle' },
  reportedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  trip:         { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  issueType:    { type: String, enum: ['Engine', 'Tires', 'Brakes', 'Lights', 'Body Damage', 'Fuel System', 'Electrical', 'Other'], required: true },
  severity:     { type: String, enum: ['Minor', 'Moderate', 'Critical'], required: true },
  description:  { type: String, required: true },
  status:       { type: String, enum: ['reported', 'acknowledged', 'in_repair', 'resolved'], default: 'reported' },
  resolvedAt:   { type: Date },
  resolvedBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  resolutionNotes: { type: String },
  partsUsed: { type: String },
  laborHours: { type: String },
  finalCost: { type: String },
  // Enhanced professional fields
  reportReference: { type: String },
  location: { type: String },
  odometerReading: { type: Number },
  weatherConditions: { type: String },
  immediateActionTaken: { type: String },
  images: [{ type: String }],
  maintenanceOfficeNotified: { type: Boolean, default: false },
  maintenanceOfficeNotifiedAt: { type: Date },
  acknowledgedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  acknowledgedAt: { type: Date },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  estimatedRepairTime: { type: String },
  partsRequired: { type: String },
  safetyHazard: { type: Boolean, default: false },
  vehicleOperational: { type: Boolean, default: true },
}, { timestamps: true });

// Auto-generate report reference
vehicleIssueSchema.pre('save', function(next) {
  if (this.isNew && !this.reportReference) {
    const ts   = Date.now().toString(36).toUpperCase();
    const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
    this.reportReference = `HU-MNT-${ts}-${rand}`;
  }
  next();
});

module.exports = mongoose.model('VehicleIssue', vehicleIssueSchema);
