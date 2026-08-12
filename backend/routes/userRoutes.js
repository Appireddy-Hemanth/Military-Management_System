const express = require('express');
const { getUsers, createUser, deleteUser } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/rbacMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, authorize('ADMIN'), getUsers)
    .post(protect, authorize('ADMIN'), createUser);

router.route('/:id')
    .delete(protect, authorize('ADMIN'), deleteUser);

module.exports = router;
