const mongoose = require('mongoose');

// Model Loại đề thi (ExamType)
const examTypeSchema = new mongoose.Schema({
  typeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  }, // 'FE', 'PE', 'QUIZ', 'MIDTERM'
  typeName: {
    type: String,
    required: true,
    trim: true
  }, // 'Final Exam', 'Practical Exam', 'Quiz', 'Midterm'
  defaultDuration: {
    type: Number,
    default: 60
  }, // Thời gian làm bài mặc định (phút)
  isActive: {
    type: Boolean,
    default: true
  }
});

const ExamType = mongoose.model('ExamType', examTypeSchema);
module.exports = ExamType;
