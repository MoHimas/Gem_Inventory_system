const pool = require('../config/db');

const getNotifications = async (req, res) => {
    try {
        const notifications = await pool.query(
            "SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50",
            [req.user.id]
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            "UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2",
            [id, req.user.id]
        );
        res.json("Marked as read");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        await pool.query(
            "DELETE FROM notifications WHERE id = $1 AND user_id = $2",
            [id, req.user.id]
        );
        res.json("Notification deleted");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

const getAllSystemNotifications = async (req, res) => {
    try {
        const notifications = await pool.query(
            "SELECT n.*, u.username FROM notifications n JOIN users u ON n.user_id = u.id ORDER BY n.created_at DESC LIMIT 100"
        );
        res.json(notifications.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    getNotifications,
    markAsRead,
    deleteNotification,
    getAllSystemNotifications
};
