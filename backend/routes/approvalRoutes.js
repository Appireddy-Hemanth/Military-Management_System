const express = require('express');
const router = express.Router();
const controller = require('../controllers/approvalController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getApprovals);
router.put('/:id/approve', controller.approve);
router.put('/:id/reject', controller.reject);

module.exports = router;
