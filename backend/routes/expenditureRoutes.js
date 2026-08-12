const express = require('express');
const { getExpenditures, createExpenditure } = require('../controllers/expenditureController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
router.route('/').get(protect, getExpenditures).post(protect, createExpenditure);
module.exports = router;
