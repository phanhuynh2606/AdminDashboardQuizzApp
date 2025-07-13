const Subject = require('../models/subject.model');
const Semester = require('../models/semester.model');
const { Exam } = require('../models');
const { ActivityLog } = require('../models');
const mongoose = require('mongoose');

// @desc    Get all subjects with pagination and filters
// @route   GET /api/admin/subjects
// @access  Private/Admin/Web
const getSubjects = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      semester = 'all',
      status = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};

    // Semester filter
    if (semester !== 'all') {
      // Convert string to ObjectId for proper filtering
      try {
        filter.semester = new mongoose.Types.ObjectId(semester);
      } catch (error) {
        return res.status(400).json({
          success: false,
          message: 'ID học kỳ không hợp lệ'
        });
      }
    }

    // Status filter
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }

    // Search filter
    if (search) {
      filter.$or = [
        { subjectCode: { $regex: search, $options: 'i' } },
        { subjectName: { $regex: search, $options: 'i' } },
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

    // Execute query with exam count and semester population
    const [subjects, total] = await Promise.all([
      Subject.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'semesters',
            localField: 'semester',
            foreignField: '_id',
            as: 'semester'
          }
        },
        {
          $lookup: {
            from: 'exams',
            localField: '_id',
            foreignField: 'subjectId',
            as: 'exams'
          }
        },
        {
          $addFields: {
            semester: { $arrayElemAt: ['$semester', 0] },
            examCount: { $size: '$exams' }
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum }
      ]),
      Subject.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        subjects,
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
    console.error('Get subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách môn học',
      error: error.message
    });
  }
};

// @desc    Get subject by ID
// @route   GET /api/admin/subjects/:id
// @access  Private/Admin/Web
const getSubjectById = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id).populate('semester', 'name description');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    // Get exam count for this subject
    const examCount = await Exam.countDocuments({ subjectId: subject._id });

    res.json({
      success: true,
      data: {
        ...subject.toObject(),
        examCount
      }
    });

  } catch (error) {
    console.error('Get subject by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin môn học',
      error: error.message
    });
  }
};

// @desc    Create new subject
// @route   POST /api/admin/subjects
// @access  Private/Admin/Web
const createSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, semester, description, link, isActive = true } = req.body;

    // Check if semester exists
    const semesterDoc = await Semester.findById(semester);
    if (!semesterDoc) {
      return res.status(400).json({
        success: false,
        message: 'Học kỳ không tồn tại'
      });
    }

    // Check if subject code exists in the same semester
    const existingSubject = await Subject.findOne({ subjectCode, semester });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Mã môn học đã tồn tại trong học kỳ này'
      });
    }

    // Create subject
    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      semester,
      description,
      link,
      isActive
    });

    // Populate semester info for response
    await subject.populate('semester', 'name description');

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_subject',
      actionType: 'create',
      resource: 'subject',
      resourceId: subject._id.toString(),
      description: `Tạo môn học: ${subject.subjectCode} - ${subject.subjectName}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo môn học thành công',
      data: subject
    });

  } catch (error) {
    console.error('Create subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo môn học',
      error: error.message
    });
  }
};

// @desc    Update subject
// @route   PUT /api/admin/subjects/:id
// @access  Private/Admin/Web
const updateSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, semester, description, link, isActive } = req.body;

    // Check if semester exists
    if (semester) {
      const semesterDoc = await Semester.findById(semester);
      if (!semesterDoc) {
        return res.status(400).json({
          success: false,
          message: 'Học kỳ không tồn tại'
        });
      }
    }

    // Check if subject code is unique in the semester (excluding current subject)
    if (subjectCode && semester) {
      const existingSubject = await Subject.findOne({
        subjectCode: subjectCode.toUpperCase(),
        semester,
        _id: { $ne: req.params.id }
      });
      if (existingSubject) {
        return res.status(400).json({
          success: false,
          message: 'Mã môn học đã tồn tại trong học kỳ này'
        });
      }
    }

    const updateData = {};
    if (subjectCode) updateData.subjectCode = subjectCode.toUpperCase();
    if (subjectName) updateData.subjectName = subjectName;
    if (semester) updateData.semester = semester;
    if (description !== undefined) updateData.description = description;
    if (link !== undefined) updateData.link = link;
    if (isActive !== undefined) updateData.isActive = isActive;

    const subject = await Subject.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).populate('semester', 'name description');

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_subject',
      actionType: 'update',
      resource: 'subject',
      resourceId: subject._id.toString(),
      description: `Cập nhật môn học: ${subject.subjectCode} - ${subject.subjectName}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Cập nhật môn học thành công',
      data: subject
    });

  } catch (error) {
    console.error('Update subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật môn học',
      error: error.message
    });
  }
};

// @desc    Delete subject
// @route   DELETE /api/admin/subjects/:id
// @access  Private/Admin/Web
const deleteSubject = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    // Check if subject has exams
    const examCount = await Exam.countDocuments({ subjectId: subject._id });
    if (examCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa môn học vì có ${examCount} đề thi đang sử dụng`
      });
    }

    await Subject.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'delete_subject',
      actionType: 'delete',
      resource: 'subject',
      resourceId: subject._id.toString(),
      description: `Xóa môn học: ${subject.subjectCode} - ${subject.subjectName}`,
      importance: 'high',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Xóa môn học thành công'
    });

  } catch (error) {
    console.error('Delete subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa môn học',
      error: error.message
    });
  }
};

// @desc    Toggle subject status
// @route   PATCH /api/admin/subjects/:id/toggle-status
// @access  Private/Admin/Web
const toggleSubjectStatus = async (req, res) => {
  try {
    const subject = await Subject.findById(req.params.id);

    if (!subject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    const updatedSubject = await Subject.findByIdAndUpdate(
      req.params.id,
      { isActive: !subject.isActive },
      { new: true }
    ).populate('semester', 'name description');

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'toggle_subject_status',
      actionType: 'update',
      resource: 'subject',
      resourceId: subject._id.toString(),
      description: `${updatedSubject.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} môn học: ${subject.subjectCode} - ${subject.subjectName}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `${updatedSubject.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} môn học thành công`,
      data: updatedSubject
    });

  } catch (error) {
    console.error('Toggle subject status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái môn học',
      error: error.message
    });
  }
};

// @desc    Get subject statistics
// @route   GET /api/admin/subjects/stats
// @access  Private/Admin/Web
const getSubjectStats = async (req, res) => {
  try {
    const [
      totalSubjects,
      activeSubjects,
      totalExams,
      totalSemesters
    ] = await Promise.all([
      Subject.countDocuments(),
      Subject.countDocuments({ isActive: true }),
      Exam.countDocuments(),
      Semester.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalSubjects,
        activeSubjects,
        inactiveSubjects: totalSubjects - activeSubjects,
        totalExams,
        totalSemesters
      }
    });

  } catch (error) {
    console.error('Get subject stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê môn học',
      error: error.message
    });
  }
};

// @desc    Get subjects by semester
// @route   GET /api/admin/subjects/semester/:semesterId
// @access  Private/Admin/Web
const getSubjectsBySemester = async (req, res) => {
  try {
    const subjects = await Subject.find({
      semester: req.params.semesterId,
      isActive: true
    })
      .sort({ subjectCode: 1 })
      .select('subjectCode subjectName description').populate('semester', 'name');

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Get subjects by semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách môn học theo học kỳ',
      error: error.message
    });
  }
};

// @desc    Get active subjects only
// @route   GET /api/admin/subjects/active
// @access  Private/Admin/Web
const getActiveSubjects = async (req, res) => {
  try {
    const subjects = await Subject.find({ isActive: true })
      .populate('semester', 'name')
      .sort({ subjectCode: 1 })
      .select('subjectCode subjectName semester');

    res.json({
      success: true,
      data: subjects
    });

  } catch (error) {
    console.error('Get active subjects error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách môn học hoạt động',
      error: error.message
    });
  }
};

// @desc    Duplicate subject to another semester
// @route   POST /api/admin/subjects/:id/duplicate
// @access  Private/Admin/Web
const duplicateSubject = async (req, res) => {
  try {
    const { targetSemesterId } = req.body;

    const originalSubject = await Subject.findById(req.params.id);
    if (!originalSubject) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy môn học'
      });
    }

    // Check if target semester exists
    const targetSemester = await Semester.findById(targetSemesterId);
    if (!targetSemester) {
      return res.status(400).json({
        success: false,
        message: 'Học kỳ đích không tồn tại'
      });
    }

    // Check if subject already exists in target semester
    const existingSubject = await Subject.findOne({
      subjectCode: originalSubject.subjectCode,
      semester: targetSemesterId
    });
    if (existingSubject) {
      return res.status(400).json({
        success: false,
        message: 'Môn học đã tồn tại trong học kỳ đích'
      });
    }

    // Create duplicate subject
    const duplicatedSubject = await Subject.create({
      subjectCode: originalSubject.subjectCode,
      subjectName: originalSubject.subjectName,
      semester: targetSemesterId,
      description: originalSubject.description,
      link: originalSubject.link,
      isActive: originalSubject.isActive
    });

    await duplicatedSubject.populate('semester', 'name description');

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'duplicate_subject',
      actionType: 'create',
      resource: 'subject',
      resourceId: duplicatedSubject._id.toString(),
      description: `Sao chép môn học ${originalSubject.subjectCode} sang học kỳ ${targetSemester.name}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Sao chép môn học thành công',
      data: duplicatedSubject
    });

  } catch (error) {
    console.error('Duplicate subject error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi sao chép môn học',
      error: error.message
    });
  }
};

module.exports = {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  getSubjectStats,
  getSubjectsBySemester,
  getActiveSubjects,
  duplicateSubject
}; 