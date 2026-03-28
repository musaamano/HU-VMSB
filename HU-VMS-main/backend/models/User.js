const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  username:    { type: String, required: true, unique: true, trim: true },
  password:    { type: String, required: true, minlength: 6 },
  role: {
    type: String,
    enum: ['ADMIN', 'TRANSPORT', 'DRIVER', 'USER', 'FUEL_OFFICER', 'GATE_OFFICER', 'MAINTENANCE'],
    required: true
  },
  name:        { type: String, required: true },
  email:       { type: String, unique: true, sparse: true },
  phone:       { type: String },
  department:  { type: String },
  employeeId:  { type: String },
  profilePhoto:{ type: String },
  isActive:    { type: Boolean, default: true },
  // Driver-specific
  licenseNumber: { type: String },
  licenseExpiry: { type: Date },
  availability:  { type: String, enum: ['available', 'unavailable', 'on_trip'], default: 'available' },
}, { timestamps: true });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  return bcrypt.compare(entered, this.password);
};

module.exports = mongoose.model('User', userSchema);
