const express = require('express');
const { protect, authorize, requireWeb } = require('../middleware/auth.middleware');
const router = express.Router();

// Admin routes - chỉ cho web dashboard
router.use(protect, authorize('admin'), requireWeb);

// Admin dashboard routes sẽ thêm sau
router.get('/dashboard', (req, res) => {
  res.json({
    success: true,
    message: 'Admin dashboard data',
    data: {
      user: req.user,
      stats: {
        totalStudents: 0,
        totalExams: 0,
        totalQuestions: 0
      }
    }
  });
});

module.exports = router;
