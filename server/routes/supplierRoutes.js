const router = require('express').Router();
const supplierController = require('../controllers/supplierController');
const authorization = require('../middleware/auth');

router.post('/', authorization, supplierController.addSupplier);
router.get('/', authorization, supplierController.getAllSuppliers);
router.get('/stats', authorization, supplierController.getSupplierStats);
router.put('/:id', authorization, supplierController.updateSupplier);
router.delete('/:id', authorization, supplierController.deleteSupplier);

module.exports = router;
