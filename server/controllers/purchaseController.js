const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Add Purchase (Create Stock & Record Transaction)
const addPurchase = async (req, res) => {
    try {
        const { 
            supplier_id, 
            description, 
            quantity, 
            price_per_carat, 
            payment_method, 
            paid_amount,
            // New Gemstone Details
            name,
            type,
            color,
            carat,
            clarity,
            cut,
            condition,
            purchase_date
        } = req.body;
        
        let image_url = null;
        if (req.file) {
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'gem_inventory/stocks'
            });
            image_url = result.secure_url;
            fs.unlinkSync(req.file.path);
        }

        // Validate Purchase Date
        const purchaseDateParsed = purchase_date ? new Date(purchase_date) : new Date();
        if (purchaseDateParsed > new Date()) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Purchase date cannot be in the future" });
        }

        // Start transaction
        await pool.query('BEGIN');

        // 1. Verify Supplier Status (Must be active)
         const supplier = await pool.query("SELECT * FROM suppliers WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE", [supplier_id, req.user.id]);
        if (supplier.rows.length === 0) {
             await pool.query('ROLLBACK');
             if (req.file) await cloudinary.uploader.destroy(result.public_id); // Cleanup if fail
            return res.status(404).json("Supplier not found, unauthorized, or deleted");
        }

        // 2. Create Stock Entry (Gemstone)
        // Generate SKU per user
        const maxSkuRes = await pool.query(
            "SELECT sku FROM gemstones WHERE user_id = $1 AND sku ~ '^G[0-9]+$' ORDER BY sku DESC LIMIT 1", 
            [req.user.id]
        );
        
        let nextId = 1;
        if (maxSkuRes.rows.length > 0) {
            const lastSku = maxSkuRes.rows[0].sku;
            const lastId = parseInt(lastSku.substring(1));
            nextId = lastId + 1;
        }
        
        const sku = `G${String(nextId).padStart(3, '0')}`;

        const total_value = parseFloat(price_per_carat) * parseFloat(carat) * parseInt(quantity);
        
        const newStock = await pool.query(
            `INSERT INTO gemstones 
            (name, type, color, cut, carat, clarity, quantity, price_per_carat, total_price, image_url, condition, supplier_id, user_id, purchase_date, sku) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *`,
            [name, type, color, cut, carat, clarity, quantity, price_per_carat, total_value, image_url, condition || 'Natural', supplier_id, req.user.id, purchase_date || new Date(), sku]
        );
        const gemstone_id = newStock.rows[0].id;

        // 3. Create Purchase Record
        // Purchase total is same as initial stock value for this batch
        const total_purchase_price = total_value; 

        // Payment logic
        let payment_status = 'Unpaid';
        const paid = parseFloat(paid_amount) || 0;
        if (paid >= total_purchase_price) {
            payment_status = 'Paid';
        } else if (paid > 0) {
            payment_status = 'Partial';
        }

        const newPurchase = await pool.query(
            "INSERT INTO purchases (supplier_id, gemstone_id, description, quantity, total_price, payment_method, paid_amount, payment_status, user_id, purchase_date) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *",
            [supplier_id, gemstone_id, description, quantity, total_purchase_price, payment_method || 'Cash', paid, payment_status, req.user.id, purchase_date || new Date()]
        );

         // 4. Create Notification
         const message = `New Stock Added: ${quantity}x ${name} (${carat}ct ${cut} ${type}) from ${supplier.rows[0].name}.`;
         await pool.query(
             "INSERT INTO notifications (user_id, message) VALUES ($1, $2)",
             [req.user.id, message]
         );

        await pool.query('COMMIT');
        res.json({ purchase: newPurchase.rows[0], stock: newStock.rows[0] });

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
        res.status(500).send("Server Error");
    }
};

// Get All Purchases
const getAllPurchases = async (req, res) => {
    try {
        const purchases = await pool.query(`
            SELECT p.*, s.name as supplier_name, g.name as gem_name, g.sku, g.type, g.color, g.carat, g.clarity, g.cut, g.condition, g.price_per_carat as gem_price_per_carat
            FROM purchases p
            JOIN suppliers s ON p.supplier_id = s.id
            JOIN gemstones g ON p.gemstone_id = g.id
            WHERE p.user_id = $1
            ORDER BY p.purchase_date DESC
        `, [req.user.id]);

        res.json(purchases.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update Purchase Payment / Paid Amount
const updatePurchasePayment = async (req, res) => {
    try {
        const { id } = req.params;
        const { paid_amount } = req.body;

        const purchase = await pool.query("SELECT * FROM purchases WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (purchase.rows.length === 0) {
            return res.status(404).json("Purchase record not found or unauthorized");
        }

        const currentPurchase = purchase.rows[0];
        const total = parseFloat(currentPurchase.total_price);
        const newPaidAmount = parseFloat(paid_amount);

        let newStatus = 'Unpaid';
        if (newPaidAmount >= total) {
            newStatus = 'Paid';
        } else if (newPaidAmount > 0) {
            newStatus = 'Partial';
        }

        const updatedPurchase = await pool.query(
            "UPDATE purchases SET paid_amount = $1, payment_status = $2 WHERE id = $3 AND user_id = $4 RETURNING *",
            [newPaidAmount, newStatus, id, req.user.id]
        );

        res.json(updatedPurchase.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Delete Purchase
const deletePurchase = async (req, res) => {
    try {
        const { id } = req.params;

        await pool.query('BEGIN');

        // 1. Get purchase details to revert stock
        const purchase = await pool.query("SELECT * FROM purchases WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (purchase.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Purchase record not found or unauthorized");
        }

        const { gemstone_id, quantity } = purchase.rows[0];

        // 2. Revert stock quantity (subtract)
        const stock = await pool.query("SELECT * FROM gemstones WHERE id = $1", [gemstone_id]);
        if (stock.rows.length > 0) {
            const currentStock = stock.rows[0];
            const newQuantity = currentStock.quantity - quantity;
            
            // Should we allow negative stock? Probably not, but deleting a purchase record should revert it.
            // If someone already sold the gems, this might be tricky, but we'll allow it for now as a simple revert.
            await pool.query(
                "UPDATE gemstones SET quantity = $1, total_price = $2 WHERE id = $3",
                [newQuantity, newQuantity * currentStock.carat * currentStock.price_per_carat, gemstone_id]
            );
        }

        // 3. Delete purchase record
        await pool.query("DELETE FROM purchases WHERE id = $1 AND user_id = $2", [id, req.user.id]);

        await pool.query('COMMIT');
        res.json("Purchase record deleted and stock reverted");
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update Purchase
const updatePurchase = async (req, res) => {
    try {
        const { id } = req.params;
        const { 
            supplier_id, 
            description, 
            quantity, 
            price_per_carat, 
            payment_method, 
            paid_amount,
            name,
            type,
            color,
            carat,
            clarity,
            cut,
            condition,
            purchase_date
        } = req.body;

        // Validate Purchase Date
        const purchaseDateParsed = purchase_date ? new Date(purchase_date) : new Date();
        if (purchaseDateParsed > new Date()) {
            return res.status(400).json({ error: "Updated purchase date cannot be in the future" });
        }

        await pool.query('BEGIN');

        // 1. Get existing purchase
        const existingPurchaseRes = await pool.query("SELECT * FROM purchases WHERE id = $1 AND user_id = $2", [id, req.user.id]);
        if (existingPurchaseRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Purchase record not found or unauthorized");
        }
        const existingPurchase = existingPurchaseRes.rows[0];
        const gemstone_id = existingPurchase.gemstone_id;

        // 1.b. Verify Supplier Status (Must be active)
        const supplierRes = await pool.query("SELECT * FROM suppliers WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE", [supplier_id, req.user.id]);
        if (supplierRes.rows.length === 0) {
            await pool.query('ROLLBACK');
            return res.status(404).json("Supplier not found, unauthorized, or deleted");
        }

        // 2. Update Gemstone Record
        const newTotalValue = parseFloat(price_per_carat) * parseFloat(carat) * parseInt(quantity);
        await pool.query(
            `UPDATE gemstones 
            SET name = $1, type = $2, color = $3, cut = $4, carat = $5, clarity = $6, 
                quantity = $7, price_per_carat = $8, total_price = $9, supplier_id = $10, condition = $11, purchase_date = $12
            WHERE id = $13 AND user_id = $14`,
            [name, type, color, cut, carat, clarity, quantity, price_per_carat, newTotalValue, supplier_id, condition || 'Natural', purchase_date, gemstone_id, req.user.id]
        );

        // 3. Update Purchase Record
        let payment_status = 'Unpaid';
        const paid = parseFloat(paid_amount) || 0;
        if (paid >= newTotalValue) {
            payment_status = 'Paid';
        } else if (paid > 0) {
            payment_status = 'Partial';
        }

        const updatedPurchase = await pool.query(
            `UPDATE purchases 
            SET supplier_id = $1, description = $2, quantity = $3, total_price = $4, 
                payment_method = $5, paid_amount = $6, payment_status = $7, purchase_date = $8
            WHERE id = $9 AND user_id = $10 RETURNING *`,
            [supplier_id, description, quantity, newTotalValue, payment_method, paid, payment_status, purchase_date, id, req.user.id]
        );

        await pool.query('COMMIT');
        res.json(updatedPurchase.rows[0]);

    } catch (err) {
        await pool.query('ROLLBACK');
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    addPurchase,
    getAllPurchases,
    updatePurchasePayment,
    deletePurchase,
    updatePurchase
};

