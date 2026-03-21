const pool = require('../config/db');
const cloudinary = require('../config/cloudinary');
const fs = require('fs');

// Add new gemstone
const addStock = async (req, res) => {
    try {
        const { name, type, color, cut, carat, clarity, quantity, price_per_carat, condition, supplier_id, purchase_date } = req.body;
        let image_url = null;

        if (req.file) {
            // Upload to Cloudinary
            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: 'gem_inventory/stocks'
            });
            image_url = result.secure_url;
            // Remove local file
            fs.unlinkSync(req.file.path);
        }

        if (purchase_date && new Date(purchase_date) > new Date()) {
            if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            return res.status(400).json({ error: "Purchase date cannot be in the future" });
        }

        const total_price = parseFloat(price_per_carat) * parseFloat(carat) * parseInt(quantity); // Estimated value logic can vary

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
        
        // Verify Supplier Status (Must be active if provided)
        if (supplier_id) {
            const supplierRes = await pool.query("SELECT * FROM suppliers WHERE id = $1 AND user_id = $2 AND is_deleted = FALSE", [supplier_id, req.user.id]);
            if (supplierRes.rows.length === 0) {
                if (req.file && fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
                return res.status(404).json("Supplier not found, unauthorized, or deleted");
            }
        }

        const newStock = await pool.query(
            `INSERT INTO gemstones 
            (name, type, color, cut, carat, clarity, quantity, price_per_carat, total_price, image_url, condition, supplier_id, user_id, purchase_date, sku) 
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) 
            RETURNING *`,
            [name, type, color, cut, carat, clarity, quantity, price_per_carat, total_price, image_url, condition || 'Natural', supplier_id || null, req.user.id, purchase_date || new Date(), sku]
        );

        res.json(newStock.rows[0]);
    } catch (err) {
        console.error(err.message);
        if (req.file && fs.existsSync(req.file.path)) {
             fs.unlinkSync(req.file.path);
        }
        res.status(500).send("Server Error");
    }
};

// Get all stocks
const getAllStocks = async (req, res) => {
    try {
        const stocks = await pool.query("SELECT * FROM gemstones WHERE user_id = $1 ORDER BY created_at DESC", [req.user.id]);
        res.json(stocks.rows);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Update stock
const updateStock = async (req, res) => {
    try {
        const { id } = req.params;
        const { name, type, color, cut, carat, clarity, quantity, price_per_carat, condition, purchase_date } = req.body;
        // Logic to update image if new file provided is slightly more complex, skipping for MVP unless requested.
        
        if (purchase_date && new Date(purchase_date) > new Date()) {
            return res.status(400).json({ error: "Updated purchase date cannot be in the future" });
        }

        // Recalculate total price
        const total_price = parseFloat(price_per_carat) * parseFloat(carat) * parseInt(quantity);

        const updateStock = await pool.query(
            `UPDATE gemstones 
            SET name = $1, type = $2, color = $3, cut = $4, carat = $5, clarity = $6, quantity = $7, price_per_carat = $8, total_price = $9, condition = $10, purchase_date = $11
            WHERE id = $12 AND user_id = $13 RETURNING *`,
            [name, type, color, cut, carat, clarity, quantity, price_per_carat, total_price, condition || 'Natural', purchase_date, id, req.user.id]
        );

        if (updateStock.rows.length === 0) {
            return res.json("Stock not found or unauthorized");
        }

        res.json(updateStock.rows[0]);
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

// Delete stock
const deleteStock = async (req, res) => {
    try {
        const { id } = req.params;
        
        // Optional: Delete image from cloudinary if needed logic here

        const deleteStock = await pool.query("DELETE FROM gemstones WHERE id = $1 AND user_id = $2 RETURNING *", [id, req.user.id]);
        
        if (deleteStock.rows.length === 0) {
            return res.json("Stock not found or unauthorized");
        }

        res.json("Stock was deleted");
    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    addStock,
    getAllStocks,
    updateStock,
    deleteStock
};
