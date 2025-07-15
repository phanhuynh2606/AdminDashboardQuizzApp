const { Exam, QuestionBank, Notification, ActivityLog, User } = require('../models');
const admin = require('../config/firebase'); // Import Firebase Admin SDK

// @desc    Get all users with pagination and filters
// @route   GET /api/admin/users
// @access  Private/Admin/Web
const getUsers = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 10,
      search = '',
      role = 'all',
      status = 'all',
      level = 'all',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    // Build filter object
    const filter = {};
    
    // Role filter
    if (role !== 'all') {
      filter.role = role;
    }
    
    // Status filter (isActive)
    if (status !== 'all') {
      filter.isActive = status === 'active';
    }
    
    // Level filter (for students only)
    if (level !== 'all') {
      filter.level = level;
    }
    
    // Search filter
    if (search) {
      filter.$or = [
        { fullName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
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
    const [users, total] = await Promise.all([
      User.find(filter)
        .select('-password -refreshToken') // Exclude sensitive fields
        .sort(sort)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      User.countDocuments(filter)
    ]);

    // Add virtual studentId for display (using email prefix or _id)
    const usersWithStudentId = users.map(user => ({
      ...user,
      studentId: user.role === 'student' 
        ? user.email.split('@')[0].toUpperCase()
        : user._id.toString().slice(-6).toUpperCase(),
      id: user._id.toString() // For frontend compatibility
    }));

    // Calculate pagination info
    const totalPages = Math.ceil(total / limitNum);
    const hasNextPage = pageNum < totalPages;
    const hasPrevPage = pageNum > 1;

    res.json({
      success: true,
      data: {
        users: usersWithStudentId,
        pagination: {
          currentPage: pageNum,
          totalPages,
          totalUsers: total,
          hasNextPage,
          hasPrevPage,
          limit: limitNum
        }
      }
    });

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy danh sách người dùng',
      error: error.message
    });
  }
};

// @desc    Get user by ID
// @route   GET /api/admin/users/:id
// @access  Private/Admin/Web
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      data: {
        ...user.toObject(),
        studentId: user.role === 'student' 
          ? user.email.split('@')[0].toUpperCase()
          : user._id.toString().slice(-6).toUpperCase()
      }
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông tin người dùng',
      error: error.message
    });
  }
};

// @desc    Create new user
// @route   POST /api/admin/users
// @access  Private/Admin/Web
const createUser = async (req, res) => {
  try {
    const {
      email,
      password,
      fullName,
      phone,
      dateOfBirth,
      role = 'student',
      level = 'Beginner',
      favoriteSubjects = []
    } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email đã được sử dụng'
      });
    }

    // Create user
    const user = await User.create({
      email,
      password, // Will be hashed by pre-save middleware
      fullName,
      phone,
      dateOfBirth,
      role,
      level,
      favoriteSubjects
    });

    // Return user without password
    const userResponse = await User.findById(user._id).select('-password -refreshToken');

    res.status(201).json({
      success: true,
      message: 'Tạo người dùng thành công',
      data: {
        ...userResponse.toObject(),
        studentId: userResponse.role === 'student' 
          ? userResponse.email.split('@')[0].toUpperCase()
          : userResponse._id.toString().slice(-6).toUpperCase()
      }
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo người dùng',
      error: error.message
    });
  }
};

// @desc    Update user
// @route   PUT /api/admin/users/:id
// @access  Private/Admin/Web
const updateUser = async (req, res) => {
  try {
    const {
      fullName,
      phone,
      dateOfBirth,
      level,
      favoriteSubjects,
      isActive
    } = req.body;

    const user = await User.findByIdAndUpdate(
      req.params.id,
      {
        fullName,
        phone,
        dateOfBirth,
        level,
        favoriteSubjects,
        isActive
      },
      { new: true, runValidators: true }
    ).select('-password -refreshToken');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    res.json({
      success: true,
      message: 'Cập nhật người dùng thành công',
      data: {
        ...user.toObject(),
        studentId: user.role === 'student' 
          ? user.email.split('@')[0].toUpperCase()
          : user._id.toString().slice(-6).toUpperCase()
      }
    });

  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi cập nhật người dùng',
      error: error.message
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin/Web
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Không tìm thấy người dùng'
      });
    }

    // Don't allow deleting admin users
    if (user.role === 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Không thể xóa tài khoản admin'
      });
    }

    await User.findByIdAndUpdate(req.params.id, { isActive: false });

    res.json({
      success: true,
      message: 'Vô hiệu hóa người dùng thành công'
    });

  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi xóa người dùng',
      error: error.message
    });
  }
};

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard
// @access  Private/Admin/Web
const getDashboardStats = async (req, res) => {
  try {
    // Calculate week start date (Monday)
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay() + 1); // Monday
    weekStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      inactiveUsers,
      totalStudents,
      totalAdmins,
      totalExams,
      totalQuestions,
      weeklyExams
    ] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      User.countDocuments({ isActive: false }),
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'admin' }),
      Exam.countDocuments({ isActive: true }),
      QuestionBank.countDocuments({ isActive: true }),
      Exam.countDocuments({ 
        isActive: true,
        createdAt: { $gte: weekStart }
      })
    ]);

    // Calculate average score
    const studentsWithScores = await User.aggregate([
      { $match: { role: 'student', averageScore: { $gt: 0 } } },
      { $group: { _id: null, avgScore: { $avg: '$averageScore' } } }
    ]);

    const overallAverageScore = studentsWithScores.length > 0 
      ? studentsWithScores[0].avgScore.toFixed(1) 
      : 0;

    // Get notifications and activities for dashboard
    const [notifications, recentActivities] = await Promise.all([
      Notification.getActiveNotifications(req.user.role, 5),
      ActivityLog.getDashboardActivities(10)
    ]);

    res.json({
      success: true,
      data: {
        user: req.user,
        stats: {
          // Original stats (for backward compatibility)
          totalUsers,
          activeUsers,
          inactiveUsers,
          totalStudents,
          totalAdmins,
          overallAverageScore,
          // New stats for Dashboard frontend
          totalExams,
          totalQuestions,
          weeklyExams
        },
        notifications,
        recentActivities
      }
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thống kê dashboard',
      error: error.message
    });
  }
};

// @desc    Get notifications
// @route   GET /api/admin/notifications
// @access  Private/Admin/Web
const getNotifications = async (req, res) => {
  try {
    const { page = 1, limit = 10, type = 'all', category = 'all' } = req.query;
    
    const filter = { isActive: true };
    if (type !== 'all') filter.type = type;
    if (category !== 'all') filter.category = category;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [notifications, total] = await Promise.all([
      Notification.find(filter)
        .sort({ isPinned: -1, priority: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('createdBy', 'fullName email'),
      Notification.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy thông báo',
      error: error.message
    });
  }
};

// @desc    Create notification
// @route   POST /api/admin/notifications
// @access  Private/Admin/Web
const createNotification = async (req, res) => {
  try {
    const notificationData = {
      ...req.body,
      createdBy: req.user._id
    };

    const notification = await Notification.create(notificationData);
    
    // Send push notification if target audience is student or all
    if (notification.targetAudience === 'student' || notification.targetAudience === 'all') {
      try {
        const studentUsers = await User.find({ role: 'student', isActive: true });
        const fcmTokens = studentUsers.flatMap(user => user.fcmTokens || []).filter(Boolean);

        if (fcmTokens.length > 0) {
          const message = {
            notification: {
              title: notification.title,
              body: notification.message,
            },
            data: {
              notificationId: notification._id.toString(),
              type: notification.type,
              category: notification.category,
              actionUrl: notification.metadata?.actionUrl || '',
            },
            // Optionally set Android specific options for sound/priority
            android: {
              priority: 'high',
              notification: {
                sound: 'default',
              },
            },
            apns: {
              payload: {
                aps: {
                  sound: 'default',
                },
              },
            },
          };

          const response = await admin.messaging().sendEachForMulticast({
            tokens: fcmTokens,
            ...message
          });

          console.log('Successfully sent push notifications:', response);
          // You might want to update fcmTokens if some were invalid
        }
      } catch (fcmError) {
        console.error('Error sending push notification:', fcmError);
      }
    }

    // Log activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'create_notification',
      actionType: 'create',
      resource: 'notification',
      resourceId: notification._id.toString(),
      description: `Tạo thông báo: ${notification.title}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.status(201).json({
      success: true,
      message: 'Tạo thông báo thành công',
      data: notification
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi tạo thông báo',
      error: error.message
    });
  }
};

// @desc    Get activity logs
// @route   GET /api/admin/activities
// @access  Private/Admin/Web  
const getActivityLogs = async (req, res) => {
  try {
    const { page = 1, limit = 20, actionType = 'all', resource = 'all' } = req.query;
    
    const filter = {};
    if (actionType !== 'all') filter.actionType = actionType;
    if (resource !== 'all') filter.resource = resource;

    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const [activities, total] = await Promise.all([
      ActivityLog.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('userId', 'fullName email'),
      ActivityLog.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: pageNum,
          totalPages: Math.ceil(total / limitNum),
          total,
          limit: limitNum
        }
      }
    });
  } catch (error) {
    console.error('Get activity logs error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi lấy nhật ký hoạt động',
      error: error.message
    });
  }
};

// @desc    Clean activity logs by time period
// @route   POST /api/admin/activities/clean
// @access  Private/Admin/Web
const cleanActivityLogsByTime = async (req, res) => {
  try {
    const { period } = req.body; // 'day', 'week', 'month', '3months', '6months'
    
    // Calculate cutoff date based on period
    const now = new Date();
    let cutoffDate;
    
    switch (period) {
      case 'day':
        cutoffDate = new Date(now.getTime() - 24 * 60 * 60 * 1000); // 1 day ago
        break;
      case 'week':
        cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 1 week ago
        break;
      case 'month':
        cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 1 month ago
        break;
      case '3months':
        cutoffDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000); // 3 months ago
        break;
      case '6months':
        cutoffDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000); // 6 months ago
        break;
      default:
        return res.status(400).json({
          success: false,
          message: 'Khoảng thời gian không hợp lệ'
        });
    }

    // Count logs to be deleted
    const countToDelete = await ActivityLog.countDocuments({
      createdAt: { $lt: cutoffDate }
    });

    // Delete old activity logs
    const deleteResult = await ActivityLog.deleteMany({
      createdAt: { $lt: cutoffDate }
    });

    // Log this cleanup activity
    await ActivityLog.logActivity({
      userId: req.user._id,
      userEmail: req.user.email,
      userRole: req.user.role,
      action: 'clean_activities_by_time',
      actionType: 'delete',
      resource: 'activity_log',
      description: `${req.user.fullName || req.user.email} dọn dẹp ${countToDelete} activity logs cũ hơn ${getPeriodDescription(period)}`,
      importance: 'medium',
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceType: 'web'
    });

    res.json({
      success: true,
      message: `Đã xóa ${deleteResult.deletedCount} activity logs cũ hơn ${getPeriodDescription(period)}`,
      data: {
        period,
        cutoffDate,
        deletedCount: deleteResult.deletedCount,
        remaining: await ActivityLog.countDocuments()
      }
    });

  } catch (error) {
    console.error('Clean activities by time error:', error);
    res.status(500).json({
      success: false,
      message: 'Lỗi server khi dọn dẹp activity logs',
      error: error.message
    });
  }
};

// Helper function to get period description
function getPeriodDescription(period) {
  const descriptions = {
    'day': '1 ngày',
    'week': '1 tuần', 
    'month': '1 tháng',
    '3months': '3 tháng',
    '6months': '6 tháng'
  };
  return descriptions[period] || period;
}

module.exports = {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser,
  getDashboardStats,
  getNotifications,
  createNotification,
  getActivityLogs,
  cleanActivityLogsByTime
}; 