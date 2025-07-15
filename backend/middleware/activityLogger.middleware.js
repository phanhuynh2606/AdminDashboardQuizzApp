const { ActivityLog } = require('../models');
const User = require('../models/user.model'); // Added missing import for User model

// Cache to prevent duplicate activities within short time frame
const recentActivities = new Map();

// Middleware để log activities tự động
const logActivity = (actionType, resource, customDescription = null) => {
  return async (req, res, next) => {
    // Flag to ensure we only log once
    let hasLogged = false;
    
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Function to log only once
    const logOnce = (data) => {
      if (!hasLogged) {
        hasLogged = true;
        logUserActivity(req, res, actionType, resource, customDescription, data);
      }
    };
    
    // Override response methods to capture response
    res.send = function(data) {
      logOnce(data);
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      logOnce(data);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Function to actually log the activity
const logUserActivity = async (req, res, actionType, resource, customDescription, responseData) => {
  try {
    // Only log successful operations (2xx status codes)
    if (res.statusCode < 200 || res.statusCode >= 300) {
      return;
    }

    // Don't log read operations for now (too verbose), except for auth-related activities
    if (actionType === 'read' && resource !== 'auth') {
      return;
    }
    
    // Skip if action already logged by auth middleware
    if (['login', 'logout', 'create'].includes(actionType) && resource === 'auth') {
      return;
    }

    const user = req.user;
    if (!user) return;

    // Extract resource ID from response or request
    let resourceId = null;
    if (req.params?.id) {
      resourceId = req.params.id;
    } else if (responseData?.data?._id) {
      resourceId = responseData.data._id;
    } else if (responseData?.data?.id) {
      resourceId = responseData.data.id;
    }

    // Generate description based on action
    let description = customDescription;
    if (!description) {
      description = generateDescription(actionType, resource, user, req.body);
    }

    // Determine importance based on action and resource
    const importance = getImportanceLevel(actionType, resource);

    // Create unique identifier for this activity to prevent duplicates
    const activityKey = `${user._id}_${actionType}_${resource}_${resourceId || 'null'}_${Date.now()}`;
    
    // Debounce rapid successive calls (within 1 second)
    if (recentActivities.has(activityKey.slice(0, -13) + '_recent')) {
      console.log('Debouncing duplicate activity log');
      return;
    }
    
    // Add to recent activities cache (expires in 2 seconds)
    recentActivities.set(activityKey.slice(0, -13) + '_recent', true);
    setTimeout(() => {
      recentActivities.delete(activityKey.slice(0, -13) + '_recent');
    }, 2000);

    await ActivityLog.logActivity({
      userId: user._id,
      userEmail: user.email,
      userRole: user.role,
      action: `${actionType}_${resource}`,
      actionType,
      resource,
      resourceId,
      description,
      importance,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      deviceType: req.body?.deviceType || 'web',
      details: {
        method: req.method,
        url: req.originalUrl,
        body: sanitizeBody(req.body),
        params: req.params,
        query: req.query
      }
    });

  } catch (error) {
    console.error('Error logging activity:', error);
    // Don't throw error to avoid breaking the main request
  }
};

// Generate description based on action type
function generateDescription(actionType, resource, user, body) {
  const userDisplay = user.fullName || user.email;
  
  const actionMap = {
    'create': {
      'user': `${userDisplay} tạo người dùng mới`,
      'exam': `${userDisplay} tạo đề thi mới`,
      'question': `${userDisplay} thêm câu hỏi`,
      'notification': `${userDisplay} tạo thông báo tới ${body.targetAudience === 'all' ? 'tất cả mọi người' : body.targetAudience === 'tài khoản admin' ? 'admin' : 'sinh viên'}`,
      'default': `${userDisplay} tạo ${resource} mới`
    },
    'update': {
      'user': `${userDisplay} cập nhật thông tin người dùng`,
      'exam': `${userDisplay} chỉnh sửa đề thi`,
      'question': `${userDisplay} cập nhật câu hỏi`,
      'notification': `${userDisplay} cập nhật thông báo`,
      'default': `${userDisplay} cập nhật ${resource}`
    },
    'delete': {
      'user': `${userDisplay} xóa người dùng`,
      'exam': `${userDisplay} xóa đề thi`,
      'question': `${userDisplay} xóa câu hỏi`,
      'notification': `${userDisplay} xóa thông báo`,
      'default': `${userDisplay} xóa ${resource}`
    },
    'login': `${userDisplay} đăng nhập hệ thống`,
    'logout': `${userDisplay} đăng xuất`,
    'register': `${userDisplay} đăng ký tài khoản mới`
  };

  if (typeof actionMap[actionType] === 'object') {
    return actionMap[actionType][resource] || actionMap[actionType]['default'];
  }
  
  return actionMap[actionType] || `${userDisplay} thực hiện ${actionType} trên ${resource}`;
}

// Determine importance level
function getImportanceLevel(actionType, resource) {
  // Critical actions
  if (actionType === 'delete' && ['user', 'exam'].includes(resource)) {
    return 'high';
  }
  
  // Important actions
  if (['create', 'update'].includes(actionType) && ['user', 'exam'].includes(resource)) {
    return 'medium';
  }
  
  if (actionType === 'login') {
    return 'low';
  }
  
  return 'medium';
}

// Sanitize request body (remove sensitive data)
function sanitizeBody(body) {
  if (!body) return {};
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  delete sanitized.password;
  delete sanitized.refreshToken;
  delete sanitized.accessToken;
  
  return sanitized;
}

// Special middleware for auth activities (register, login, logout)
const logAuthActivity = (actionType) => {
  return async (req, res, next) => {
    // Store original response methods
    const originalSend = res.send;
    const originalJson = res.json;
    
    // Flag to ensure we only log once
    let hasLogged = false;
    
    const logOnce = async (data) => {
      if (!hasLogged && res.statusCode >= 200 && res.statusCode < 300) {
        hasLogged = true;
        
        try {
          let user = null;
          let description = '';
          
          // Handle different auth actions
          switch (actionType) {
            case 'register':
              // For register, extract user from response data
              user = data?.data?.user;
              if (user) {
                description = `${user.email || user.fullName} đăng ký tài khoản mới`;
                                 await ActivityLog.logActivity({
                   userId: user._id,
                   userEmail: user.email,
                   userRole: user.role,
                   action: 'register_user',
                   actionType: 'create',
                   resource: 'auth',
                  resourceId: user._id,
                  description,
                  importance: 'medium',
                  ipAddress: req.ip || req.connection.remoteAddress,
                  userAgent: req.get('User-Agent'),
                  deviceType: req.body?.deviceType || 'web',
                  details: {
                    method: req.method,
                    url: req.originalUrl,
                    userRole: user.role,
                    registrationMethod: req.body?.deviceType || 'web'
                  }
                });
              }
              break;
              
            case 'login':
              // For login, extract user from response data
              user = data?.data?.user;
              if (user) {
                description = `${user.fullName || user.email} đăng nhập hệ thống`;
                await ActivityLog.logActivity({
                  userId: user._id,
                  userEmail: user.email,
                  userRole: user.role,
                  action: 'login_user',
                  actionType: 'login',
                  resource: 'auth',
                  resourceId: user._id,
                  description,
                  importance: 'low',
                  ipAddress: req.ip || req.connection.remoteAddress,
                  userAgent: req.get('User-Agent'),
                  deviceType: req.body?.deviceType || 'web',
                  details: {
                    method: req.method,
                    url: req.originalUrl,
                    loginMethod: req.body?.deviceType || 'web',
                    lastLogin: new Date()
                  }
                });
              }
              break;
              
            case 'logout':
              // For logout, we need to find user from refresh token before it's deleted
              // This needs to be handled differently - see logLogoutActivity below
              break;
          }
        } catch (error) {
          console.error(`Error logging ${actionType} activity:`, error);
        }
      }
    };
    
    // Override response methods
    res.send = function(data) {
      logOnce(data);
      return originalSend.call(this, data);
    };
    
    res.json = function(data) {
      logOnce(data);
      return originalJson.call(this, data);
    };
    
    next();
  };
};

// Special logout middleware (needs to run before logout logic)
const logLogoutActivity = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body || {};
    const cookieToken = req.cookies?.refreshToken;
    const refreshTokenToUse = token || cookieToken;
    
    if (refreshTokenToUse) {
      // Find user before token is deleted
      const user = await User.findOne({ refreshToken: refreshTokenToUse });
      
      if (user) {
        // Store user info for logging after successful logout
        req.logoutUser = user;
      }
    }
  } catch (error) {
    console.error('Error preparing logout activity log:', error);
  }
  
  next();
};

// Log logout after successful response
const logLogoutAfterResponse = async (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;
  
  const logOnce = async (data) => {
    if (res.statusCode >= 200 && res.statusCode < 300 && req.logoutUser) {
      try {
        const user = req.logoutUser;
        await ActivityLog.logActivity({
          userId: user._id,
          userEmail: user.email,
          userRole: user.role,
          action: 'logout_user',
          actionType: 'logout',
          resource: 'auth',
          resourceId: user._id.toString(),
          description: `${user.fullName || user.email} đăng xuất hệ thống`,
          importance: 'low',
          ipAddress: req.ip || req.connection.remoteAddress,
          userAgent: req.get('User-Agent'),
          deviceType: user.deviceType || 'unknown',
          details: {
            method: req.method,
            url: req.originalUrl,
            logoutTime: new Date()
          }
        });
      } catch (error) {
        console.error('Error logging logout activity:', error);
      }
    }
  };
  
  res.send = function(data) {
    logOnce(data);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    logOnce(data);
    return originalJson.call(this, data);
  };
  
  next();
};

// Special middleware for practice history (exam submission)
const logPracticeHistorySubmission = async (req, res, next) => {
  // Store original response methods
  const originalSend = res.send;
  const originalJson = res.json;
  
  // Flag to ensure we only log once
  let hasLogged = false;
  
  const logOnce = async (data) => {
    if (!hasLogged && res.statusCode >= 200 && res.statusCode < 300) {
      hasLogged = true;
      
      try {
        const user = req.user;
        const { subjectCode, examTypeCode, score, totalQuestions ,
correctAnswers} = req.body;
        
        if (user) {
          const description = `${user.email} nộp bài thi ${examTypeCode} môn ${subjectCode} (${correctAnswers}/${totalQuestions} đúng, ${score} điểm)`;
          
          await ActivityLog.logActivity({
            userId: user._id,
            userEmail: user.email,
            userRole: user.role,
            action: 'submit_exam',
            actionType: 'create',
            resource: 'exam_submission',
            resourceId: data?.data?.id || null,
            description,
            importance: 'medium',
            ipAddress: req.ip || req.connection.remoteAddress,
            userAgent: req.get('User-Agent'),
            deviceType: req.body?.deviceType || 'android',
            details: {
              method: req.method,
              url: req.originalUrl,
              subjectCode,
              examTypeCode,
              score,
              totalQuestions,
              syncStatus: req.body?.syncStatus || 'synced'
            }
          });
        }
      } catch (error) {
        console.error('Error logging practice history activity:', error);
      }
    }
  };
  
  res.send = function(data) {
    logOnce(data);
    return originalSend.call(this, data);
  };
  
  res.json = function(data) {
    logOnce(data);
    return originalJson.call(this, data);
  };
  
  next();
};

// Specific middleware functions for common actions
const logUserCreation = logActivity('create', 'user');
const logUserUpdate = logActivity('update', 'user');  
const logUserDeletion = logActivity('delete', 'user');
const logExamCreation = logActivity('create', 'exam');
const logExamUpdate = logActivity('update', 'exam');
const logExamDeletion = logActivity('delete', 'exam');
const logNotificationCreation = logActivity('create', 'notification');

// Specific middleware exports for auth routes
const logRegisterActivity = logAuthActivity('register');
const logLoginActivity = logAuthActivity('login');

module.exports = {
  logActivity,
  logUserCreation,
  logUserUpdate,
  logUserDeletion,
  logExamCreation,
  logExamUpdate,
  logExamDeletion,
  logNotificationCreation,
  logPracticeHistorySubmission,
  // New auth-specific middleware
  logRegisterActivity,
  logLoginActivity,
  logLogoutActivity,
  logLogoutAfterResponse
};