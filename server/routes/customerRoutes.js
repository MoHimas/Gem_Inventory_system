const router = require('express').Router();
const customerController = require('../controllers/customerController');
const authorization = require('../middleware/auth');

router.post('/', authorization, customerController.addCustomer);
router.get('/', authorization, customerController.getAllCustomers);
router.get('/stats', authorization, customerController.getCustomerStats);
router.put('/:id', authorization, customerController.updateCustomer);
router.delete('/:id', authorization, customerController.deleteCustomer);

module.exports = router;
