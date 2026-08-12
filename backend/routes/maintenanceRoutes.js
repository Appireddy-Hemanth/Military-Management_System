const express = require('express');
const router = express.Router();
const controller = require('../controllers/maintenanceController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getMaintenanceRecord);
router.post('/', controller.createMaintenance);
router.put('/:id', controller.updateMaintenance);

module.exports = router;
