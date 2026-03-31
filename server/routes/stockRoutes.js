const router = require('express').Router();
const stockController = require('../controllers/stockController');
const authorization = require('../middleware/auth');

// Only GET route allowed for stock (View Only)
router.get('/', authorization, stockController.getAllStocks);

module.exports = router;
