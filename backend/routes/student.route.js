const express = require('express');
const { protect, authorize, requireAndroid } = require('../middleware/auth.middleware');
const { logPracticeHistorySubmission } = require('../middleware/activityLogger.middleware');
const { getActiveSemesters } = require('../controllers/semester.controller');
const { getSubjectsBySemester } = require('../controllers/subject.controller');
const { getExamsForStudent, savePracticeHistory } = require('../controllers/exam.controller');
const { getQuestionsForStudent } = require('../controllers/question.controller');
const router = express.Router();

// Student routes - chỉ cho mobile app
router.use(protect, authorize('student'), requireAndroid);

router.get('/semesters/active', getActiveSemesters);
router.get('/subjects/semester/:semesterId', getSubjectsBySemester);
router.route('/exams/:subjectId')
  .get(getExamsForStudent)

router.get('/questions/:subjectCode', getQuestionsForStudent);
router.post('/exam/practice-history', logPracticeHistorySubmission, savePracticeHistory);

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
