const { Exam, ExamQuestion, QuestionBank, ExamType, PracticeHistory } = require('../models');
const Subject = require('../models/subject.model');
const { ActivityLog } = require('../models');
const mongoose = require('mongoose');

// @desc    Get all exams with pagination and filters
// @route   GET /api/admin/exams
// @access  Private/Admin/Web
const getExams = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      semester = 'all',
      subject = 'all',
      examType = 'all',
      status = 'all',
      published = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Semester filter
    if (semester !== 'all') {
      filter.semester = semester;
    }

    // Subject filter
    if (subject !== 'all') {
      try {
        filter.subjectId = new mongoose.Types.ObjectId(subject);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'ID môn học không hợp lệ'
        });
      }
    }

    // Exam type filter
    if (examType !== 'all') {
      try {
        filter.examTypeId = new mongoose.Types.ObjectId(examType);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'ID loại đề thi không hợp lệ'
        });
      }
    }

    // Status filter
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }

    // Published filter
    if (published !== 'all') {
      filter.isPublished = published === 'published';
    }

    // Search filter
    if (search) {
      filter.$or = [
        { examTitle: { $regex: search, $options: 'i' } },
        { examCode: { $regex: search, $options: 'i' } },
        { subjectCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query with subject and exam type population
    const [exams, total] = await Promise.all([
      Exam.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'subjects',
            localField: 'subjectId',
            foreignField: '_id',
            as: 'subject'
          }
        },
        {
          $lookup: {
            from: 'examtypes',
            localField: 'examTypeId',
            foreignField: '_id',
            as: 'examType'
          }
        },
        {
          $lookup: {
            from: 'examquestions',
            localField: '_id',
            foreignField: 'examId',
            as: 'questions'
          }
        },
        {
          $addFields: {
            subject: { $arrayElemAt: ['$subject', 0] },
            examType: { $arrayElemAt: ['$examType', 0] },
            totalQuestions: { $size: '$questions' }
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum }
      ]),
      Exam.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        exams,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasNextPage,
          hasPrevPage
        }
      }
    });

  } catch (error) {
    console.error('Get exams error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đề thi',
      error: error.message
    });
  }
};

// @desc    Get exam by ID
// @route   GET /api/admin/exams/:id
// @access  Private/Admin/Web
const getExamById = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id)
      .populate('subjectId', 'subjectCode subjectName semester')
      .populate('examTypeId', 'typeName typeCode description');

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    // Get question count for this exam
    const questionCount = await ExamQuestion.countDocuments({ examId: exam._id });

    res.json({
      success: true,
      data: {
        ...exam.toObject(),
        questionCount
      }
    });

  } catch (error) {
    console.error('Get exam by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin đề thi',
      error: error.message
    });
  }
};

// @desc    Get exams for student by Subject ID
// @route   GET /api/student/exams
// @access  Private/Student
const getExamsForStudent = async (req, res) => {
  try {
    const { subjectId } = req.params;
    if (!subjectId) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học không được để trống'
      });
    }
    const exams = await Exam.find({ subjectId, isActive: true, isPublished: true })
      .populate('subjectId', 'subjectCode subjectName semester')
      .populate('examTypeId', 'typeName typeCode description')
      .sort({ createdAt: -1 });
    if (exams.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi cho môn học này'
      });
    }
    res.json({
      success: true,
      data: exams
    });
  } catch (error) {
    console.error('Get exams for student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách đề thi cho sinh viên',
      error: error.message
    });
  }
};

// @desc    Create new exam
// @route   POST /api/admin/exams
// @access  Private/Admin/Web
const createExam = async (req, res) => {
  try {
    const {
      examTitle,
      examCode,
      subjectId,
      examTypeId,
      description,
      duration,
      isActive = true
    } = req.body;

    // Check if subject exists
    const subject = await Subject.findById(subjectId).populate('semester');
    if (!subject) {
      return res.status(400).json({
        success: false,
        message: 'Môn học không tồn tại'
      });
    }

    // Check if exam type exists
    const examType = await ExamType.findById(examTypeId);
    if (!examType) {
      return res.status(400).json({
        success: false,
        message: 'Loại đề thi không tồn tại'
      });
    }

    // Check if exam code exists
    const existingExam = await Exam.findOne({ examCode });
    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: 'Mã đề thi đã tồn tại'
      });
    }

    // Create exam
    const exam = await Exam.create({
      examTitle,
      examCode: examCode.toUpperCase(),
      subjectId,
      subjectCode: subject.subjectCode,
      semester: subject.semester.name,
      examTypeId,
      examTypeCode: examType.typeCode,
      description,
      duration,
      isActive
    });

    // Populate for response
    await exam.populate([
      { path: 'subjectId', select: 'subjectCode subjectName semester' },
      { path: 'examTypeId', select: 'typeName typeCode description' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_exam',
      actionType: 'create',
      resource: 'exam',
      resourceId: exam._id.toString(),
      description: `Tạo đề thi: ${exam.examCode} - ${exam.examTitle}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo đề thi thành công',
      data: exam
    });

  } catch (error) {
    console.error('Create exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo đề thi',
      error: error.message
    });
  }
};

// @desc    Update exam
// @route   PUT /api/admin/exams/:id
// @access  Private/Admin/Web
const updateExam = async (req, res) => {
  try {
    const {
      examTitle,
      examCode,
      subjectId,
      examTypeId,
      description,
      duration,
      isActive
    } = req.body;

    // Check if exam exists
    const existingExam = await Exam.findById(req.params.id);
    if (!existingExam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    // Check if exam code is unique (excluding current exam)
    if (examCode && examCode !== existingExam.examCode) {
      const duplicateExam = await Exam.findOne({
        examCode: examCode.toUpperCase(),
        _id: { $ne: req.params.id }
      });
      if (duplicateExam) {
        return res.status(400).json({
          success: false,
          message: 'Mã đề thi đã tồn tại'
        });
      }
    }

    const updateData = {};
    if (examTitle) updateData.examTitle = examTitle;
    if (examCode) updateData.examCode = examCode.toUpperCase();
    if (description !== undefined) updateData.description = description;
    if (duration) updateData.duration = duration;
    if (isActive !== undefined) updateData.isActive = isActive;

    // Update subject and exam type if changed
    if (subjectId && subjectId !== existingExam.subjectId.toString()) {
      const subject = await Subject.findById(subjectId).populate('semester');
      if (!subject) {
        return res.status(400).json({
          success: false,
          message: 'Môn học không tồn tại'
        });
      }
      updateData.subjectId = subjectId;
      updateData.subjectCode = subject.subjectCode;
      updateData.semester = subject.semester.name;
    }

    if (examTypeId && examTypeId !== existingExam.examTypeId.toString()) {
      const examType = await ExamType.findById(examTypeId);
      if (!examType) {
        return res.status(400).json({
          success: false,
          message: 'Loại đề thi không tồn tại'
        });
      }
      updateData.examTypeId = examTypeId;
      updateData.examTypeCode = examType.typeCode;
    }

    const exam = await Exam.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate([
      { path: 'subjectId', select: 'subjectCode subjectName semester' },
      { path: 'examTypeId', select: 'typeName typeCode description' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_exam',
      actionType: 'update',
      resource: 'exam',
      resourceId: exam._id.toString(),
      description: `Cập nhật đề thi: ${exam.examCode} - ${exam.examTitle}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Cập nhật đề thi thành công',
      data: exam
    });

  } catch (error) {
    console.error('Update exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật đề thi',
      error: error.message
    });
  }
};

// @desc    Delete exam
// @route   DELETE /api/admin/exams/:id
// @access  Private/Admin/Web
const deleteExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    // Check if exam has questions
    const questionCount = await ExamQuestion.countDocuments({ examId: exam._id });
    if (questionCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa đề thi vì có ${questionCount} câu hỏi đang sử dụng`
      });
    }

    await Exam.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'delete_exam',
      actionType: 'delete',
      resource: 'exam',
      resourceId: exam._id.toString(),
      description: `Xóa đề thi: ${exam.examCode} - ${exam.examTitle}`,
      importance: 'high',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Xóa đề thi thành công'
    });

  } catch (error) {
    console.error('Delete exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa đề thi',
      error: error.message
    });
  }
};

// @desc    Toggle exam status
// @route   PATCH /api/admin/exams/:id/toggle-status
// @access  Private/Admin/Web
const toggleExamStatus = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isActive: !exam.isActive },
      { new: true }
    ).populate([
      { path: 'subjectId', select: 'subjectCode subjectName' },
      { path: 'examTypeId', select: 'typeName typeCode' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'toggle_exam_status',
      actionType: 'update',
      resource: 'exam',
      resourceId: exam._id.toString(),
      description: `${updatedExam.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} đề thi: ${exam.examCode} - ${exam.examTitle}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `${updatedExam.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} đề thi thành công`,
      data: updatedExam
    });

  } catch (error) {
    console.error('Toggle exam status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái đề thi',
      error: error.message
    });
  }
};

// @desc    Toggle exam published status
// @route   PATCH /api/admin/exams/:id/toggle-published
// @access  Private/Admin/Web
const toggleExamPublished = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);

    if (!exam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    const updatedExam = await Exam.findByIdAndUpdate(
      req.params.id,
      { isPublished: !exam.isPublished },
      { new: true }
    ).populate([
      { path: 'subjectId', select: 'subjectCode subjectName' },
      { path: 'examTypeId', select: 'typeName typeCode' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'toggle_exam_published',
      actionType: 'update',
      resource: 'exam',
      resourceId: exam._id.toString(),
      description: `${updatedExam.isPublished ? 'Xuất bản' : 'Hủy xuất bản'} đề thi: ${exam.examCode} - ${exam.examTitle}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `${updatedExam.isPublished ? 'Xuất bản' : 'Hủy xuất bản'} đề thi thành công`,
      data: updatedExam
    });

  } catch (error) {
    console.error('Toggle exam published error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái xuất bản đề thi',
      error: error.message
    });
  }
};

// @desc    Get exam statistics
// @route   GET /api/admin/exams/stats
// @access  Private/Admin/Web
const getExamStats = async (req, res) => {
  try {
    const [
      totalExams,
      activeExams,
      publishedExams,
      totalQuestions
    ] = await Promise.all([
      Exam.countDocuments(),
      Exam.countDocuments({ isActive: true }),
      Exam.countDocuments({ isPublished: true }),
      ExamQuestion.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalExams,
        activeExams,
        inactiveExams: totalExams - activeExams,
        publishedExams,
        unpublishedExams: totalExams - publishedExams,
        totalQuestions
      }
    });

  } catch (error) {
    console.error('Get exam stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê đề thi',
      error: error.message
    });
  }
};

// @desc    Get exam types
// @route   GET /api/admin/exam-types
// @access  Private/Admin/Web
const getExamTypes = async (req, res) => {
  try {
    const examTypes = await ExamType.find({ isActive: true })
      .sort({ typeCode: 1 })
      .select('typeName typeCode description');

    res.json({
      success: true,
      data: examTypes
    });

  } catch (error) {
    console.error('Get exam types error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách loại đề thi',
      error: error.message
    });
  }
};

// @desc    Duplicate exam
// @route   POST /api/admin/exams/:id/duplicate
// @access  Private/Admin/Web
const duplicateExam = async (req, res) => {
  try {
    const { examTitle, examCode } = req.body;

    const originalExam = await Exam.findById(req.params.id);
    if (!originalExam) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy đề thi'
      });
    }

    // Check if new exam code exists
    const existingExam = await Exam.findOne({ examCode: examCode.toUpperCase() });
    if (existingExam) {
      return res.status(400).json({
        success: false,
        message: 'Mã đề thi đã tồn tại'
      });
    }

    // Create duplicate exam
    const duplicatedExam = await Exam.create({
      examTitle: examTitle || `${originalExam.examTitle} - Copy`,
      examCode: examCode.toUpperCase(),
      subjectId: originalExam.subjectId,
      subjectCode: originalExam.subjectCode,
      semester: originalExam.semester,
      examTypeId: originalExam.examTypeId,
      examTypeCode: originalExam.examTypeCode,
      description: originalExam.description,
      duration: originalExam.duration,
      isActive: false,
      isPublished: false
    });

    // Copy questions from original exam
    const originalQuestions = await ExamQuestion.find({ examId: originalExam._id });
    const questionCopies = originalQuestions.map(question => ({
      examId: duplicatedExam._id,
      questionBankId: question.questionBankId,
      questionNumber: question.questionNumber,
      customQuestionText: question.customQuestionText,
      customPoints: question.customPoints,
      customExplanation: question.customExplanation,
      subjectCode: question.subjectCode,
      examTypeCode: question.examTypeCode,
      semester: question.semester
    }));

    if (questionCopies.length > 0) {
      await ExamQuestion.insertMany(questionCopies);
      await Exam.findByIdAndUpdate(duplicatedExam._id, {
        totalQuestions: questionCopies.length
      });
    }

    await duplicatedExam.populate([
      { path: 'subjectId', select: 'subjectCode subjectName' },
      { path: 'examTypeId', select: 'typeName typeCode' }
    ]);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'duplicate_exam',
      actionType: 'create',
      resource: 'exam',
      resourceId: duplicatedExam._id.toString(),
      description: `Sao chép đề thi ${originalExam.examCode} thành ${duplicatedExam.examCode}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Sao chép đề thi thành công',
      data: duplicatedExam
    });

  } catch (error) {
    console.error('Duplicate exam error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi sao chép đề thi',
      error: error.message
    });
  }
};
const savePracticeHistory = async (req, res) => {
  try {
    const {
      examId, 
      subjectCode,
      examTypeCode,
      userSessionId,
      startTime,
      endTime,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent,
      answers,
      isCompleted
    } = req.body;

    const history = new PracticeHistory({
      examId, 
      subjectCode,
      examTypeCode,
      userSessionId,
      startTime,
      endTime,
      totalQuestions,
      correctAnswers,
      score,
      timeSpent,
      answers,
      isCompleted
    });

    await history.save();
    res.status(201).json({ success: true, data: history });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, error: 'Server Error' });
  }
};
module.exports = {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  toggleExamStatus,
  toggleExamPublished,
  getExamStats,
  getExamTypes,
  duplicateExam,
  getExamsForStudent,
  savePracticeHistory
}; 
