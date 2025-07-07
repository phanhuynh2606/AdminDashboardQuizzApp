const express = require('express');
const ctrls = require('../controllers/auth.controller');
const router = express.Router();

router.post('/register', ctrls.register);
router.post('/login', ctrls.login);

module.exports = router;