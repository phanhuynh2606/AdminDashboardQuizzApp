const express = require('express');
const ctrls = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const { 
  logRegisterActivity, 
  logLoginActivity, 
  logLogoutActivity, 
  logLogoutAfterResponse 
} = require('../middleware/activityLogger.middleware');
const router = express.Router();

// Public routes
router.post('/register', logRegisterActivity, ctrls.register);
router.post('/login', logLoginActivity, ctrls.login);
router.post('/refresh-token', ctrls.refreshToken);
router.post('/logout', logLogoutActivity, logLogoutAfterResponse, ctrls.logout);

// Protected routes
router.get('/profile', protect, ctrls.getProfile);
router.put('/change-password', protect, ctrls.changePassword);


module.exports = router;