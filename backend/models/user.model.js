const mongoose = require('mongoose');

// Model User cho authentication và authorization
const userSchema = new mongoose.Schema({
  // Authentication fields
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
  phone: {
    type: String,
    trim: true
  },
  dateOfBirth: {
    type: Date
  },
  
  // Academic Info (for students only)
  level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    default: 'Beginner'
  },
  favoriteSubjects: [{
    type: String,
    trim: true
  }], // ['Toán', 'Lý', 'Hóa']
  
  // Status & Activity
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date,
    default: null
  },
  deviceType: {
    type: String,
    enum: ['web', 'android'],
    default: 'android'
  },
  
  // Statistics (calculated fields)
  totalQuizzes: {
    type: Number,
    default: 0
  },
  averageScore: {
    type: Number,
    default: 0,
    min: 0,
    max: 10
  },
  totalStudyTime: {
    type: Number,
    default: 0 // in hours
  },
  
  // Security
  refreshToken: {
    type: String,
    default: null
  }
}, { timestamps: true });

// Virtual for status (convert isActive to status string)
userSchema.virtual('status').get(function() {
  return this.isActive ? 'active' : 'inactive';
});

// Ensure virtual fields are serialized
userSchema.set('toJSON', { virtuals: true });
userSchema.set('toObject', { virtuals: true });

const User = mongoose.model('User', userSchema);
module.exports = User;
