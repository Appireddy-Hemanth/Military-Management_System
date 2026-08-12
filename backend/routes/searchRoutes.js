const express = require('express');
const router = express.Router();
const controller = require('../controllers/searchController');
const { protect } = require('../middleware/authMiddleware');

router.get('/', protect, controller.globalSearch);

module.exports = router;
