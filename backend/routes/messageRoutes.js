const express = require('express');
const router = express.Router();
const controller = require('../controllers/messageController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getMessages);
router.post('/', controller.sendMessage);
router.put('/:id/read', controller.markRead);

module.exports = router;
