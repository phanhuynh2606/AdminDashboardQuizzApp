// ========================================
// INDEX FILE - XUẤT TẤT CẢ MODELS
// ========================================

const Semester = require('./semester.model');
const Subject = require('./subject.model');
const ExamType = require('./examType.model');
const Exam = require('./exam.model');
const { QuestionBank, ExamQuestion } = require('./question.model');
const PracticeHistory = require('./practiceHistory.model');
const User = require('./user.model');

module.exports = {
  Semester,
  Subject,
  ExamType,
  Exam,
  QuestionBank,
  ExamQuestion,
  PracticeHistory,
  User
};

// ========================================
// CÁCH TRUY CẬP DỮ LIỆU
// ========================================

/*
LUỒNG TRUY CẬP:
1. Lấy tất cả semester
2. User chọn semester → Hiển thị môn học của semester đó
3. User chọn môn → Hiển thị đề thi
4. User chọn đề → Hiển thị câu hỏi

1. LẤY TẤT CẢ SEMESTER:
const semesters = await Subject.aggregate([
  { $match: { isActive: true } },
  { $group: { 
    _id: '$semester', 
    semesterDisplay: { $first: '$semesterDisplay' },
    subjectCount: { $sum: 1 }
  }},
  { $sort: { _id: -1 } }
]);
// Kết quả: [
//   { _id: 'SPRING25', semesterDisplay: 'Kỳ 8', subjectCount: 5 },
//   { _id: 'SUMMER24', semesterDisplay: 'Kỳ 7', subjectCount: 4 }
// ]

2. LẤY MÔN HỌC THEO SEMESTER:
const subjects = await Subject.find({ 
  semester: 'SPRING25', 
  isActive: true 
})
.sort({ subjectCode: 1 });
// Kết quả: [
//   { subjectCode: 'EXE101', subjectName: 'Execution', semester: 'SPRING25', semesterDisplay: 'Kỳ 8' },
//   { subjectCode: 'PRM392', subjectName: 'Mobile Programming', semester: 'SPRING25', semesterDisplay: 'Kỳ 8' }
// ]

3. LẤY ĐỀ THI THEO SEMESTER VÀ MÔN:
const exams = await Exam.find({ 
  semester: 'SPRING25', 
  subjectCode: 'PRM392', 
  isActive: true, 
  isPublished: true 
})
.populate('examTypeId', 'typeName')
.sort({ examTypeCode: 1 });

4. LẤY CÂU HỎI THEO ĐỀ:
const questions = await Question.find({ 
  examId: examObjectId, 
  isActive: true 
})
.sort({ questionNumber: 1 });

5. QUERY TẤT CẢ MÔN HỌC CỦA TẤT CẢ KỲ:
const allSubjects = await Subject.find({ isActive: true })
.sort({ semester: -1, subjectCode: 1 });

6. KIỂM TRA MÔN HỌC CÓ TRONG KỲ NÀO:
const subjectInfo = await Subject.findOne({ 
  subjectCode: 'PRM392', 
  semester: 'SPRING25' 
});
*/
