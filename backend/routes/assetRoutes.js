const express = require('express');
const { getAssets, getAssetTimeline } = require('../controllers/assetController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.route('/')
    .get(protect, getAssets);

router.route('/:id/timeline')
    .get(protect, getAssetTimeline);

module.exports = router;
