const mongoose = require("mongoose");

// ========================================
// QUESTION BANK - Kho câu hỏi mẫu
// ========================================
const questionBankSchema = new mongoose.Schema({
  questionText: {
    type: String,
    required: true,
    trim: true,
  },

  // PHÂN LOẠI
  subjectCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  }, // 'PRM392', 'EXE101'
  examTypeCode: {
    type: String,
    required: true,
    uppercase: true,
    trim: true,
  }, // 'FE', 'PE', 'QUIZ'

  // Options for multiple choice
  options: [
    {
      letter: {
        type: String,
        required: true, // A, B, C, D
      },
      text: {
        type: String,
        required: true, // Option content
      },
      isCorrect: {
        type: Boolean,
        default: false,
      },
    },
  ],
  correctAnswer: {
    answers: [String], // ["A", "B"] for multiple choice, ["A"] for single choice
    answer: String, // Legacy single answer field (for backward compatibility)
    explanation: String, // Explanation for the answer(s)
    confidence: {
      type: String,
      enum: ["EASY", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    source: {
      type: String,
      enum: ["comments", "manual", "verified", "gemini-analysis"],
      default: "comments",
    },
  },
  comments: [
    {
      content: String,
      index: Number,
      extractedAnswer: String, // A, B, C, D if detected
    },
  ],
  explanation: String, // Giải thích đáp án
  imageUrl: String, // URL hình ảnh
  imageData: {
    originalUrl: String,    // Direct image URL
    localPath: String,      // Local file path
    filename: String,       // File name
    fileSize: Number,       // In bytes
    downloadedAt: Date,
    downloadSuccess: {
        type: Boolean,
        default: false
    }
},
  difficulty: {
    type: String,
    enum: ["EASY", "MEDIUM", "HARD"],
    default: "MEDIUM",
  },
  defaultPoints: {
    type: Number,
    default: 1,
  },
  tags: [String], // ['android', 'activity', 'lifecycle']

  // METADATA
  usageCount: {
    type: Number,
    default: 0,
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// ========================================
// EXAM QUESTION - Câu hỏi trong đề thi
// ========================================
const examQuestionSchema = new mongoose.Schema({
  examId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam",
    required: true,
  },
  questionBankId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "QuestionBank",
    required: true,
  },
  questionNumber: {
    type: Number,
    required: true,
  }, // Thứ tự trong đề: 1, 2, 3...

  // OVERRIDE từ QuestionBank nếu cần
  customQuestionText: String, // Nếu muốn chỉnh sửa
  customPoints: Number, // Override điểm
  customExplanation: String, // Override giải thích

  // CACHE cho performance
  subjectCode: String,
  examTypeCode: String,
  semester: String,

  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// ========================================
// INDEXES
// ========================================

// QuestionBank indexes
questionBankSchema.index({ subjectCode: 1, examTypeCode: 1 });
questionBankSchema.index({ tags: 1 });
questionBankSchema.index({ difficulty: 1, subjectCode: 1 });
questionBankSchema.index({ usageCount: 1 });
questionBankSchema.index({ createdBy: 1 });

// ExamQuestion indexes
examQuestionSchema.index({ examId: 1, questionNumber: 1 }, { unique: true });
examQuestionSchema.index({ examId: 1, questionBankId: 1 }, { unique: true });
examQuestionSchema.index({ questionBankId: 1 });
examQuestionSchema.index({ semester: 1, subjectCode: 1, examTypeCode: 1 });

// ========================================
// VIRTUAL FIELDS
// ========================================

// Lấy questionText từ QuestionBank hoặc custom
examQuestionSchema.virtual("finalQuestionText").get(function () {
  return this.customQuestionText || this.questionBank?.questionText;
});

examQuestionSchema.virtual("finalPoints").get(function () {
  return this.customPoints || this.questionBank?.defaultPoints || 1;
});

examQuestionSchema.virtual("finalExplanation").get(function () {
  return this.customExplanation || this.questionBank?.explanation;
});

// Populate questionBank by default
examQuestionSchema.pre(/^find/, function () {
  this.populate("questionBankId");
});

// ========================================
// MIDDLEWARE
// ========================================

// Update usageCount khi tạo ExamQuestion
examQuestionSchema.post("save", async function () {
  if (this.isNew) {
    await mongoose
      .model("QuestionBank")
      .findByIdAndUpdate(this.questionBankId, { $inc: { usageCount: 1 } });
  }
});

// Decrease usageCount khi xóa ExamQuestion
examQuestionSchema.post("findOneAndDelete", async function (doc) {
  if (doc) {
    await mongoose
      .model("QuestionBank")
      .findByIdAndUpdate(doc.questionBankId, { $inc: { usageCount: -1 } });
  }
});

// Update timestamp
questionBankSchema.pre("save", function () {
  this.updatedAt = Date.now();
});

// ========================================
// EXPORT MODELS
// ========================================

const QuestionBank = mongoose.model("QuestionBank", questionBankSchema);
const ExamQuestion = mongoose.model("ExamQuestion", examQuestionSchema);

module.exports = {
  QuestionBank,
  ExamQuestion,
};
