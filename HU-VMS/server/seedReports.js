/**
 * Seeds sample SentReports into the DB so the transport officer
 * can see them immediately on the Reports page.
 *
 * Run from HU-VMS/server/:
 *   node seedReports.js
 */
const mongoose = require('mongoose');
require('dotenv').config();

const SentReport = require('./models/SentReport');

const sampleReports = [
  {
    reportType: 'vehicle_usage',
    reportName: 'Vehicle Usage Report — March 2025',
    sentTo: 'transport',
    sentBy: 'Admin',
    columns: ['Model', 'Plate', 'Type', 'Capacity', 'Status', 'Trips', 'Mileage', 'Fuel', 'Driver'],
    data: [
      ['Toyota Coaster',      'ET-AA-001', 'minibus', 25, 'available', 12, '4,320 km', '78%', 'Abebe Kebede'],
      ['Isuzu Bus',           'ET-AA-002', 'bus',     45, 'available',  8, '3,100 km', '55%', 'Chaltu Gemechu'],
      ['Toyota Land Cruiser', 'ET-AA-003', 'car',      7, 'in-use',    20, '6,800 km', '90%', 'Abebe Kebede'],
      ['Mitsubishi Rosa',     'ET-AA-004', 'minibus', 30, 'in-use',     5, '1,250 km', '40%', 'Chaltu Gemechu'],
    ],
  },
  {
    reportType: 'driver_activity',
    reportName: 'Driver Activity Report — March 2025',
    sentTo: 'transport',
    sentBy: 'Admin',
    columns: ['Name', 'Employee ID', 'Phone', 'License', 'Status', 'Vehicle', 'Trips', 'Rating'],
    data: [
      ['Abebe Kebede',   'HU-DRV-001', '+251-911-000001', 'ETH-LIC-001', 'available', 'ET-AA-001', 32, '4.8'],
      ['Chaltu Gemechu', 'HU-DRV-002', '+251-911-000002', 'ETH-LIC-002', 'available', 'ET-AA-002', 13, '4.5'],
    ],
  },
  {
    reportType: 'vehicle_usage',
    reportName: 'Vehicle Usage Report — February 2025',
    sentTo: 'transport',
    sentBy: 'Admin',
    columns: ['Model', 'Plate', 'Type', 'Capacity', 'Status', 'Trips', 'Mileage', 'Fuel', 'Driver'],
    data: [
      ['Toyota Coaster',      'ET-AA-001', 'minibus', 25, 'available',  9, '3,900 km', '65%', 'Abebe Kebede'],
      ['Isuzu Bus',           'ET-AA-002', 'bus',     45, 'available',  6, '2,700 km', '48%', 'Chaltu Gemechu'],
      ['Toyota Land Cruiser', 'ET-AA-003', 'car',      7, 'available', 15, '5,500 km', '82%', 'Abebe Kebede'],
      ['Mitsubishi Rosa',     'ET-AA-004', 'minibus', 30, 'available',  3, '900 km',   '70%', 'Chaltu Gemechu'],
    ],
  },
  {
    reportType: 'driver_activity',
    reportName: 'Driver Activity Report — February 2025',
    sentTo: 'transport',
    sentBy: 'Admin',
    columns: ['Name', 'Employee ID', 'Phone', 'License', 'Status', 'Vehicle', 'Trips', 'Rating'],
    data: [
      ['Abebe Kebede',   'HU-DRV-001', '+251-911-000001', 'ETH-LIC-001', 'available', 'ET-AA-001', 24, '4.7'],
      ['Chaltu Gemechu', 'HU-DRV-002', '+251-911-000002', 'ETH-LIC-002', 'available', 'ET-AA-002',  9, '4.4'],
    ],
  },
];

async function seedReports() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await SentReport.deleteMany({ sentTo: 'transport' });
  const created = await SentReport.insertMany(sampleReports);
  console.log(`✅ Created ${created.length} sample reports for user "transport"`);

  await mongoose.disconnect();
}

seedReports().catch(err => {
  console.error(err);
  process.exit(1);
});
