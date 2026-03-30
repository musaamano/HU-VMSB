/**
 * Seeds extra vehicles with tracking data.
 * Run: node seedVehicles.js
 */
const mongoose = require('mongoose');
require('dotenv').config();
const Vehicle = require('./models/Vehicle');

const vehicles = [
  {
    plateNumber: 'ET-AA-001',
    model: 'Toyota Coaster',
    type: 'minibus',
    capacity: 25,
    status: 'available',
    assignedDriverName: 'Abebe Kebede',
    fuelLevel: 85,
    mileage: 42300,
    year: 2019,
    color: 'White',
    location: { name: 'University Parking', lat: 9.4140, lng: 42.0360 },
    speed: 0,
    destination: '',
  },
  {
    plateNumber: 'ET-AA-002',
    model: 'Isuzu Bus',
    type: 'bus',
    capacity: 45,
    status: 'in-use',
    assignedDriverName: 'Chaltu Gemechu',
    fuelLevel: 60,
    mileage: 78900,
    year: 2018,
    color: 'Blue',
    location: { name: 'Highway A1 – Dire Dawa Road', lat: 9.5200, lng: 42.1800 },
    speed: 68,
    destination: 'Dire Dawa',
  },
  {
    plateNumber: 'ET-AA-003',
    model: 'Toyota Land Cruiser',
    type: 'car',
    capacity: 7,
    status: 'available',
    assignedDriverName: 'Abebe Kebede',
    fuelLevel: 95,
    mileage: 31200,
    year: 2021,
    color: 'Silver',
    location: { name: 'University Parking', lat: 9.4145, lng: 42.0365 },
    speed: 0,
    destination: '',
  },
  {
    plateNumber: 'ET-AA-004',
    model: 'Mitsubishi Rosa',
    type: 'minibus',
    capacity: 30,
    status: 'in-use',
    assignedDriverName: 'Chaltu Gemechu',
    fuelLevel: 45,
    mileage: 55600,
    year: 2020,
    color: 'White',
    location: { name: 'Harar City Center', lat: 9.3120, lng: 42.1180 },
    speed: 42,
    destination: 'Harar',
  },
  {
    plateNumber: 'ET-AA-005',
    model: 'Toyota Hilux',
    type: 'truck',
    capacity: 5,
    status: 'maintenance',
    assignedDriverName: 'Mohammed Hassan',
    fuelLevel: 30,
    mileage: 91000,
    year: 2017,
    color: 'Grey',
    location: { name: 'University Maintenance Shop', lat: 9.4100, lng: 42.0320 },
    speed: 0,
    destination: '',
  },
  {
    plateNumber: 'ET-AA-006',
    model: 'Toyota HiAce',
    type: 'van',
    capacity: 14,
    status: 'available',
    assignedDriverName: 'Hanan Yusuf',
    fuelLevel: 78,
    mileage: 28400,
    year: 2022,
    color: 'White',
    location: { name: 'University Parking', lat: 9.4135, lng: 42.0355 },
    speed: 0,
    destination: '',
  },
  {
    plateNumber: 'ET-AA-007',
    model: 'Isuzu D-Max',
    type: 'truck',
    capacity: 5,
    status: 'out-of-service',
    assignedDriverName: 'Bekele Worku',
    fuelLevel: 10,
    mileage: 112000,
    year: 2016,
    color: 'Red',
    location: { name: 'Roadside – Haramaya Town', lat: 9.4060, lng: 42.0410 },
    speed: 0,
    destination: '',
  },
  {
    plateNumber: 'ET-AA-008',
    model: 'Hyundai County',
    type: 'minibus',
    capacity: 28,
    status: 'in-use',
    assignedDriverName: 'Fatuma Ahmed',
    fuelLevel: 55,
    mileage: 63200,
    year: 2019,
    color: 'Yellow',
    location: { name: 'Addis Ababa Ring Road', lat: 9.0200, lng: 38.7500 },
    speed: 75,
    destination: 'Addis Ababa',
  },
];

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  await Vehicle.deleteMany({});
  const created = await Vehicle.insertMany(vehicles);
  console.log(`✅ Seeded ${created.length} vehicles`);

  created.forEach(v => console.log(`  ${v.plateNumber} – ${v.model} (${v.status})`));
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });
