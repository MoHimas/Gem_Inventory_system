const router = require('express').Router();
const stockController = require('../controllers/stockController');
const authorization = require('../middleware/auth');
const upload = require('../middleware/upload');

// All routes protected
router.post('/', authorization, upload.single('image'), stockController.addStock);
router.get('/', authorization, stockController.getAllStocks);
router.put('/:id', authorization, stockController.updateStock);
router.delete('/:id', authorization, stockController.deleteStock);

module.exports = router;
