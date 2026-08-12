const express = require('express');
const { getMetrics, getDistribution, getAlerts } = require('../controllers/dashboardController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.route('/metrics').get(protect, getMetrics);
router.route('/distribution').get(protect, getDistribution);
router.route('/alerts').get(protect, getAlerts);
module.exports = router;
