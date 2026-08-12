const express = require('express');
const { getTransfers, createTransfer, completeTransfer } = require('../controllers/transferController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getTransfers)
    .post(protect, createTransfer);

router.route('/:id/complete')
    .post(protect, completeTransfer);

module.exports = router;
