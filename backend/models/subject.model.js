const mongoose = require('mongoose');

// Model Môn học (Subject) - Có kèm semester
const subjectSchema = new mongoose.Schema({
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  }, // 'PRM392', 'EXE101', 'MAD101'
  subjectName: {
    type: String,
    required: true,
    trim: true
  }, // 'Mobile Programming', 'Execution', 'Mobile App Development'
  semester: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Semester',
    required: true
  }, 
  description: String,
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

// Index để đảm bảo một môn chỉ có 1 lần trong 1 kỳ
subjectSchema.index({ subjectCode: 1, semester: 1 }, { unique: true });

const Subject = mongoose.model('Subject', subjectSchema);
module.exports = Subject;
