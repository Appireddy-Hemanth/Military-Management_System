const express = require('express');
const { getAssignments, createAssignment } = require('../controllers/assignmentController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.route('/').get(protect, getAssignments).post(protect, createAssignment);
module.exports = router;
