const mongoose = require('mongoose');

// Model Chứa kỳ - Semester
const semesterSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  link:{
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Semester = mongoose.model('Semester', semesterSchema);
module.exports = Semester;
