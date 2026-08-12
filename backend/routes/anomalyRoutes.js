const express = require('express');
const router = express.Router();
const controller = require('../controllers/anomalyController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getAnomalies);
router.put('/:id/resolve', controller.resolve);
router.put('/:id/dismiss', (req, res, next) => {
    req.body.status = 'DISMISSED';
    controller.resolve(req, res, next);
});

module.exports = router;
