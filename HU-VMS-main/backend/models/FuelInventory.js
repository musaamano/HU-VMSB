const mongoose = require('mongoose');

const fuelInventorySchema = new mongoose.Schema({
  fuelType:       { type: String, enum: ['Diesel', 'Petrol'], required: true, unique: true },
  currentStock:   { type: Number, required: true, default: 0 },   // litres
  capacity:       { type: Number, required: true },                // max litres
  lowStockAlert:  { type: Number, default: 500 },                  // alert threshold
  pricePerLitre:  { type: Number },
  lastRefilled:   { type: Date },
  lastRefilledBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('FuelInventory', fuelInventorySchema);
