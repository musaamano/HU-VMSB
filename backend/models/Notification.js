const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['trip_assignment', 'trip_update', 'vehicle_alert', 'schedule_reminder',
      'fuel_alert', 'fuel_request', 'complaint', 'gate_alert', 'system', 'approval'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  severity: { type: String, enum: ['low', 'normal', 'medium', 'high'], default: 'normal' },
  link: { type: String },
  relatedId: { type: mongoose.Schema.Types.ObjectId },
  relatedModel: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
