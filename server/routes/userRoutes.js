const router = require('express').Router();
const userController = require('../controllers/userController');
const authorization = require('../middleware/auth');
const upload = require('../middleware/upload');

router.put('/profile', authorization, upload.single('image'), userController.updateProfile);

module.exports = router;
