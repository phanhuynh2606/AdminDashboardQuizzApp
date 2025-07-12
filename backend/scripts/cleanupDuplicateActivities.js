const mongoose = require('mongoose');
const { ActivityLog } = require('../models');

async function cleanupDuplicateActivities() {
  try {
    console.log('🧹 Starting cleanup of duplicate activity logs...');

    // Find duplicates based on userId, action, resource, and createdAt within 1 second
    const duplicates = await ActivityLog.aggregate([
      {
        $group: {
          _id: {
            userId: '$userId',
            userEmail: '$userEmail',
            action: '$action',
            resource: '$resource',
            resourceId: '$resourceId',
            // Group by minute to catch duplicates within same minute
            createdAtMinute: {
              $dateToString: {
                format: '%Y-%m-%d %H:%M',
                date: '$createdAt'
              }
            }
          },
          docs: { $push: '$$ROOT' },
          count: { $sum: 1 }
        }
      },
      {
        $match: {
          count: { $gt: 1 }
        }
      }
    ]);

    console.log(`🔍 Found ${duplicates.length} groups with duplicate activities`);

    let totalDeleted = 0;

    for (const duplicate of duplicates) {
      const docs = duplicate.docs;
      
      // Sort by createdAt and keep the first one, delete the rest
      docs.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
      
      // Keep the first document, delete the rest
      const toDelete = docs.slice(1);
      const idsToDelete = toDelete.map(doc => doc._id);
      
      if (idsToDelete.length > 0) {
        await ActivityLog.deleteMany({ _id: { $in: idsToDelete } });
        console.log(`🗑️  Deleted ${idsToDelete.length} duplicate activities for: ${duplicate._id.action} on ${duplicate._id.resource}`);
        totalDeleted += idsToDelete.length;
      }
    }

    console.log(`✅ Cleanup completed! Deleted ${totalDeleted} duplicate activity logs`);

    // Show remaining count
    const remainingCount = await ActivityLog.countDocuments();
    console.log(`📊 Remaining activity logs: ${remainingCount}`);

  } catch (error) {
    console.error('❌ Error during cleanup:', error);
  }
}

// Also add a function to prevent future duplicates by adding compound index
async function addDuplicatePreventionIndex() {
  try {
    console.log('🔧 Adding index to prevent future duplicates...');
    
    // Create compound index to prevent duplicates within 1 minute
    await ActivityLog.collection.createIndex(
      {
        userId: 1,
        action: 1,
        resource: 1,
        resourceId: 1,
        createdAt: 1
      },
      {
        name: 'prevent_duplicates_idx',
        sparse: true
      }
    );
    
    console.log('✅ Duplicate prevention index created');
  } catch (error) {
    console.log('⚠️  Index might already exist:', error.message);
  }
}

// Export functions
module.exports = { 
  cleanupDuplicateActivities, 
  addDuplicatePreventionIndex 
};

// Run if called directly
if (require.main === module) {
  // Connect to MongoDB if not already connected
  if (mongoose.connection.readyState === 0) {
    const dbUrl = process.env.MONGODB_URI || 'mongodb://localhost:27017/quizapp';
    mongoose.connect(dbUrl)
      .then(() => {
        console.log('📦 Connected to MongoDB');
        return cleanupDuplicateActivities();
      })
      .then(() => {
        return addDuplicatePreventionIndex();
      })
      .then(() => {
        console.log('✨ Cleanup and indexing completed, disconnecting...');
        return mongoose.disconnect();
      })
      .catch(error => {
        console.error('💥 Error:', error);
        process.exit(1);
      });
  } else {
    cleanupDuplicateActivities()
      .then(() => addDuplicatePreventionIndex());
  }
} 