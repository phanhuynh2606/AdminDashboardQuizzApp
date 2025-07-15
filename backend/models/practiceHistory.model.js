const mongoose = require('mongoose');

// Model Lịch sử làm bài (PracticeHistory)
const practiceHistorySchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Exam',
    required: true
  },
  // Lưu thông tin để query nhanh
 
  subjectCode: String,
  examTypeCode: String,
  
  userSessionId: {
    type: String,
    required: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: Date,
  totalQuestions: Number,
  correctAnswers: {
    type: Number,
    default: 0
  },
  score: {
    type: Number,
    default: 0
  },
  timeSpent: {
    type: Number,
    default: 0
  },
  answers: [{
    questionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'QuestionBank'
    },
    selectedAnswer: String,
    isCorrect: Boolean
  }],
  isCompleted: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const PracticeHistory = mongoose.model('PracticeHistory', practiceHistorySchema);
module.exports = PracticeHistory;
