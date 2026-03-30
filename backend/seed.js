require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const connectDB = require('./config/db');

const seed = async () => {
  await connectDB();

  // Drop collections cleanly
  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
    console.log(`Dropped: ${col.name}`);
  }

  // Hash passwords manually so we bypass any pre-save hook issues
  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const User = require('./models/User');
  const Vehicle = require('./models/Vehicle');
  const FuelInventory = require('./models/FuelInventory');

  // ── Users ──────────────────────────────────────────────────────
  const users = await User.collection.insertMany([
    { username: 'admin', password: hash('admin123'), role: 'ADMIN', name: 'System Admin', email: 'admin@hu.edu.et', department: 'IT', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'transport1', password: hash('pass123'), role: 'TRANSPORT', name: 'Abebe Girma', email: 'transport@hu.edu.et', department: 'Transport', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'driver1', password: hash('pass123'), role: 'DRIVER', name: 'Kebede Tadesse', email: 'driver1@hu.edu.et', licenseNumber: 'DL-001', availability: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'driver2', password: hash('pass123'), role: 'DRIVER', name: 'Mulugeta Bekele', email: 'driver2@hu.edu.et', licenseNumber: 'DL-002', availability: 'available', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'user1', password: hash('pass123'), role: 'USER', name: 'Dr. Ahmed Hassan', email: 'ahmed@hu.edu.et', department: 'Engineering', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'user2', password: hash('pass123'), role: 'USER', name: 'Prof. Sarah Johnson', email: 'sarah@hu.edu.et', department: 'Science', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'fuel1', password: hash('pass123'), role: 'FUEL_OFFICER', name: 'Dawit Haile', email: 'fuel@hu.edu.et', department: 'Fuel Station', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'gate1', password: hash('pass123'), role: 'GATE_OFFICER', name: 'Yonas Tekle', email: 'gate@hu.edu.et', department: 'Security', isActive: true, createdAt: new Date(), updatedAt: new Date() },
    { username: 'maintenance1', password: hash('pass123'), role: 'MAINTENANCE', name: 'Tesfaye Worku', email: 'maint@hu.edu.et', department: 'Maintenance', isActive: true, createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log(`✅ Inserted ${users.insertedCount} users`);

  // ── Vehicles ───────────────────────────────────────────────────
  const vehicles = await Vehicle.collection.insertMany([
    { vehicleId: 'VH-001', plateNumber: 'HU-2045', model: 'Toyota Hilux 2022', type: 'Pickup', fuelType: 'Diesel', status: 'Available', capacity: 5, fuelLevel: 80, odometer: 45230, department: 'Transport', assignedDriver: users.insertedIds[2], createdAt: new Date(), updatedAt: new Date() },
    { vehicleId: 'VH-002', plateNumber: 'HU-3021', model: 'Isuzu D-Max 2021', type: 'Pickup', fuelType: 'Diesel', status: 'Available', capacity: 5, fuelLevel: 65, odometer: 32100, department: 'Transport', assignedDriver: users.insertedIds[3], createdAt: new Date(), updatedAt: new Date() },
    { vehicleId: 'VH-003', plateNumber: 'HU-1567', model: 'Toyota Land Cruiser 2020', type: 'Van', fuelType: 'Diesel', status: 'Available', capacity: 8, fuelLevel: 90, odometer: 61500, department: 'Admin', createdAt: new Date(), updatedAt: new Date() },
    { vehicleId: 'VH-004', plateNumber: 'HU-4102', model: 'Toyota Hiace 2023', type: 'Van', fuelType: 'Petrol', status: 'Available', capacity: 14, fuelLevel: 55, odometer: 18900, department: 'Transport', createdAt: new Date(), updatedAt: new Date() },
    { vehicleId: 'VH-005', plateNumber: 'HU-5500', model: 'Isuzu Bus 2019', type: 'Bus', fuelType: 'Diesel', status: 'Maintenance', capacity: 45, fuelLevel: 30, odometer: 120000, department: 'Transport', createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log(`✅ Inserted ${vehicles.insertedCount} vehicles`);

  // ── Fuel Inventory ─────────────────────────────────────────────
  await FuelInventory.collection.insertMany([
    { fuelType: 'Diesel', currentStock: 8500, capacity: 10000, lowStockAlert: 1000, pricePerLitre: 42.5, createdAt: new Date(), updatedAt: new Date() },
    { fuelType: 'Petrol', currentStock: 4200, capacity: 5000, lowStockAlert: 500, pricePerLitre: 45.0, createdAt: new Date(), updatedAt: new Date() },
  ]);
  console.log('✅ Inserted fuel inventory');

  console.log('\n🎉 Database seeded successfully!\n');
  console.log('📋 Login credentials:');
  console.log('  Admin:         admin / admin123');
  console.log('  Transport:     transport1 / pass123');
  console.log('  Driver:        driver1 / pass123');
  console.log('  User:          user1 / pass123');
  console.log('  Fuel Officer:  fuel1 / pass123');
  console.log('  Gate Officer:  gate1 / pass123');
  console.log('  Maintenance:   maintenance1 / pass123');

  await mongoose.disconnect();
};

seed().catch(err => { console.error('Seed failed:', err); mongoose.disconnect(); });
