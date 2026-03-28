const mongoose = require('mongoose');

const reportRequestSchema = new mongoose.Schema(
  {
    reportType: { type: String, required: true },
    period: { type: String, enum: ['daily', 'weekly', 'monthly', 'quarterly', 'annually'], default: 'monthly' },
    requestedBy: { type: String, required: true },
    requestedByName: { type: String },
    message: { type: String },
    status: { type: String, enum: ['pending', 'resolved', 'rejected'], default: 'pending' },
    rejectionReason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReportRequest', reportRequestSchema);
