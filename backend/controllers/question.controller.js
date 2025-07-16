const { QuestionBank, ExamQuestion } = require('../models');
const { ActivityLog } = require('../models');
const multer = require('multer');
const path = require('path');

// Configure multer for image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/questions/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'question-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Chỉ chấp nhận file hình ảnh!'), false);
    }
  }
});

// @desc    Get all questions with pagination and filters
// @route   GET /api/admin/questions
// @access  Private/Admin/Web
const getQuestions = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      subjectCode = 'all',
      examType = 'all',
      difficulty = 'all',
      tags = '',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Status filter
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    // Subject code filter
    if (subjectCode !== 'all') {
      filter.subjectCode = subjectCode;
    }
    
    // Exam type filter
    if (examType !== 'all') {
      filter.examTypeCode = examType;
    }
    
    // Difficulty filter
    if (difficulty !== 'all') {
      filter.difficulty = difficulty;
    }
    
    // Tags filter
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      filter.tags = { $in: tagArray };
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { questionText: { $regex: search, $options: 'i' } },
        { explanation: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // Pagination
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    // Sort order
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    // Execute query
    const [questions, total] = await Promise.all([
      QuestionBank.find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'fullName email')
        .lean(),
      QuestionBank.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        questions,
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
    console.error('Get questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách câu hỏi',
      error: error.message
    });
  }
};

// @desc    Get question by ID
// @route   GET /api/admin/questions/:id
// @access  Private/Admin/Web
const getQuestionById = async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id)
      .populate('createdBy', 'fullName email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }

    // Get usage count in exams
    const usageCount = await ExamQuestion.countDocuments({ 
      questionBankId: question._id 
    });

    res.json({
      success: true,
      data: {
        ...question.toObject(),
        actualUsageCount: usageCount
      }
    });

  } catch (error) {
    console.error('Get question by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin câu hỏi',
      error: error.message
    });
  }
};

// @desc    Create new question
// @route   POST /api/admin/questions
// @access  Private/Admin/Web
const createQuestion = async (req, res) => {
  try {
    const {
      questionText,
      subjectCode,
      examTypeCode,
      options,
      correctAnswer,
      explanation,
      difficulty = 'MEDIUM',
      defaultPoints = 1,
      tags = []
    } = req.body;

    // Validate options for multiple choice
    if (!options || !Array.isArray(options) || options.length < 2) {
      return res.status(400).json({
        success: false,
        message: 'Câu hỏi phải có ít nhất 2 lựa chọn'
      });
    }

    // Validate correct answer
    if (!correctAnswer || !correctAnswer.answers || correctAnswer.answers.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Phải chọn ít nhất một đáp án đúng'
      });
    }
    correctAnswer.answer =  correctAnswer.answers[0]; // Set first answer as default if not specified
    // Create question
    const question = await QuestionBank.create({
      questionText,
      subjectCode: subjectCode.toUpperCase(),
      examTypeCode: examTypeCode.toUpperCase(),
      options,
      correctAnswer,
      explanation,
      difficulty,
      defaultPoints,
      tags: Array.isArray(tags) ? tags : [tags].filter(Boolean),
      createdBy: req.user._id
    });

    await question.populate('createdBy', 'fullName email');

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_question',
      actionType: 'create',
      resource: 'question',
      resourceId: question._id.toString(),
      description: `Tạo câu hỏi cho ${question.subjectCode} - ${question.examTypeCode}`,
      importance: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo câu hỏi thành công',
      data: question
    });

  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo câu hỏi',
      error: error.message
    });
  }
};

// @desc    Update question
// @route   PUT /api/admin/questions/:id
// @access  Private/Admin/Web
const updateQuestion = async (req, res) => {
  try {
    const {
      questionText,
      subjectCode,
      examTypeCode,
      options,
      correctAnswer,
      explanation,
      difficulty,
      defaultPoints,
      tags
    } = req.body;

    const updateData = {};
    if (questionText) updateData.questionText = questionText;
    if (subjectCode) updateData.subjectCode = subjectCode.toUpperCase();
    if (examTypeCode) updateData.examTypeCode = examTypeCode.toUpperCase();
    if (options) updateData.options = options;
    if (correctAnswer) {
      correctAnswer.answer = correctAnswer.answers[0]; // Set first answer as default if not specified
      updateData.correctAnswer = correctAnswer;
    }
    if (explanation !== undefined) updateData.explanation = explanation;
    if (difficulty) updateData.difficulty = difficulty;
    if (defaultPoints !== undefined) updateData.defaultPoints = defaultPoints;
    if (tags !== undefined) updateData.tags = Array.isArray(tags) ? tags : [tags].filter(Boolean);

    const question = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('createdBy', 'fullName email');

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_question',
      actionType: 'update',
      resource: 'question',
      resourceId: question._id.toString(),
      description: `Cập nhật câu hỏi cho ${question.subjectCode} - ${question.examTypeCode}`,
      importance: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Cập nhật câu hỏi thành công',
      data: question
    });

  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật câu hỏi',
      error: error.message
    });
  }
};

// @desc    Delete question
// @route   DELETE /api/admin/questions/:id
// @access  Private/Admin/Web
const deleteQuestion = async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }

    // Check if question is used in any exams
    const usageCount = await ExamQuestion.countDocuments({ 
      questionBankId: question._id 
    });
    
    if (usageCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa câu hỏi vì đang được sử dụng trong ${usageCount} đề thi`
      });
    }

    await QuestionBank.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'delete_question',
      actionType: 'delete',
      resource: 'question',
      resourceId: question._id.toString(),
      description: `Xóa câu hỏi cho ${question.subjectCode} - ${question.examTypeCode}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Xóa câu hỏi thành công'
    });

  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa câu hỏi',
      error: error.message
    });
  }
};

// @desc    Toggle question status
// @route   PATCH /api/admin/questions/:id/toggle-status
// @access  Private/Admin/Web
const toggleQuestionStatus = async (req, res) => {
  try {
    const question = await QuestionBank.findById(req.params.id);

    if (!question) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }

    const updatedQuestion = await QuestionBank.findByIdAndUpdate(
      req.params.id,
      { isActive: !question.isActive },
      { new: true }
    );

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'toggle_question_status',
      actionType: 'update',
      resource: 'question',
      resourceId: question._id.toString(),
      description: `${updatedQuestion.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} câu hỏi ${question.subjectCode}`,
      importance: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `${updatedQuestion.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} câu hỏi thành công`,
      data: updatedQuestion
    });

  } catch (error) {
    console.error('Toggle question status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái câu hỏi',
      error: error.message
    });
  }
};

// @desc    Get question statistics
// @route   GET /api/admin/questions/stats
// @access  Private/Admin/Web
const getQuestionStats = async (req, res) => {
  try {
    const [
      totalQuestions,
      activeQuestions,
      questionsWithImage,
      questionsByDifficulty,
      questionsBySubject
    ] = await Promise.all([
      QuestionBank.countDocuments(),
      QuestionBank.countDocuments({ isActive: true }),
      QuestionBank.countDocuments({ imageUrl: { $ne: null } }),
      QuestionBank.aggregate([
        { $group: { _id: '$difficulty', count: { $sum: 1 } } }
      ]),
      QuestionBank.aggregate([
        { $group: { _id: '$subjectCode', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    const difficultyStats = {
      EASY: 0,
      MEDIUM: 0,
      HARD: 0
    };

    questionsByDifficulty.forEach(item => {
      difficultyStats[item._id] = item.count;
    });

    res.json({
      success: true,
      data: {
        totalQuestions,
        activeQuestions,
        inactiveQuestions: totalQuestions - activeQuestions,
        questionsWithImage,
        questionsWithoutImage: totalQuestions - questionsWithImage,
        difficultyStats,
        topSubjects: questionsBySubject
      }
    });

  } catch (error) {
    console.error('Get question stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê câu hỏi',
      error: error.message
    });
  }
};

// @desc    Get available tags
// @route   GET /api/admin/questions/tags
// @access  Private/Admin/Web
const getQuestionTags = async (req, res) => {
  try {
    const tags = await QuestionBank.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 50 }
    ]);

    res.json({
      success: true,
      data: tags.map(tag => ({
        name: tag._id,
        count: tag.count
      }))
    });

  } catch (error) {
    console.error('Get question tags error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách tags',
      error: error.message
    });
  }
};

// @desc    Bulk update questions
// @route   PATCH /api/admin/questions/bulk-update
// @access  Private/Admin/Web
const bulkUpdateQuestions = async (req, res) => {
  try {
    const { questionIds, updateData } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID câu hỏi không hợp lệ'
      });
    }

    const result = await QuestionBank.updateMany(
      { _id: { $in: questionIds } },
      updateData
    );

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'bulk_update_questions',
      actionType: 'update',
      resource: 'question',
      description: `Cập nhật hàng loạt ${result.modifiedCount} câu hỏi`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `Cập nhật thành công ${result.modifiedCount} câu hỏi`,
      data: { modifiedCount: result.modifiedCount }
    });

  } catch (error) {
    console.error('Bulk update questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật hàng loạt câu hỏi',
      error: error.message
    });
  }
};

// @desc    Bulk delete questions
// @route   DELETE /api/admin/questions/bulk-delete
// @access  Private/Admin/Web
const bulkDeleteQuestions = async (req, res) => {
  try {
    const { questionIds } = req.body;

    if (!questionIds || !Array.isArray(questionIds) || questionIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Danh sách ID câu hỏi không hợp lệ'
      });
    }

    // Check if any questions are used in exams
    const usedQuestions = await ExamQuestion.find({ 
      questionBankId: { $in: questionIds } 
    }).distinct('questionBankId');

    if (usedQuestions.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa vì có ${usedQuestions.length} câu hỏi đang được sử dụng trong đề thi`
      });
    }

    const result = await QuestionBank.deleteMany({
      _id: { $in: questionIds }
    });

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'bulk_delete_questions',
      actionType: 'delete',
      resource: 'question',
      description: `Xóa hàng loạt ${result.deletedCount} câu hỏi`,
      importance: 'high',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `Xóa thành công ${result.deletedCount} câu hỏi`
    });

  } catch (error) {
    console.error('Bulk delete questions error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa hàng loạt câu hỏi',
      error: error.message
    });
  }
};

// @desc    Duplicate question
// @route   POST /api/admin/questions/:id/duplicate
// @access  Private/Admin/Web
const duplicateQuestion = async (req, res) => {
  try {
    const { subjectCode, examTypeCode } = req.body;

    const originalQuestion = await QuestionBank.findById(req.params.id);
    if (!originalQuestion) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi'
      });
    }

    // Create duplicate
    const duplicatedQuestion = await QuestionBank.create({
      questionText: originalQuestion.questionText,
      subjectCode: subjectCode ? subjectCode.toUpperCase() : originalQuestion.subjectCode,
      examTypeCode: examTypeCode ? examTypeCode.toUpperCase() : originalQuestion.examTypeCode,
      options: originalQuestion.options,
      correctAnswer: originalQuestion.correctAnswer,
      explanation: originalQuestion.explanation,
      difficulty: originalQuestion.difficulty,
      defaultPoints: originalQuestion.defaultPoints,
      tags: [...originalQuestion.tags],
      createdBy: req.user._id,
      imageUrl: originalQuestion.imageUrl
    });

    await duplicatedQuestion.populate('createdBy', 'fullName email');

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'duplicate_question',
      actionType: 'create',
      resource: 'question',
      resourceId: duplicatedQuestion._id.toString(),
      description: `Sao chép câu hỏi từ ${originalQuestion.subjectCode} sang ${duplicatedQuestion.subjectCode}`,
      importance: 'low',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Sao chép câu hỏi thành công',
      data: duplicatedQuestion
    });

  } catch (error) {
    console.error('Duplicate question error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi sao chép câu hỏi',
      error: error.message
    });
  }
};
// @route   GET /api/student/questions/:subjectCode
// @access  Private/Student
const getQuestionsForStudent = async (req, res) => {
  try {
    const { subjectCode } = req.params;

    if (!subjectCode) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học không được để trống'
      });
    } 
    const questions = await QuestionBank.find({
      subjectCode: subjectCode.toUpperCase(),
      isActive: true
    }) 
    .sort({ createdAt: -1 })
    .lean();

    if (questions.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy câu hỏi nào cho môn học này'
      });
    }

    res.json({
      success: true,
      data: questions
    });

  } catch (error) {
    console.error('Get questions for student error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách câu hỏi cho sinh viên',
      error: error.message
    });
  }
};


module.exports = {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  getQuestionStats,
  getQuestionTags,
  bulkUpdateQuestions,
  bulkDeleteQuestions,
  duplicateQuestion,
  getQuestionsForStudent,
  upload
}; 