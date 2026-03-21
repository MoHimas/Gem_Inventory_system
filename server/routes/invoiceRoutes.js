const router = require('express').Router();
const invoiceController = require('../controllers/invoiceController');
const authorization = require('../middleware/auth');

router.get('/', authorization, invoiceController.getAllInvoices);
router.get('/:id', authorization, invoiceController.getInvoiceById);

module.exports = router;
