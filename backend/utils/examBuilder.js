// ========================================
// EXAM MANAGEMENT HELPER
// ========================================

const { Question } = require('../models');

class ExamBuilder {
  
  /**
   * TẠO ĐỀ THI TỪ QUESTION TEMPLATES
   * @param {Object} examData - Thông tin đề thi
   * @param {Array} selectedQuestions - Danh sách question IDs được chọn
   */
  static async createExamFromTemplates(examData, selectedQuestions) {
    const { Exam, Question } = require('../models');
    
    try {
      // 1. Tạo exam
      const newExam = new Exam(examData);
      await newExam.save();
      
      // 2. Copy questions và gán vào exam
      const examQuestions = [];
      
      for (let i = 0; i < selectedQuestions.length; i++) {
        const templateQuestion = await Question.findById(selectedQuestions[i]);
        
        if (!templateQuestion) continue;
        
        // Tạo câu hỏi mới cho đề thi
        const examQuestion = new Question({
          questionText: templateQuestion.questionText,
          questionNumber: i + 1,
          examId: newExam._id,
          originalQuestionId: templateQuestion._id, // Liên kết với template
          semester: examData.semester,
          subjectCode: examData.subjectCode,
          examTypeCode: examData.examTypeCode,
          answers: templateQuestion.answers,
          explanation: templateQuestion.explanation,
          imageUrl: templateQuestion.imageUrl,
          difficulty: templateQuestion.difficulty,
          points: templateQuestion.points,
          questionType: 'EXAM_QUESTION',
          tags: templateQuestion.tags
        });
        
        await examQuestion.save();
        examQuestions.push(examQuestion);
        
        // Cập nhật usage count cho template
        await Question.findByIdAndUpdate(
          templateQuestion._id,
          { $inc: { usageCount: 1 } }
        );
      }
      
      // 3. Cập nhật tổng số câu hỏi trong exam
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
   * LẤY DANH SÁCH QUESTION TEMPLATES ĐỂ CHỌN
   */
  static async getQuestionTemplates(filters = {}) {
    const query = {
      questionType: 'TEMPLATE',
      isActive: true,
      ...filters
    };
    
    return await Question.find(query)
      .sort({ usageCount: 1, createdAt: -1 }) // Ưu tiên câu ít dùng
      .select('-examId'); // Không cần examId cho template
  }
  
  /**
   * COPY QUESTIONS TỪ ĐỀ THI KHÁC
   */
  static async copyQuestionsFromExam(sourceExamId, targetExamId) {
    const sourceQuestions = await Question.find({
      examId: sourceExamId,
      questionType: 'EXAM_QUESTION',
      isActive: true
    }).sort({ questionNumber: 1 });
    
    const targetExam = await Exam.findById(targetExamId);
    if (!targetExam) throw new Error('Target exam not found');
    
    const copiedQuestions = [];
    
    for (let i = 0; i < sourceQuestions.length; i++) {
      const source = sourceQuestions[i];
      
      const copiedQuestion = new Question({
        questionText: source.questionText,
        questionNumber: i + 1,
        examId: targetExamId,
        originalQuestionId: source.originalQuestionId || source._id,
        semester: targetExam.semester,
        subjectCode: targetExam.subjectCode,
        examTypeCode: targetExam.examTypeCode,
        answers: source.answers,
        explanation: source.explanation,
        imageUrl: source.imageUrl,
        difficulty: source.difficulty,
        points: source.points,
        questionType: 'EXAM_QUESTION',
        tags: source.tags
      });
      
      await copiedQuestion.save();
      copiedQuestions.push(copiedQuestion);
    }
    
    // Cập nhật tổng số câu hỏi
    await Exam.findByIdAndUpdate(targetExamId, {
      totalQuestions: copiedQuestions.length
    });
    
    return copiedQuestions;
  }
}

module.exports = ExamBuilder;

// ========================================
// USAGE EXAMPLES
// ========================================

/*
// 1. TẠO ĐỀ THI TỪ QUESTION TEMPLATES
const examData = {
  examTitle: "PRM392 Final Exam - Spring 2025",
  examCode: "PRM392_FE_SPRING25",
  subjectId: "...",
  subjectCode: "PRM392",
  semester: "SPRING25",
  examTypeId: "...",
  examTypeCode: "FE",
  duration: 90
};

const selectedTemplateIds = [
  "question_template_1_id",
  "question_template_2_id",
  "question_template_3_id"
];

const result = await ExamBuilder.createExamFromTemplates(examData, selectedTemplateIds);

// 2. LẤY QUESTION TEMPLATES ĐỂ CHỌN
const templates = await ExamBuilder.getQuestionTemplates({
  subjectCode: "PRM392",
  examTypeCode: "FE",
  difficulty: "MEDIUM"
});

// 3. COPY TỪ ĐỀ THI KHÁC
await ExamBuilder.copyQuestionsFromExam(sourceExamId, targetExamId);
*/
