const express = require('express');
const { getEquipment, createEquipment } = require('../controllers/equipmentController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getEquipment)
    .post(protect, authorize('ADMIN'), createEquipment);

module.exports = router;
