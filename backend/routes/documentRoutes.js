const express = require('express');
const router = express.Router();
const controller = require('../controllers/documentController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/', controller.getDocuments);
router.post('/', controller.uploadMiddleware, controller.uploadDocument);
router.delete('/:id', controller.deleteDocument);

module.exports = router;
