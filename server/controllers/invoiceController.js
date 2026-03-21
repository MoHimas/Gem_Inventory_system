const pool = require('../config/db');

// Get All Invoices
const getAllInvoices = async (req, res) => {
    try {
        const invoices = await pool.query(`
            SELECT s.id, s.invoice_number, s.sale_date, s.total_price, s.payment_status, c.name as customer_name, s.quantity, g.name as item_name
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.user_id = $1
            ORDER BY s.sale_date DESC
        `, [req.user.id]);
        res.json(invoices.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Get Single Invoice Details
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;
        const invoice = await pool.query(`
            SELECT s.*, c.name as customer_name, c.email as customer_email, c.address as customer_address, 
                   g.name as item_name, g.type as item_type, g.carat, g.cut, g.color, g.clarity, g.sku
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.id = $1 AND s.user_id = $2
        `, [id, req.user.id]);

        if (invoice.rows.length === 0) {
            return res.status(404).json("Invoice not found or unauthorized");
        }

        res.json(invoice.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    getAllInvoices,
    getInvoiceById
};
