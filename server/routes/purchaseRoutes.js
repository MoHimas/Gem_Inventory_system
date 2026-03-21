const router = require('express').Router();
const purchaseController = require('../controllers/purchaseController');
const authorization = require('../middleware/auth');

const upload = require('../middleware/upload');

router.post('/', authorization, upload.single('image'), purchaseController.addPurchase);
router.get('/', authorization, purchaseController.getAllPurchases);
router.patch('/:id/payment', authorization, purchaseController.updatePurchasePayment);
router.put('/:id', authorization, purchaseController.updatePurchase);
router.delete('/:id', authorization, purchaseController.deletePurchase);


module.exports = router;
