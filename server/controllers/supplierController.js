const pool = require('../config/db');

// Add Supplier
const addSupplier = async (req, res) => {
    try {
        const { name, contact_person, email, phone, address } = req.body;
        const newSupplier = await pool.query(
            "INSERT INTO suppliers (name, contact_person, email, phone, address, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *",
            [name, contact_person, email, phone, address, req.user.id]
        );
        res.json(newSupplier.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Get All Suppliers
const getAllSuppliers = async (req, res) => {
    try {
        const suppliers = await pool.query("SELECT * FROM suppliers WHERE user_id = $1 AND is_deleted = FALSE ORDER BY created_at DESC", [req.user.id]);
        res.json(suppliers.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update Supplier
const updateSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, contact_person, email, phone, address } = req.body;
        const updateSupplier = await pool.query(
            "UPDATE suppliers SET name = $1, contact_person = $2, email = $3, phone = $4, address = $5 WHERE id = $6 AND user_id = $7 RETURNING *",
            [name, contact_person, email, phone, address, id, req.user.id]
        );
        if (updateSupplier.rows.length === 0) {
            return res.status(404).json("Supplier not found or unauthorized");
        }
        res.json(updateSupplier.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Delete Supplier
const deleteSupplier = async (req, res) => {
    try {
        const { id } = req.params;
        const deleteSupplier = await pool.query("UPDATE suppliers SET is_deleted = TRUE WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.id]);
        if (deleteSupplier.rows.length === 0) {
            return res.status(404).json("Supplier not found or unauthorized");
        }
        res.json("Supplier deleted");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Get Supplier Stats
const getSupplierStats = async (req, res) => {
    try {
        // 1. Total Suppliers
        const totalSuppliersRes = await pool.query("SELECT COUNT(*) as count FROM suppliers WHERE user_id = $1 AND is_deleted = FALSE", [req.user.id]);
        
        // 2. Active Payables (Total money owed to suppliers)
        const payablesRes = await pool.query("SELECT SUM(total_price - paid_amount) as total FROM purchases WHERE user_id = $1", [req.user.id]);
        
        // 3. New Suppliers (Last 30 days)
        const newSuppliersRes = await pool.query("SELECT COUNT(*) as count FROM suppliers WHERE user_id = $1 AND is_deleted = FALSE AND created_at > NOW() - INTERVAL '30 days'", [req.user.id]);

        res.json({
            totalSuppliers: parseInt(totalSuppliersRes.rows[0].count),
            activePayables: parseFloat(payablesRes.rows[0].total || 0),
            newSuppliers30d: parseInt(newSuppliersRes.rows[0].count)
        });
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    addSupplier,
    getAllSuppliers,
    updateSupplier,
    deleteSupplier,
    getSupplierStats
};
