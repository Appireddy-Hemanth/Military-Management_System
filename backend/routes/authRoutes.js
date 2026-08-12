const express = require('express');
const { login, getMe, verifyLogin2FA } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/login/verify-2fa', verifyLogin2FA);
router.get('/me', protect, getMe);

module.exports = router;
