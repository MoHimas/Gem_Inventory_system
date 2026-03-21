const router = require('express').Router();
const reportController = require('../controllers/reportController');
const authorization = require('../middleware/auth');

router.get('/sales', authorization, reportController.getSalesReport);
router.get('/inventory', authorization, reportController.getInventoryReport);
router.get('/purchases', authorization, reportController.getPurchasesReport);
router.get('/receivables', authorization, reportController.getReceivablesReport);
router.get('/payables', authorization, reportController.getPayablesReport);

module.exports = router;
