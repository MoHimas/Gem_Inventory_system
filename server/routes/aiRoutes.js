const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');
const authorization = require('../middleware/auth');

router.post('/', authorization, aiController.getSpecificInsight);

module.exports = router;
