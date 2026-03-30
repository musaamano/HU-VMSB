/**
 * node seedComplaints.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Complaint = require('./models/Complaint');

const samples = [
  {
    sender: 'Dr. Ahmed Hassan', senderUsername: 'user1', role: 'User',
    vehicle: 'ET-AA-001 Toyota Coaster', driver: 'Abebe Kebede',
    tripId: 'TRIP-2025-045', category: 'Mechanical',
    description: 'Air conditioning not working properly. Passengers were uncomfortable during the 4-hour trip.',
    priority: 'Medium', status: 'Resolved', driverAtFault: false,
    actions: ['Mark Vehicle Out of Service', 'Create Maintenance Ticket'],
    resolutionNotes: 'AC unit replaced. Vehicle returned to service after inspection.',
    resolvedAt: new Date('2025-03-15'),
    createdAt: new Date('2025-03-14'),
  },
  {
    sender: 'Abebe Kebede', senderUsername: 'driver1', role: 'Driver',
    vehicle: 'ET-AA-002 Isuzu Bus', driver: 'Abebe Kebede',
    tripId: 'TRIP-2025-041', category: 'Resource',
    description: 'Fuel allocation was insufficient for the assigned route. Had to stop mid-trip.',
    priority: 'High', status: 'Resolved', driverAtFault: false,
    actions: ['Conduct Audit'],
    resolutionNotes: 'Fuel allocation policy reviewed and updated for long routes.',
    resolvedAt: new Date('2025-03-14'),
    createdAt: new Date('2025-03-13'),
  },
  {
    sender: 'Prof. Sarah Johnson', senderUsername: 'user1', role: 'User',
    vehicle: 'ET-AA-003 Toyota Land Cruiser', driver: 'Chaltu Gemechu',
    tripId: 'TRIP-2025-038', category: 'Behavioral',
    description: 'Driver was rude to passengers and used phone while driving.',
    priority: 'High', status: 'In Progress', driverAtFault: true,
    actions: ['Schedule Counseling', 'Issue Behavioral Warning'],
    resolutionNotes: 'Training scheduled for next week.',
    resolvedAt: null,
    createdAt: new Date('2025-03-12'),
  },
  {
    sender: 'Chaltu Gemechu', senderUsername: 'driver2', role: 'Driver',
    vehicle: 'ET-AA-004 Mitsubishi Rosa', driver: 'Chaltu Gemechu',
    tripId: 'TRIP-2025-035', category: 'Safety',
    description: 'Brake system needs immediate attention. Noticed unusual noise and reduced braking efficiency.',
    priority: 'Critical', status: 'Resolved', driverAtFault: false,
    actions: ['Vehicle Inspection'],
    resolutionNotes: 'Brake pads replaced. Full safety inspection passed.',
    resolvedAt: new Date('2025-03-11'),
    createdAt: new Date('2025-03-11'),
  },
  {
    sender: 'Regular User', senderUsername: 'user1', role: 'User',
    vehicle: 'ET-AA-001 Toyota Coaster', driver: 'Abebe Kebede',
    tripId: 'TRIP-2025-030', category: 'Service',
    description: 'Route taken was unnecessarily long, adding 2 hours to the trip.',
    priority: 'Low', status: 'Pending', driverAtFault: false,
    actions: [],
    resolutionNotes: '',
    resolvedAt: null,
    createdAt: new Date('2025-03-10'),
  },
  {
    sender: 'Dr. Liya Tadesse', senderUsername: 'user1', role: 'User',
    vehicle: 'ET-AA-002 Isuzu Bus', driver: 'Chaltu Gemechu',
    tripId: 'TRIP-2025-028', category: 'Safety',
    description: 'Driver was speeding on the highway and ignored passenger requests to slow down.',
    priority: 'High', status: 'Pending', driverAtFault: true,
    actions: [],
    resolutionNotes: '',
    resolvedAt: null,
    createdAt: new Date('2025-03-09'),
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  await Complaint.deleteMany({});
  const created = await Complaint.insertMany(samples);
  console.log(`✅ Created ${created.length} sample complaints`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
