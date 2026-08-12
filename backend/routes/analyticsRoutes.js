const express = require('express');
const router = express.Router();
const controller = require('../controllers/analyticsController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/overview', controller.getOverview);
router.get('/utilization', controller.getUtilization);

module.exports = router;
