const router = require('express').Router();
const saleController = require('../controllers/saleController');
const authorization = require('../middleware/auth');

router.post('/', authorization, saleController.addSale);
router.get('/', authorization, saleController.getAllSales);
router.patch('/:id/payment', authorization, saleController.updatePaymentStatus);
router.put('/:id', authorization, saleController.updateSale);
router.delete('/:id', authorization, saleController.deleteSale);


module.exports = router;
