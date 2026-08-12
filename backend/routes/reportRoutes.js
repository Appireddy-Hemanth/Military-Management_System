const express = require('express');
const router = express.Router();
const controller = require('../controllers/reportController');
const { protect } = require('../middleware/authMiddleware');

router.use(protect);

router.get('/inventory', controller.getInventoryReport);
router.get('/purchases', controller.getPurchasesReport);
router.get('/transfers', controller.getTransfersReport);
router.get('/expenditures', controller.getExpendituresReport);
router.get('/maintenance', controller.getMaintenanceReport);

module.exports = router;
