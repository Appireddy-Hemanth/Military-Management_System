const express = require('express');
const { getBases, getBaseById, createBase, updateBase, deleteBase } = require('../controllers/baseController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, authorize('ADMIN'), getBases)
    .post(protect, authorize('ADMIN'), createBase);

router.route('/:id')
    .get(protect, authorize('ADMIN', 'BASE_COMMANDER', 'LOGISTICS_OFFICER'), getBaseById)
    .put(protect, authorize('ADMIN'), updateBase)
    .delete(protect, authorize('ADMIN'), deleteBase);

module.exports = router;
