const express = require('express');
const { protect, authorize, requireAndroid } = require('../middleware/auth.middleware');
const { getActiveSemesters } = require('../controllers/semester.controller');
const { getSubjectsBySemester } = require('../controllers/subject.controller');
const { getExamsForStudent } = require('../controllers/exam.controller');
const router = express.Router();

// Student routes - chỉ cho mobile app
router.use(protect, authorize('student'), requireAndroid);

router.get('/semesters/active', getActiveSemesters);
router.get('/subjects/semester/:semesterId', getSubjectsBySemester);
router.route('/exams/:subjectId')
  .get(getExamsForStudent)



// Student app routes sẽ thêm sau
router.get('/exams', (req, res) => {
  res.json({
    success: true,
    message: 'Available exams for student',
    data: {
      user: req.user,
      exams: []
    }
  });
});

router.get('/profile', (req, res) => {
  res.json({
    success: true,
    message: 'Student profile',
    data: {
      user: req.user,
      practiceHistory: []
    }
  });
});

module.exports = router;
