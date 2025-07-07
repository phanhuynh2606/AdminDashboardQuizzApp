// ========================================
// EXAM SERVICE - Quản lý tạo đề thi
// ========================================

const { QuestionBank, ExamQuestion } = require('../models/question.model');
const Exam = require('../models/exam.model');

class ExamService {
  
  /**
   * TẠO ĐỀ THI TỪ QUESTION BANK
   */
  static async createExamFromQuestionBank(examData, selectedQuestionIds) {
    try {
      // 1. Tạo exam
      const newExam = new Exam(examData);
      await newExam.save();
      
      // 2. Thêm questions vào exam
      const examQuestions = [];
      
      for (let i = 0; i < selectedQuestionIds.length; i++) {
        const questionBankId = selectedQuestionIds[i];
        
        const examQuestion = new ExamQuestion({
          examId: newExam._id,
          questionBankId: questionBankId,
          questionNumber: i + 1,
          subjectCode: examData.subjectCode,
          examTypeCode: examData.examTypeCode,
          semester: examData.semester
        });
        
        await examQuestion.save();
        examQuestions.push(examQuestion);
      }
      
      // 3. Cập nhật tổng số câu hỏi
      await Exam.findByIdAndUpdate(newExam._id, {
        totalQuestions: examQuestions.length
      });
      
      return {
        exam: newExam,
        questions: examQuestions
      };
      
    } catch (error) {
      throw new Error(`Error creating exam: ${error.message}`);
    }
  }
  
  /**
   * LẤY QUESTION BANK ĐỂ CHỌN
   */
  static async getAvailableQuestions(filters = {}) {
    const query = { isActive: true, ...filters };
    
    return await QuestionBank.find(query)
      .sort({ usageCount: 1, createdAt: -1 })
      .lean();
  }
  
  /**
   * LẤY CÂU HỎI CỦA ĐỀ THI (có đầy đủ thông tin)
   */
  static async getExamQuestions(examId) {
    return await ExamQuestion.find({ examId, isActive: true })
      .populate('questionBankId')
      .sort({ questionNumber: 1 })
      .lean();
  }
  
  /**
   * THÊM CÂU HỎI VÀO ĐỀ THI
   */
  static async addQuestionToExam(examId, questionBankId, customData = {}) {
    // Lấy số thứ tự tiếp theo
    const lastQuestion = await ExamQuestion.findOne({ examId })
      .sort({ questionNumber: -1 })
      .lean();
    
    const nextNumber = lastQuestion ? lastQuestion.questionNumber + 1 : 1;
    
    // Lấy thông tin exam để cache
    const exam = await Exam.findById(examId).lean();
    
    const examQuestion = new ExamQuestion({
      examId,
      questionBankId,
      questionNumber: nextNumber,
      subjectCode: exam.subjectCode,
      examTypeCode: exam.examTypeCode,
      semester: exam.semester,
      ...customData
    });
    
    await examQuestion.save();
    
    // Cập nhật tổng số câu hỏi
    await this.updateExamQuestionCount(examId);
    
    return examQuestion;
  }
  
  /**
   * XÓA CÂU HỎI KHỎI ĐỀ THI
   */
  static async removeQuestionFromExam(examId, questionNumber) {
    await ExamQuestion.findOneAndDelete({ examId, questionNumber });
    
    // Cập nhật lại số thứ tự các câu hỏi
    await this.reorderExamQuestions(examId);
    
    // Cập nhật tổng số câu hỏi
    await this.updateExamQuestionCount(examId);
  }
  
  /**
   * SẮP XẾP LẠI THỨ TỰ CÂU HỎI
   */
  static async reorderExamQuestions(examId) {
    const questions = await ExamQuestion.find({ examId, isActive: true })
      .sort({ questionNumber: 1 });
    
    for (let i = 0; i < questions.length; i++) {
      await ExamQuestion.findByIdAndUpdate(questions[i]._id, {
        questionNumber: i + 1
      });
    }
  }
  
  /**
   * CẬP NHẬT TỔNG SỐ CÂU HỎI TRONG EXAM
   */
  static async updateExamQuestionCount(examId) {
    const count = await ExamQuestion.countDocuments({ examId, isActive: true });
    await Exam.findByIdAndUpdate(examId, { totalQuestions: count });
    return count;
  }
  
  /**
   * COPY ĐỀ THI
   */
  static async copyExam(sourceExamId, newExamData) {
    // Lấy exam gốc
    const sourceExam = await Exam.findById(sourceExamId).lean();
    if (!sourceExam) throw new Error('Source exam not found');
    
    // Tạo exam mới
    const newExam = new Exam({
      ...sourceExam,
      _id: undefined,
      examTitle: newExamData.examTitle,
      examCode: newExamData.examCode,
      ...newExamData,
      createdAt: new Date()
    });
    await newExam.save();
    
    // Copy questions
    const sourceQuestions = await ExamQuestion.find({ 
      examId: sourceExamId, 
      isActive: true 
    }).sort({ questionNumber: 1 });
    
    for (const question of sourceQuestions) {
      const newQuestion = new ExamQuestion({
        ...question.toObject(),
        _id: undefined,
        examId: newExam._id,
        semester: newExam.semester,
        subjectCode: newExam.subjectCode,
        examTypeCode: newExam.examTypeCode,
        createdAt: new Date()
      });
      await newQuestion.save();
    }
    
    return newExam;
  }
}

module.exports = ExamService;

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// 1. TẠO ĐỀ THI MỚI
const examData = {
  examTitle: "PRM392 Final Exam - Spring 2025",
  examCode: "PRM392_FE_SPRING25",
  subjectId: ObjectId("..."),
  subjectCode: "PRM392",
  semester: "SPRING25",
  examTypeId: ObjectId("..."),
  examTypeCode: "FE",
  duration: 90
};

const selectedQuestions = [
  ObjectId("questionbank1"),
  ObjectId("questionbank2"),
  ObjectId("questionbank3")
];

const result = await ExamService.createExamFromQuestionBank(examData, selectedQuestions);

// 2. LẤY QUESTION BANK ĐỂ CHỌN
const questions = await ExamService.getAvailableQuestions({
  subjectCode: "PRM392",
  examTypeCode: "FE",
  difficulty: "MEDIUM"
});

// 3. LẤY CÂU HỎI CỦA ĐỀ THI
const examQuestions = await ExamService.getExamQuestions(examId);

// 4. THÊM CÂU HỎI VÀO ĐỀ THI
await ExamService.addQuestionToExam(examId, questionBankId, {
  customPoints: 2,
  customQuestionText: "Modified question text"
});

// 5. COPY ĐỀ THI
const newExam = await ExamService.copyExam(sourceExamId, {
  examTitle: "New Exam Title",
  examCode: "NEW_CODE",
  semester: "SUMMER25"
});
*/
