const mongoose = require('mongoose');

// Model User cho authentication và authorization
const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'student'],
    default: 'student'
  },
  fullName: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  refreshToken: {
    type: String,
    default: null
  },
  lastLogin: {
    type: Date,
    default: null
  },
  deviceType: {
    type: String,
    enum: ['web', 'android'],
    default: 'android'
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
