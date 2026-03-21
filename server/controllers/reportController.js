const pool = require('../config/db');

// Get Sales Report
const getSalesReport = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT s.invoice_number, s.sale_date, c.name as customer, g.name as gemstone, 
                   s.quantity, s.total_price, s.payment_method, s.paid_amount, s.payment_status
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.user_id = $1
            ORDER BY s.sale_date DESC
        `, [req.user.id]);
        res.json(report.rows);
    } catch (err) {
        console.error("REPORT_SALES_ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Inventory Report
const getInventoryReport = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT name, type, color, carat, clarity, quantity, price_per_carat, total_price, purchase_date
            FROM gemstones
            WHERE user_id = $1
            ORDER BY quantity ASC
        `, [req.user.id]);
        res.json(report.rows);
    } catch (err) {
        console.error("REPORT_INVENTORY_ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Purchases Report
const getPurchasesReport = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT p.id, p.purchase_date, s.name as supplier, g.name as gemstone, 
                   p.quantity, p.total_price, p.paid_amount, p.payment_status
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN gemstones g ON p.gemstone_id = g.id
            WHERE p.user_id = $1
            ORDER BY p.purchase_date DESC
        `, [req.user.id]);
        res.json(report.rows);
    } catch (err) {
        console.error("REPORT_PURCHASES_ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Receivables Report (Sales not fully paid)
const getReceivablesReport = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT s.invoice_number, s.sale_date, c.name as customer, g.name as gemstone, 
                   s.total_price, s.paid_amount, (s.total_price - s.paid_amount) as balance, 
                   s.payment_status
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.user_id = $1 AND s.payment_status IN ('Unpaid', 'Partial')
            ORDER BY (s.total_price - s.paid_amount) DESC
        `, [req.user.id]);
        res.json(report.rows);
    } catch (err) {
        console.error("REPORT_RECEIVABLES_ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

// Get Payables Report (Purchases not fully paid)
const getPayablesReport = async (req, res) => {
    try {
        const report = await pool.query(`
            SELECT p.id, p.purchase_date, s.name as supplier, g.name as gemstone, 
                   p.total_price, p.paid_amount, (p.total_price - p.paid_amount) as balance, 
                   p.payment_status
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN gemstones g ON p.gemstone_id = g.id
            WHERE p.user_id = $1 AND p.payment_status IN ('Unpaid', 'Partial')
            ORDER BY (p.total_price - p.paid_amount) DESC
        `, [req.user.id]);
        res.json(report.rows);
    } catch (err) {
        console.error("REPORT_PAYABLES_ERROR:", err);
        res.status(500).json({ error: err.message });
    }
};

module.exports = {
    getSalesReport,
    getInventoryReport,
    getPurchasesReport,
    getReceivablesReport,
    getPayablesReport
};
