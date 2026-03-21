const pool = require("../config/db");

// Add Customer
const addCustomer = async (req, res) => {
  try {
    const { name, email, phone, address } = req.body;
    const newCustomer = await pool.query(
      "INSERT INTO customers (name, email, phone, address, user_id) VALUES ($1, $2, $3, $4, $5) RETURNING *",
      [name, email, phone, address, req.user.id],
    );
    res.json(newCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get All Customers
const getAllCustomers = async (req, res) => {
  try {
    const customers = await pool.query(
      "SELECT * FROM customers WHERE user_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(customers.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Update Customer
const updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, phone, address } = req.body;
    const updateCustomer = await pool.query(
      "UPDATE customers SET name = $1, email = $2, phone = $3, address = $4 WHERE id = $5 AND user_id = $6 RETURNING *",
      [name, email, phone, address, id, req.user.id],
    );
    if (updateCustomer.rows.length === 0) {
      return res.status(404).json("Customer not found or unauthorized");
    }
    res.json(updateCustomer.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Delete Customer
const deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteCustomer = await pool.query(
      "UPDATE customers SET is_deleted = TRUE WHERE id = $1 AND user_id = $2 RETURNING *",
      [id, req.user.id],
    );
    if (deleteCustomer.rows.length === 0) {
      return res.status(404).json("Customer not found or unauthorized");
    }
    res.json("Customer deleted");
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

// Get Customer Stats
const getCustomerStats = async (req, res) => {
  try {
    //Total Customers
    const totalCustomersRes = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE user_id = $1 AND is_deleted = FALSE",
      [req.user.id],
    );

    // Active Receivables (Total money owed by customers)
    const receivablesRes = await pool.query(
      "SELECT SUM(total_price - paid_amount) as total FROM sales WHERE user_id = $1",
      [req.user.id],
    );

    // New Customers (Last 30 days)
    const newCustomersRes = await pool.query(
      "SELECT COUNT(*) as count FROM customers WHERE user_id = $1 AND is_deleted = FALSE AND created_at > NOW() - INTERVAL '30 days'",
      [req.user.id],
    );

    res.json({
      totalCustomers: parseInt(totalCustomersRes.rows[0].count),
      activeReceivables: parseFloat(receivablesRes.rows[0].total || 0),
      newCustomers30d: parseInt(newCustomersRes.rows[0].count),
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  addCustomer,
  getAllCustomers,
  updateCustomer,
  deleteCustomer,
  getCustomerStats,
};
