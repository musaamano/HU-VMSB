const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema(
  {
    sender: { type: String, required: true },
    senderUsername: { type: String },
    role: { type: String, enum: ['User', 'Driver'], default: 'User' },
    vehicle: { type: String, default: '' },
    driver: { type: String, default: '' },
    tripId: { type: String, default: '' },
    category: { type: String, enum: ['Resource', 'Safety', 'Mechanical', 'Behavioral', 'Service'], required: true },
    description: { type: String, required: true },
    priority: { type: String, enum: ['Critical', 'High', 'Medium', 'Low'], default: 'Medium' },
    status: { type: String, enum: ['Pending', 'In Progress', 'Resolved'], default: 'Pending' },
    driverAtFault: { type: Boolean, default: false },
    actions: { type: [String], default: [] },
    resolutionNotes: { type: String, default: '' },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Complaint', complaintSchema);
