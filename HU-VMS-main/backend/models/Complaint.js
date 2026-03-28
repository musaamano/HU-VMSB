const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  submittedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  againstUser:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  againstDriver:  { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  trip:           { type: mongoose.Schema.Types.ObjectId, ref: 'Trip' },
  category:       { type: String, enum: ['Driver Behavior', 'Vehicle Condition', 'Late Arrival', 'Route Issue', 'Fuel Issue', 'Other'], default: 'Other' },
  description:    { type: String, required: true },
  status:         { type: String, enum: ['pending', 'under_review', 'responded', 'resolved', 'closed'], default: 'pending' },
  response:       { type: String },
  respondedBy:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  respondedAt:    { type: Date },
  priority:       { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' },
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
