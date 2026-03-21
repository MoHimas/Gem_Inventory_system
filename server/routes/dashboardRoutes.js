const router = require('express').Router();
const dashboardController = require('../controllers/dashboardController');
const authorization = require('../middleware/auth');

router.get('/', authorization, dashboardController.getDashboardStats);

module.exports = router;
