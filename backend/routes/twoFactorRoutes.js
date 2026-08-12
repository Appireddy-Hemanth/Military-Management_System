const express = require('express');
const router = express.Router();
const controller = require('../controllers/twoFactorController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.post('/setup', controller.setup2FA);
router.post('/verify', controller.verify2FA);
router.post('/disable', controller.disable2FA);

module.exports = router;
