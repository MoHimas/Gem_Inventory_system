const router = require('express').Router();
const notificationController = require('../controllers/notificationController');
const authorization = require('../middleware/auth');

router.get('/', authorization, notificationController.getNotifications);
router.put('/:id/read', authorization, notificationController.markAsRead);
router.delete('/:id', authorization, notificationController.deleteNotification);

const verifyAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json("Access Denied");
    }
    next();
};

router.get('/all', authorization, verifyAdmin, notificationController.getAllSystemNotifications);

module.exports = router;
