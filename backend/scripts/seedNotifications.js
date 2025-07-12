const mongoose = require('mongoose');
const { Notification, ActivityLog, User } = require('../models');

// Sample notifications data
const sampleNotifications = [
  {
    title: 'Hệ thống hoạt động bình thường',
    message: 'Tất cả các dịch vụ đang hoạt động ổn định',
    type: 'success',
    priority: 'medium',
    category: 'system',
    targetAudience: 'all',
    isPinned: false,
    metadata: {
      icon: 'CheckCircleOutlined',
      color: '#52c41a'
    }
  },
  {
    title: 'Bảo trì hệ thống',
    message: 'Hệ thống sẽ được bảo trì vào 23:00 hôm nay, dự kiến 30 phút',
    type: 'warning',
    priority: 'high',
    category: 'maintenance',
    targetAudience: 'all',
    isPinned: true,
    scheduledAt: new Date(),
    expiredAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours from now
    metadata: {
      icon: 'ToolOutlined',
      color: '#faad14'
    }
  },
  {
    title: 'Cập nhật tính năng mới',
    message: 'Đã thêm tính năng xuất báo cáo Excel và cải thiện hiệu suất',
    type: 'info',
    priority: 'medium',
    category: 'feature',
    targetAudience: 'admin',
    isPinned: false,
    metadata: {
      icon: 'StarOutlined',
      color: '#1890ff'
    }
  },
  {
    title: 'Thông báo bảo mật',
    message: 'Đã phát hiện và khắc phục lỗ hổng bảo mật. Hệ thống hiện đã an toàn',
    type: 'success',
    priority: 'high',
    category: 'security',
    targetAudience: 'admin',
    isPinned: false,
    metadata: {
      icon: 'ShieldCheckOutlined',
      color: '#52c41a'
    }
  },
  {
    title: 'Backup dữ liệu',
    message: 'Backup dữ liệu hàng ngày đã hoàn thành thành công',
    type: 'info',
    priority: 'low',
    category: 'system',
    targetAudience: 'admin',
    isPinned: false,
    metadata: {
      icon: 'CloudDownloadOutlined',
      color: '#722ed1'
    }
  }
];

// Sample activity logs data
const sampleActivities = [
  {
    userEmail: 'admin@example.com',
    userRole: 'admin',
    action: 'login',
    actionType: 'login',
    resource: 'system',
    description: 'Admin đăng nhập hệ thống',
    importance: 'low',
    deviceType: 'web',
    ipAddress: '192.168.1.1',
    displayInfo: {
      icon: 'LoginOutlined',
      color: '#1890ff',
      category: 'auth'
    }
  },
  {
    userEmail: 'admin@example.com',
    userRole: 'admin',
    action: 'create_user',
    actionType: 'create',
    resource: 'user',
    description: 'Admin tạo người dùng mới',
    importance: 'medium',
    deviceType: 'web',
    ipAddress: '192.168.1.1',
    displayInfo: {
      icon: 'UserAddOutlined',
      color: '#52c41a',
      category: 'user'
    }
  },
  {
    userEmail: 'system',
    userRole: 'system',
    action: 'system_backup',
    actionType: 'system',
    resource: 'system',
    description: 'Hệ thống thực hiện backup dữ liệu tự động',
    importance: 'medium',
    deviceType: 'system',
    displayInfo: {
      icon: 'CloudDownloadOutlined',
      color: '#722ed1',
      category: 'system'
    }
  },
  {
    userEmail: 'admin@example.com',
    userRole: 'admin',
    action: 'create_exam',
    actionType: 'create',
    resource: 'exam',
    description: 'Admin tạo đề thi PRM392 Final',
    importance: 'medium',
    deviceType: 'web',
    ipAddress: '192.168.1.1',
    displayInfo: {
      icon: 'FileTextOutlined',
      color: '#52c41a',
      category: 'exam'
    }
  },
  {
    userEmail: 'admin@example.com',
    userRole: 'admin',
    action: 'update_system',
    actionType: 'update',
    resource: 'system',
    description: 'Admin cập nhật cấu hình hệ thống',
    importance: 'high',
    deviceType: 'web',
    ipAddress: '192.168.1.1',
    displayInfo: {
      icon: 'SettingOutlined',
      color: '#faad14',
      category: 'system'
    }
  }
];

// Function to seed data
async function seedNotificationsAndActivities() {
  try {
    console.log('🌱 Starting to seed notifications and activities...');

    // Find admin user to use as creator
    const adminUser = await User.findOne({ role: 'admin' });
    if (!adminUser) {
      console.log('❌ No admin user found. Please create an admin user first.');
      return;
    }

    console.log(`📋 Found admin user: ${adminUser.email}`);

    // Clear existing data (optional)
    await Notification.deleteMany({});
    await ActivityLog.deleteMany({});
    console.log('🗑️  Cleared existing notifications and activities');

    // Seed notifications
    const notificationsWithCreator = sampleNotifications.map(notification => ({
      ...notification,
      createdBy: adminUser._id
    }));

    const createdNotifications = await Notification.insertMany(notificationsWithCreator);
    console.log(`✅ Created ${createdNotifications.length} notifications`);

    // Seed activity logs
    const activitiesWithUser = sampleActivities.map(activity => ({
      ...activity,
      userId: activity.userRole === 'admin' ? adminUser._id : null,
      createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000) // Random time within last 7 days
    }));

    const createdActivities = await ActivityLog.insertMany(activitiesWithUser);
    console.log(`✅ Created ${createdActivities.length} activity logs`);

    console.log('🎉 Seeding completed successfully!');
    
    console.log('\n📊 Summary:');
    console.log(`- Notifications: ${createdNotifications.length}`);
    console.log(`- Activity Logs: ${createdActivities.length}`);
    console.log(`- Admin User: ${adminUser.email}`);

  } catch (error) {
    console.error('❌ Error seeding data:', error);
  }
}

// Export for use in other scripts or run directly
module.exports = { seedNotificationsAndActivities };

// Run if called directly
if (require.main === module) {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
    mongoose.connect(dbUrl)
      .then(() => {
        console.log('📦 Connected to MongoDB');
        return seedNotificationsAndActivities();
      })
      .then(() => {
        console.log('✨ Seeding completed, disconnecting...');
        return mongoose.disconnect();
      })
      .catch(error => {
        console.error('💥 Error:', error);
        process.exit(1);
      });
  } else {
    seedNotificationsAndActivities();
  }
} 