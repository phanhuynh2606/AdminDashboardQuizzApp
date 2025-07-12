const mongoose = require('mongoose');

// Model Đề thi (Exam)
const examSchema = new mongoose.Schema({
  examTitle: {
    type: String,
    required: true,
    trim: true
  }, // 'PRM392 Final Exam - Spring 2025'
  examCode: {
    type: String,
    required: true,
    unique: true,
    trim: true
  }, // 'PRM392_FE_SPRING25'
  
  subjectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subject',
    required: true
  },
  
  // LƯU TRỰC TIẾP ĐỂ QUERY NHANH
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  }, // 'PRM392', 'EXE101'
  semester: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  }, // 'SPRING25', 'SUMMER24'
  
  examTypeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ExamType',
    required: true
  },
  examTypeCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true
  }, // 'FE', 'PE', 'QUIZ'
  
  description: String,
  duration: {
    type: Number,
    required: true,
    min: 1
  }, // Thời gian làm bài (phút)
  totalQuestions: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  link:{
    type: String,
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Index để query nhanh
examSchema.index({ semester: 1, subjectCode: 1, examTypeCode: 1 });
examSchema.index({ semester: 1, subjectCode: 1 });
examSchema.index({ semester: 1 });

const Exam = mongoose.model('Exam', examSchema);
module.exports = Exam;
