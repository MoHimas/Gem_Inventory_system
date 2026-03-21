const pool = require('../config/db');

// Add Sale
const addSale = async (req, res) => {
    try {
        const { stock_id, customer_id, quantity, price_per_carat, payment_method, paid_amount, sale_date } = req.body; 

        // Start transaction
        await pool.query('BEGIN');

        // 1. Check Stock Availability AND Ownership
        const stock = await pool.query("SELECT * FROM gemstones WHERE id = $1 AND user_id = $2", [stock_id, req.user.id]);
        if (stock.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Stock not found or unauthorized");
        }
        
        const currentStock = stock.rows[0];
        if (currentStock.quantity < quantity) {
            await pool.query('ROLLBACK');
            return res.status(400).json("Insufficient stock quantity");
        }

        // 1.c. Validate Sale Date vs Purchase Date
        const saleDateParsed = sale_date ? new Date(sale_date) : new Date();
        const purchaseDateParsed = new Date(currentStock.purchase_date);

        if (saleDateParsed < purchaseDateParsed) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Sale date cannot be before purchase date (${purchaseDateParsed.toLocaleDateString()})` });
        }

        if (saleDateParsed > new Date()) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: "Sale date cannot be in the future" });
        }

        // 1.b. Verify Customer Ownership and Status (Must not be soft-deleted)
        const customer = await pool.query("SELECT * FROM customers WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE", [customer_id, req.user.id]);
        if (customer.rows.length === 0) {
             await pool.query('ROLLBACK');
            return res.status(404).json("Customer not found, unauthorized, or deleted");
        }

        // 2. Calculate Total Price
        const salePrice = price_per_carat || currentStock.price_per_carat;
        const total_price = salePrice * currentStock.carat * quantity; 

        // 3. Determine Payment Status
        let payment_status = 'Unpaid';
        const paid = parseFloat(paid_amount) || 0;
        if (paid >= total_price) {
            payment_status = 'Paid';
        } else if (paid > 0) {
            payment_status = 'Partial';
        }

        // 4. Create Sale Record
        const invoice_number = `INV-${Date.now()}`;
        
        const newSale = await pool.query(
            "INSERT INTO sales (gemstone_id, customer_id, quantity, total_price, invoice_number, payment_method, paid_amount, payment_status, user_id, sale_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [stock_id, customer_id, quantity, total_price, invoice_number, payment_method || 'Cash', paid, payment_status, req.user.id, sale_date || new Date()]
        );

        // 5. Update Stock Quantity
        const newQuantity = currentStock.quantity - quantity;
        await pool.query(
            "UPDATE gemstones SET quantity = $1, total_price = $2 WHERE id = $3",
            [newQuantity, newQuantity * currentStock.carat * currentStock.price_per_carat, stock_id]
        );

        // 6. Create Notification
        const message = `New Sale: ${quantity}x ${currentStock.name} sold for LKR ${total_price} (${payment_status})`;
        await pool.query(
            "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
            [req.user.id, message]
        );

        // Commit transaction
        await pool.query('COMMIT');

        res.json(newSale.rows[0]);

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Get All Sales
const getAllSales = async (req, res) => {
    try {
        const sales = await pool.query(`
            SELECT s.*, g.name as gem_name, g.sku, c.name as customer_name 
            FROM sales s
            JOIN gemstones g ON s.gemstone_id = g.id
            JOIN customers c ON s.customer_id = c.id
            WHERE s.user_id = $1
            ORDER BY s.sale_date DESC
        `, [req.user.id]);
        
        res.json(sales.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update Payment Status / Paid Amount
const updatePaymentStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { paid_amount } = req.body;

        const sale = await pool.query("SELECT * FROM sales WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (sale.rows.length === 0) {
            return res.status(404).json("Sale not found or unauthorized");
        }

        const currentSale = sale.rows[0];
        const total = parseFloat(currentSale.total_price);
        const newPaidAmount = parseFloat(paid_amount);

        let newStatus = 'Unpaid';
        if (newPaidAmount >= total) {
            newStatus = 'Paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'Partial';
        }

        const updatedSale = await pool.query(
            "UPDATE sales SET paid_amount = $1, payment_status = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
            [newPaidAmount, newStatus, id, req.user.id]
        );

        res.json(updatedSale.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Delete Sale
const deleteSale = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('BEGIN');

        // 1. Get sale details to restore stock
        const sale = await pool.query("SELECT * FROM sales WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (sale.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Sale not found or unauthorized");
        }

        const { gemstone_id, quantity } = sale.rows[0];

        // 2. Restore stock quantity
        const stock = await pool.query("SELECT * FROM gemstones WHERE id = $1", [gemstone_id]);
        if (stock.rows.length > 0) {
            const currentStock = stock.rows[0];
            const newQuantity = currentStock.quantity + quantity;
            await pool.query(
                "UPDATE gemstones SET quantity = $1, total_price = $2 WHERE id = $3",
                [newQuantity, newQuantity * currentStock.carat * currentStock.price_per_carat, gemstone_id]
            );
        }

        // 3. Delete sale record
        await pool.query("DELETE FROM sales WHERE id = $1 AND user_id = $2", [id, req.user.id]);

        await pool.query('COMMIT');
        res.json("Sale records deleted and stock restored");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update Sale
const updateSale = async (req, res) => {
    try {
        const { id } = req.params;
        const { stock_id, customer_id, quantity, price_per_carat, payment_method, paid_amount, sale_date } = req.body;

        await pool.query('BEGIN');

        // 1. Get existing sale
        const existingSaleRes = await pool.query("SELECT * FROM sales WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (existingSaleRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Sale record not found or unauthorized");
        }
        const existingSale = existingSaleRes.rows[0];
        const oldQuantity = existingSale.quantity;
        const oldStockId = existingSale.gemstone_id;

        // 2. Adjust old stock (restore quantity)
        const oldStockRes = await pool.query("SELECT * FROM gemstones WHERE id = $1 AND user_id = $2", [oldStockId, req.user.id]);
        if (oldStockRes.rows.length > 0) {
            const oldStock = oldStockRes.rows[0];
            const restoredQuantity = oldStock.quantity + oldQuantity;
            await pool.query(
                "UPDATE gemstones SET quantity = $1, total_price = $2 WHERE id = $3",
                [restoredQuantity, restoredQuantity * oldStock.carat * oldStock.price_per_carat, oldStockId]
            );
        }

        // 3. Verify new stock availability
        const newStockRes = await pool.query("SELECT * FROM gemstones WHERE id = $1 AND user_id = $2", [stock_id, req.user.id]);
        if (newStockRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("New stock not found or unauthorized");
        }

        // 3.a. Verify Customer Status (Must not be soft-deleted)
        const customerRes = await pool.query("SELECT * FROM customers WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE", [customer_id, req.user.id]);
        if (customerRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Customer not found, unauthorized, or deleted");
        }

        const newStock = newStockRes.rows[0];
        if (newStock.quantity < quantity) {
            await pool.query('ROLLBACK');
            return res.status(400).json("Insufficient stock quantity for the updated sale");
        }

        // 3.b. Validate Sale Date vs Purchase Date
        const saleDateParsed = sale_date ? new Date(sale_date) : new Date();
        const purchaseDateParsed = new Date(newStock.purchase_date);

        if (saleDateParsed < purchaseDateParsed) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: `Updated sale date cannot be before purchase date (${purchaseDateParsed.toLocaleDateString()})` });
        }

        if (saleDateParsed > new Date()) {
            await pool.query('ROLLBACK');
            return res.status(400).json({ error: "Updated sale date cannot be in the future" });
        }

        // 4. Update Sale Record
        const salePrice = price_per_carat || newStock.price_per_carat;
        const total_price = salePrice * newStock.carat * quantity;

        let payment_status = 'Unpaid';
        const paid = parseFloat(paid_amount) || 0;
        if (paid >= total_price) {
            payment_status = 'Paid';
        } else if (paid > 0) {
            payment_status = 'Partial';
        }

        const updatedSale = await pool.query(
            `UPDATE sales 
            SET gemstone_id = $1, customer_id = $2, quantity = $3, total_price = $4, 
                payment_method = $5, paid_amount = $6, payment_status = $7, sale_date = $8
            WHERE id = $9 AND user_id = $10 RETURNING *`,
            [stock_id, customer_id, quantity, total_price, payment_method, paid, payment_status, sale_date, id, req.user.id]
        );

        // 5. Update New Stock Quantity
        const finalQuantity = newStock.quantity - quantity;
        await pool.query(
            "UPDATE gemstones SET quantity = $1, total_price = $2 WHERE id = $3",
            [finalQuantity, finalQuantity * newStock.carat * newStock.price_per_carat, stock_id]
        );

        await pool.query('COMMIT');
        res.json(updatedSale.rows[0]);

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    addSale,
    getAllSales,
    updatePaymentStatus,
    deleteSale,
    updateSale
};

