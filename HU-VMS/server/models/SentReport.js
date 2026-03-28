const mongoose = require('mongoose');

const sentReportSchema = new mongoose.Schema(
  {
    reportType: { type: String, required: true }, // 'vehicle_usage' | 'driver_activity'
    reportName: { type: String, required: true },
    sentTo: { type: String, required: true },     // officer username
    sentBy: { type: String, default: 'Admin' },
    data: { type: Array, default: [] },           // actual report rows
    columns: { type: Array, default: [] },
  },
  { timestamps: true }
);

module.exports = mongoose.model('SentReport', sentReportSchema);
