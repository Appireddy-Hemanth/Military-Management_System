const express = require('express');
const { getPurchases, createPurchase } = require('../controllers/purchaseController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getPurchases)
    .post(protect, createPurchase);

module.exports = router;
