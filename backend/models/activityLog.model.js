const mongoose = require('mongoose');

// Model Activity Log - Theo dõi hoạt động hệ thống
const activityLogSchema = new mongoose.Schema({
  // Thông tin user thực hiện action
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null = system action
  },
  
  userEmail: {
    type: String,
    trim: true
  }, // Lưu email để tránh mất dữ liệu khi user bị xóa
  
  userRole: {
    type: String,
    enum: ['admin', 'student', 'system'],
    default: 'system'
  },
  
  // Thông tin action
  action: {
    type: String,
    required: true,
    trim: true
  }, // 'login', 'create_user', 'delete_exam', 'update_profile'
  
  actionType: {
    type: String,
    enum: ['create',"take" ,'read', 'update', 'delete', 'login', 'logout', 'system'],
    required: true
  }, // Loại hành động chính
  
  resource: {
    type: String,
    required: true,
    trim: true
  }, // 'user', 'exam', 'question', 'notification', 'system'
  
  resourceId: {
    type: String,
    default: null
  }, // ID của resource bị tác động (string để flexible)
  
  // Mô tả và metadata
  description: {
    type: String,
    required: true,
    trim: true
  }, // 'Admin tạo người dùng mới', 'Hệ thống khởi động lại'
  
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }, // Chi tiết bổ sung (object flexible)
  
  // Thông tin request
  ipAddress: {
    type: String,
    trim: true
  },
  
  userAgent: {
    type: String,
    trim: true
  },
  
  deviceType: {
    type: String,
    enum: ['web', 'android', 'system'],
    default: 'web'
  },
  
  // Status và importance
  status: {
    type: String,
    enum: ['success', 'failed', 'pending', 'warning'],
    default: 'success'
  },
  
  importance: {
    type: String,
    enum: ['low', 'medium', 'high', 'critical'],
    default: 'medium'
  },
  
  // Metadata for display
  displayInfo: {
    icon: String, // Icon name cho UI
    color: String, // Màu hiển thị
    category: String // Nhóm để filter
  }
}, { 
  timestamps: true 
});

// Indexes để query nhanh
activityLogSchema.index({ userId: 1, createdAt: -1 });
activityLogSchema.index({ actionType: 1, resource: 1, createdAt: -1 });
activityLogSchema.index({ userRole: 1, importance: 1, createdAt: -1 });
activityLogSchema.index({ createdAt: -1 }); // For recent activities

// Static methods
activityLogSchema.statics.logActivity = async function(data) {
  try {
    const log = new this({
      ...data,
      description: data.description || `${data.userEmail || 'System'} ${data.action} ${data.resource}`,
      displayInfo: {
        icon: getIconForAction(data.actionType, data.resource),
        color: getColorForAction(data.actionType, data.importance),
        category: data.resource
      }
    });
    return await log.save();
  } catch (error) {
    console.error('Error logging activity:', error);
  }
};

activityLogSchema.statics.getRecentActivities = function(limit = 10) {
  return this.find({
    importance: { $in: ['medium', 'high', 'critical'] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('userId', 'fullName email')
  .lean();
};

activityLogSchema.statics.getDashboardActivities = function(limit = 5) {
  return this.find({
    actionType: { $in: ['create',"take",'delete', 'login', 'update', 'system'] },
    importance: { $in: ['medium', 'high'] }
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .select('description actionType resource createdAt displayInfo userEmail')
  .lean();
};

// Helper functions
function getIconForAction(actionType, resource) {
  const iconMap = {
    'create': {
      'user': 'UserAddOutlined',
      'exam': 'FileTextOutlined',
      'question': 'QuestionCircleOutlined',
      'default': 'PlusOutlined'
    },
    'login': 'LoginOutlined',
    'logout': 'LogoutOutlined', 
    'update': 'EditOutlined',
    'delete': 'DeleteOutlined',
    'system': 'SettingOutlined',
    'read': 'EyeOutlined'
  };
  
  if (iconMap[actionType] && typeof iconMap[actionType] === 'object') {
    return iconMap[actionType][resource] || iconMap[actionType]['default'];
  }
  return iconMap[actionType] || 'InfoCircleOutlined';
}

function getColorForAction(actionType, importance) {
  if (importance === 'critical') return '#ff4d4f';
  if (importance === 'high') return '#faad14';
  
  const colorMap = {
    'create': '#52c41a',
    'login': '#1890ff',
    'logout': '#722ed1',
    'update': '#faad14',
    'delete': '#ff4d4f',
    'system': '#1890ff'
  };
  
  return colorMap[actionType] || '#1890ff';
}

const ActivityLog = mongoose.model('ActivityLog', activityLogSchema);
module.exports = ActivityLog; 