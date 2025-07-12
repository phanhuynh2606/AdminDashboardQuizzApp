const Semester = require('../models/semester.model');
const Subject = require('../models/subject.model');
const { Exam } = require('../models');
const { ActivityLog } = require('../models');

// @desc    Get all semesters with pagination and filters
// @route   GET /api/admin/semesters
// @access  Private/Admin/Web
const getSemesters = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
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
    
    // Search filter
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
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

    // Execute query with subject count
    const [semesters, total] = await Promise.all([
      Semester.aggregate([
        { $match: filter },
        {
          $lookup: {
            from: 'subjects',
            localField: '_id',
            foreignField: 'semester',
            as: 'subjects'
          }
        },
        {
          $addFields: {
            subjectCount: { $size: '$subjects' }
          }
        },
        { $sort: sort },
        { $skip: skip },
        { $limit: limitNum }
      ]),
      Semester.countDocuments(filter)
    ]);

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        semesters,
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
    console.error('Get semesters error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách học kỳ',
      error: error.message
    });
  }
};

// @desc    Get semester by ID
// @route   GET /api/admin/semesters/:id
// @access  Private/Admin/Web
const getSemesterById = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Get subject count for this semester
    const subjectCount = await Subject.countDocuments({ semester: semester._id });

    res.json({
      success: true,
      data: {
        ...semester.toObject(),
        subjectCount
      }
    });

  } catch (error) {
    console.error('Get semester by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin học kỳ',
      error: error.message
    });
  }
};

// @desc    Create new semester
// @route   POST /api/admin/semesters
// @access  Private/Admin/Web
const createSemester = async (req, res) => {
  try {
    const { name, description, link, isActive = true } = req.body;

    // Check if semester name exists
    const existingSemester = await Semester.findOne({ name });
    if (existingSemester) {
      return res.status(400).json({
        success: false,
        message: 'Tên học kỳ đã tồn tại'
      });
    }

    // Create semester
    const semester = await Semester.create({
      name,
      description,
      link,
      isActive
    });

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_semester',
      actionType: 'create',
      resource: 'semester',
      resourceId: semester._id.toString(),
      description: `Tạo học kỳ: ${semester.name}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo học kỳ thành công',
      data: semester
    });

  } catch (error) {
    console.error('Create semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo học kỳ',
      error: error.message
    });
  }
};

// @desc    Update semester
// @route   PUT /api/admin/semesters/:id
// @access  Private/Admin/Web
const updateSemester = async (req, res) => {
  try {
    const { name, description, link, isActive } = req.body;

    // Check if name is unique (excluding current semester)
    if (name) {
      const existingSemester = await Semester.findOne({ 
        name, 
        _id: { $ne: req.params.id } 
      });
      if (existingSemester) {
        return res.status(400).json({
          success: false,
          message: 'Tên học kỳ đã tồn tại'
        });
      }
    }

    const semester = await Semester.findByIdAndUpdate(
      req.params.id,
      { name, description, link, isActive },
      { new: true, runValidators: true }
    );

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'update_semester',
      actionType: 'update',
      resource: 'semester',
      resourceId: semester._id.toString(),
      description: `Cập nhật học kỳ: ${semester.name}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Cập nhật học kỳ thành công',
      data: semester
    });

  } catch (error) {
    console.error('Update semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật học kỳ',
      error: error.message
    });
  }
};

// @desc    Delete semester
// @route   DELETE /api/admin/semesters/:id
// @access  Private/Admin/Web
const deleteSemester = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    // Check if semester has subjects
    const subjectCount = await Subject.countDocuments({ semester: semester._id });
    if (subjectCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Không thể xóa học kỳ vì có ${subjectCount} môn học đang sử dụng`
      });
    }

    await Semester.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'delete_semester',
      actionType: 'delete',
      resource: 'semester',
      resourceId: semester._id.toString(),
      description: `Xóa học kỳ: ${semester.name}`,
      importance: 'high',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: 'Xóa học kỳ thành công'
    });

  } catch (error) {
    console.error('Delete semester error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa học kỳ',
      error: error.message
    });
  }
};

// @desc    Toggle semester status
// @route   PATCH /api/admin/semesters/:id/toggle-status
// @access  Private/Admin/Web
const toggleSemesterStatus = async (req, res) => {
  try {
    const semester = await Semester.findById(req.params.id);

    if (!semester) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy học kỳ'
      });
    }

    const updatedSemester = await Semester.findByIdAndUpdate(
      req.params.id,
      { isActive: !semester.isActive },
      { new: true }
    );

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'toggle_semester_status',
      actionType: 'update',
      resource: 'semester',
      resourceId: semester._id.toString(),
      description: `${updatedSemester.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} học kỳ: ${semester.name}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `${updatedSemester.isActive ? 'Kích hoạt' : 'Vô hiệu hóa'} học kỳ thành công`,
      data: updatedSemester
    });

  } catch (error) {
    console.error('Toggle semester status error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi thay đổi trạng thái học kỳ',
      error: error.message
    });
  }
};

// @desc    Get semester statistics
// @route   GET /api/admin/semesters/stats
// @access  Private/Admin/Web
const getSemesterStats = async (req, res) => {
  try {
    const [
      totalSemesters,
      activeSemesters,
      totalSubjects,
      totalExams
    ] = await Promise.all([
      Semester.countDocuments(),
      Semester.countDocuments({ isActive: true }),
      Subject.countDocuments(),
      Exam.countDocuments()
    ]);

    res.json({
      success: true,
      data: {
        totalSemesters,
        activeSemesters,
        inactiveSemesters: totalSemesters - activeSemesters,
        totalSubjects,
        totalExams
      }
    });

  } catch (error) {
    console.error('Get semester stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê học kỳ',
      error: error.message
    });
  }
};

// @desc    Get active semesters only
// @route   GET /api/admin/semesters/active
// @access  Private/Admin/Web
const getActiveSemesters = async (req, res) => {
  try {
    const semesters = await Semester.find({ isActive: true })
      .sort({ createdAt: -1 })
      .select('name description');

    res.json({
      success: true,
      data: semesters
    });

  } catch (error) {
    console.error('Get active semesters error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách học kỳ hoạt động',
      error: error.message
    });
  }
};

module.exports = {
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
  toggleSemesterStatus,
  getSemesterStats,
  getActiveSemesters
}; 