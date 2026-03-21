const router = require('express').Router();
const adminController = require('../controllers/adminController');
const authorization = require('../middleware/auth');

// Middleware to check if user is admin
const verifyAdmin = async (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json("Access Denied: Admins only");
    }
    next();
};

router.get('/users', authorization, verifyAdmin, adminController.getAllUsers);
router.get('/stats', authorization, verifyAdmin, adminController.getAdminStats);
router.delete('/users/:id', authorization, verifyAdmin, adminController.deleteUser);
router.patch('/users/:id/status', authorization, verifyAdmin, adminController.toggleUserStatus);

// Security Settings
router.get('/settings', authorization, verifyAdmin, adminController.getSystemSettings);
router.put('/settings', authorization, verifyAdmin, adminController.updateSystemSettings);

module.exports = router;
