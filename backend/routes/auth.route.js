const express = require('express');
const ctrls = require('../controllers/auth.controller');
const { protect } = require('../middleware/auth.middleware');
const router = express.Router();

// Public routes
router.post('/register', ctrls.register);
router.post('/login', ctrls.login);
router.post('/refresh-token', ctrls.refreshToken);
router.post('/logout', ctrls.logout);

// Protected routes
router.get('/profile', protect, ctrls.getProfile);

module.exports = router;