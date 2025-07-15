const express = require('express');
const { protect, authorize, requireWeb } = require('../middleware/auth.middleware');
const {
  logUserCreation,
  logUserUpdate,
  logUserDeletion,
  logNotificationCreation
} = require('../middleware/activityLogger.middleware');

// Admin controllers
const {
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
} = require('../controllers/admin.controller');

// Semester controllers
const {
  getSemesters,
  getSemesterById,
  createSemester,
  updateSemester,
  deleteSemester,
  toggleSemesterStatus,
  getSemesterStats,
  getActiveSemesters
} = require('../controllers/semester.controller');

// Subject controllers
const {
  getSubjects,
  getSubjectById,
  createSubject,
  updateSubject,
  deleteSubject,
  toggleSubjectStatus,
  getSubjectStats,
  getSubjectsBySemester,
  getActiveSubjects,
  duplicateSubject
} = require('../controllers/subject.controller');

// Exam controllers
const {
  getExams,
  getExamById,
  createExam,
  updateExam,
  deleteExam,
  toggleExamStatus,
  toggleExamPublished,
  getExamStats,
  getExamTypes,
  duplicateExam,
  getExamQuestions
} = require('../controllers/exam.controller');

// Question controllers
const {
  getQuestions,
  getQuestionById,
  createQuestion,
  updateQuestion,
  deleteQuestion,
  toggleQuestionStatus,
  getQuestionStats,
  getQuestionTags,
  bulkUpdateQuestions,
  bulkDeleteQuestions,
  duplicateQuestion
} = require('../controllers/question.controller');
const { getExamsHistory } = require('../controllers/exam-history.controller');

const router = express.Router();

// Admin routes - chỉ cho web dashboard
router.use(protect, authorize('admin'), requireWeb);

// Dashboard routes
router.get('/dashboard', getDashboardStats);

// User management routes
router.route('/users')
  .get(getUsers)
  .post(logUserCreation, createUser);

router.route('/users/:id')
  .get(getUserById)
  .put(logUserUpdate, updateUser)
  .delete(logUserDeletion, deleteUser);

// Semester management routes
router.get('/semesters/stats', getSemesterStats);
router.get('/semesters/active', getActiveSemesters);
router.route('/semesters')
  .get(getSemesters)
  .post(createSemester);

router.route('/semesters/:id')
  .get(getSemesterById)
  .put(updateSemester)
  .delete(deleteSemester);

router.patch('/semesters/:id/toggle-status', toggleSemesterStatus);

// Subject management routes
router.get('/subjects/stats', getSubjectStats);
router.get('/subjects/active', getActiveSubjects);
router.get('/subjects/semester/:semesterId', getSubjectsBySemester);
router.route('/subjects')
  .get(getSubjects)
  .post(createSubject);

router.route('/subjects/:id')
  .get(getSubjectById)
  .put(updateSubject)
  .delete(deleteSubject);

router.patch('/subjects/:id/toggle-status', toggleSubjectStatus);
router.post('/subjects/:id/duplicate', duplicateSubject);

// Exam management routes
router.get('/exams/stats', getExamStats);
router.get('/exam-types', getExamTypes);
router.route('/exams')
  .get(getExams)
  .post(createExam);

router.route('/exams/:id')
  .get(getExamById)
  .put(updateExam)
  .delete(deleteExam);

router.patch('/exams/:id/toggle-status', toggleExamStatus);
router.patch('/exams/:id/toggle-published', toggleExamPublished);
router.post('/exams/:id/duplicate', duplicateExam);
router.get('/exams/:id/questions', getExamQuestions);

router.get("/exams/history", getExamsHistory);

// Question management routes
router.get('/questions/stats', getQuestionStats);
router.get('/questions/tags', getQuestionTags);
router.patch('/questions/bulk-update', bulkUpdateQuestions);
router.delete('/questions/bulk-delete', bulkDeleteQuestions);
router.route('/questions')
  .get(getQuestions)
  .post(createQuestion);

router.route('/questions/:id')
  .get(getQuestionById)
  .put(updateQuestion)
  .delete(deleteQuestion);

router.patch('/questions/:id/toggle-status', toggleQuestionStatus);
router.post('/questions/:id/duplicate', duplicateQuestion);

// Notification management routes
router.route('/notifications')
  .get(getNotifications)
  .post(logNotificationCreation, createNotification);

// Activity logs routes
router.get('/activities', getActivityLogs);
router.post('/activities/clean', cleanActivityLogsByTime);

module.exports = router;
