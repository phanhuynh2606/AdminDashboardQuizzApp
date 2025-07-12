const mongoose = require('mongoose');

// Model Thông báo hệ thống
const notificationSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  }, // 'Cập nhật hệ thống', 'Bảo trì định kỳ'
  
  message: {
    type: String,
    required: true,
    trim: true
  }, // 'Hệ thống sẽ bảo trì vào 23:00 hôm nay'
  
  type: {
    type: String,
    enum: ['success', 'info', 'warning', 'error'],
    default: 'info'
  }, // Loại thông báo (màu sắc)
  
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium'
  }, // Độ ưu tiên
  
  category: {
    type: String,
    enum: ['system', 'maintenance', 'security', 'feature', 'announcement'],
    default: 'system'
  }, // Danh mục thông báo
  
  targetAudience: {
    type: String,
    enum: ['all', 'admin', 'student'],
    default: 'all'
  }, // Đối tượng nhận thông báo
  
  isActive: {
    type: Boolean,
    default: true
  }, // Hiển thị hay không
  
  isPinned: {
    type: Boolean,
    default: false
  }, // Ghim thông báo quan trọng
  
  scheduledAt: {
    type: Date,
    default: null
  }, // Lên lịch hiển thị (null = hiển thị ngay)
  
  expiredAt: {
    type: Date,
    default: null
  }, // Thời gian hết hạn (null = không hết hạn)
  
  readBy: [{
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }], // Danh sách user đã đọc
  
  metadata: {
    icon: String, // Icon name từ Ant Design
    color: String, // Custom color
    actionUrl: String, // Link để user click vào
    actionText: String // Text cho button action
  },
  
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }, // Admin tạo thông báo
  
  statistics: {
    totalViews: {
      type: Number,
      default: 0
    },
    totalReads: {
      type: Number,
      default: 0
    }
  }
}, { 
  timestamps: true 
});

// Indexes để query nhanh
notificationSchema.index({ isActive: 1, scheduledAt: 1, expiredAt: 1 });
notificationSchema.index({ targetAudience: 1, priority: 1 });
notificationSchema.index({ category: 1, createdAt: -1 });

// Virtual để check thông báo đã hết hạn chưa
notificationSchema.virtual('isExpired').get(function() {
  return this.expiredAt && this.expiredAt < new Date();
});

// Virtual để check thông báo có hiển thị được không
notificationSchema.virtual('isVisible').get(function() {
  const now = new Date();
  const isScheduled = !this.scheduledAt || this.scheduledAt <= now;
  const notExpired = !this.expiredAt || this.expiredAt > now;
  return this.isActive && isScheduled && notExpired;
});

// Static method để lấy thông báo active cho user
notificationSchema.statics.getActiveNotifications = function(userRole = 'all', limit = 10) {
  const now = new Date();
  return this.find({
    isActive: true,
    $or: [
      { targetAudience: 'all' },
      { targetAudience: userRole }
    ],
    $or: [
      { scheduledAt: { $exists: false } },
      { scheduledAt: null },
      { scheduledAt: { $lte: now } }
    ],
    $or: [
      { expiredAt: { $exists: false } },
      { expiredAt: null },
      { expiredAt: { $gt: now } }
    ]
  })
  .sort({ isPinned: -1, priority: -1, createdAt: -1 })
  .limit(limit)
  .populate('createdBy', 'fullName email');
};

const Notification = mongoose.model('Notification', notificationSchema);
module.exports = Notification; 