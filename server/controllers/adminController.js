const pool = require("../config/db");

// Get All Users (Admin only)
const getAllUsers = async (req, res) => {
  try {
    const users = await pool.query(
      "SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC",
    );
    res.json(users.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete User (Admin only)
const deleteUser = async (req, res) => {
  const client = await pool.pool.connect();
  try {
    const { id } = req.params;

    // Prevent deleting self
    if (id === req.user.id) {
      return res.status(400).json("Cannot delete your own account");
    }

    await client.query("BEGIN");

    // Delete all associated records in reverse order of dependence
    await client.query("DELETE FROM notifications WHERE user_id = $1", [id]);
    await client.query("DELETE FROM ai_insights WHERE user_id = $1", [id]);
    await client.query("DELETE FROM sales WHERE user_id = $1", [id]);
    await client.query("DELETE FROM purchases WHERE user_id = $1", [id]);
    await client.query("DELETE FROM gemstones WHERE user_id = $1", [id]);
    await client.query("DELETE FROM customers WHERE user_id = $1", [id]);
    await client.query("DELETE FROM suppliers WHERE user_id = $1", [id]);

    //delete the user
    const deleteRes = await client.query(
      "DELETE FROM users WHERE id = $1 RETURNING *",
      [id],
    );

    if (deleteRes.rows.length === 0) {
      await client.query("ROLLBACK");
      return res.status(404).json("User not found");
    }

    await client.query("COMMIT");
    res.json("User and all associated data deleted successfully");
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Deletion error:", err.message);
    res.status(500).send(`Failed to delete user: ${err.message}`);
  } finally {
    client.release();
  }
};

// Get System Stats (Admin only)
const getAdminStats = async (req, res) => {
  try {
    // 1. Total Traders
    const tradersRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE role = 'trader'",
    );
    const totalTraders = parseInt(tradersRes.rows[0].count);

    // 2. Active Now (Active Traders)
    const activeRes = await pool.query(
      "SELECT COUNT(*) FROM users WHERE is_active = true AND role = 'trader'",
    );
    const activeTraders = parseInt(activeRes.rows[0].count);

    // 3. System-wide Inventory
    const inventoryRes = await pool.query(
      "SELECT SUM(total_price) as total, SUM(quantity) as qty FROM gemstones",
    );
    const totalInventoryValue = inventoryRes.rows[0].total || 0;
    const totalPieces = inventoryRes.rows[0].qty || 0;

    // 4. Global Sales Performance
    const salesRes = await pool.query(
      "SELECT SUM(total_price) as total, COUNT(*) as count FROM sales",
    );
    const totalSalesValue = salesRes.rows[0].total || 0;
    const totalSalesCount = salesRes.rows[0].count || 0;

    // 5. Global Purchase History
    const purchasesRes = await pool.query(
      "SELECT SUM(total_price) as total FROM purchases",
    );
    const totalPurchasesValue = purchasesRes.rows[0].total || 0;

    res.json({
      totalTraders,
      activeTraders,
      totalInventoryValue,
      totalPieces,
      totalSalesValue,
      totalSalesCount,
      totalPurchasesValue,
      systemStatus: "Operational",
      dbStatus: "Connected",
      lastSync: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Toggle User Active Status
const toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;

    // Prevent admin from disabling themselves (security check)
    if (id === req.user.id) {
      return res.status(400).json("You cannot disable your own account.");
    }

    await pool.query("UPDATE users SET is_active = $1 WHERE id = $2", [
      is_active,
      id,
    ]);

    res.json(`User status updated to ${is_active ? "Active" : "Disabled"}`);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get Security Settings
const getSystemSettings = async (req, res) => {
  try {
    const settings = await pool.query(
      "SELECT * FROM system_settings WHERE id = 1",
    );
    if (settings.rows.length === 0) {
      // Initialize if missing (failsafe)
      await pool.query(
        "INSERT INTO system_settings (id, maintenance_mode, allow_registration) VALUES (1, FALSE, TRUE)",
      );
      return res.json({ maintenance_mode: false, allow_registration: true });
    }
    res.json(settings.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update Security Settings
const updateSystemSettings = async (req, res) => {
  try {
    const { maintenance_mode, allow_registration } = req.body;

    await pool.query(
      "UPDATE system_settings SET maintenance_mode = $1, allow_registration = $2 WHERE id = 1",
      [maintenance_mode, allow_registration],
    );

    // Log this action (notification)
    const activityMessage = `System settings updated: User registration is now ${allow_registration ? "ENABLED" : "DISABLED"}, and maintenance mode is ${maintenance_mode ? "ENABLED" : "DISABLED"}.`;
    await pool.query(
      "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
      [req.user.id, activityMessage],
    );

    res.json("Settings updated");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllUsers,
  deleteUser,
  getAdminStats,
  toggleUserStatus,
  getSystemSettings,
  updateSystemSettings,
};
