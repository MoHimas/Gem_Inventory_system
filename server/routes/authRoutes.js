const router = require('express').Router();
const authController = require('../controllers/authController');
const authorization = require('../middleware/auth');

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/verify', authorization, authController.verify);
router.post('/logout', authController.logout);

module.exports = router;
