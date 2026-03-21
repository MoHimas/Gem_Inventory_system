const pool = require('../config/db');

const getDashboardStats = async (req, res) => {
    try {
        // 1. Total Sales Amount
        const totalSalesRes = await pool.query("SELECT SUM(total_price) as total FROM sales WHERE user_id = $1", [req.user.id]);
        const totalSales = totalSalesRes.rows[0].total || 0;

        // 2. Total Stock Value
        const stockValueRes = await pool.query("SELECT SUM(total_price) as total FROM gemstones WHERE user_id = $1", [req.user.id]);
        const stockValue = stockValueRes.rows[0].total || 0;

        // 3. Total Customers
        const customersRes = await pool.query("SELECT COUNT(*) as count FROM customers WHERE user_id = $1", [req.user.id]);
        const totalCustomers = customersRes.rows[0].count;

        // 3b. Total Suppliers
        const suppliersRes = await pool.query("SELECT COUNT(*) as count FROM suppliers WHERE user_id = $1", [req.user.id]);
        const totalSuppliers = suppliersRes.rows[0].count;

        // 4. Low Stock Items (Quantity < 5)
        const lowStockRes = await pool.query("SELECT COUNT(*) as count FROM gemstones WHERE quantity < 5 AND user_id = $1", [req.user.id]);
        const lowStockCount = lowStockRes.rows[0].count;

        // 5. Total Receivable (Pending payments from Sales)
        // We calculate this as Sum(total_price - paid_amount)
        const receivableRes = await pool.query("SELECT SUM(total_price - paid_amount) as total FROM sales WHERE user_id = $1", [req.user.id]);
        const totalReceivable = receivableRes.rows[0].total || 0;

        // 6. Total Payable (Pending payments to Suppliers)
        const payableRes = await pool.query("SELECT SUM(total_price - paid_amount) as total FROM purchases WHERE user_id = $1", [req.user.id]);
        const totalPayable = payableRes.rows[0].total || 0;

        // 7. Recent Sales (Last 5)
        const recentSales = await pool.query(`
            SELECT s.id, s.total_price, s.sale_date, c.name as customer, g.name as gem
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.user_id = $1
            ORDER BY s.sale_date DESC
            LIMIT 5
        `, [req.user.id]);

        // 8. Stock Distribution by Type (Count and Value)
        const stockDistribution = await pool.query(`
            SELECT type, COUNT(*)::INT as count, SUM(total_price)::FLOAT as value
            FROM gemstones
            WHERE user_id = $1
            GROUP BY type
        `, [req.user.id]);

        // 9. Sales Trend (Last 4 months: Current + 3 previous)
        const salesTrendRes = await pool.query(`
            SELECT TO_CHAR(sale_date, 'Mon') as month, SUM(total_price)::FLOAT as sales, DATE_TRUNC('month', sale_date) as month_date
            FROM sales
            WHERE sale_date >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months' 
            AND sale_date <= NOW()
            AND user_id = $1
            GROUP BY TO_CHAR(sale_date, 'Mon'), DATE_TRUNC('month', sale_date)
            ORDER BY DATE_TRUNC('month', sale_date)
        `, [req.user.id]);

        // 10. Purchases Trend (Last 6 months)
        const purchasesTrendRes = await pool.query(`
            SELECT TO_CHAR(purchase_date, 'Mon') as month, SUM(total_price)::FLOAT as purchases, DATE_TRUNC('month', purchase_date) as month_date
            FROM purchases
            WHERE purchase_date >= DATE_TRUNC('month', NOW()) - INTERVAL '3 months' 
            AND purchase_date <= NOW() AND user_id = $1
            GROUP BY TO_CHAR(purchase_date, 'Mon'), DATE_TRUNC('month', purchase_date)
        `, [req.user.id]);

        // 11. Top Customers
        const topCustomers = await pool.query(`
            SELECT c.name, SUM(s.total_price)::FLOAT as total_spent
            FROM sales s
            JOIN customers c ON s.customer_id = c.id
            WHERE s.user_id = $1
            GROUP BY c.name
            ORDER BY total_spent DESC
            LIMIT 5
        `, [req.user.id]);

        // 12. Payment Status Distribution (Cash Flow Health)
        const paymentStatusDistribution = await pool.query(`
            SELECT payment_status as status, SUM(total_price)::FLOAT as value
            FROM sales
            WHERE user_id = $1
            GROUP BY payment_status
        `, [req.user.id]);

        // 13. Sales Volume by Category
        const salesByCategory = await pool.query(`
            SELECT g.type, COUNT(*)::INT as count
            FROM sales s
            JOIN gemstones g ON s.gemstone_id = g.id
            WHERE s.user_id = $1
            GROUP BY g.type
            ORDER BY count DESC
        `, [req.user.id]);

        // 14. Supplier Performance (By Value)
        const topSuppliers = await pool.query(`
            SELECT sup.name, SUM(p.total_price)::FLOAT as total_value
            FROM purchases p
            JOIN suppliers sup ON p.supplier_id = sup.id
            WHERE p.user_id = $1
            GROUP BY sup.name
            ORDER BY total_value DESC
            LIMIT 5
        `, [req.user.id]);

        // Initialize trend map with the last 4 months (Current + 3 previous)
        const combinedMap = new Map();
        const now = new Date();
        for (let i = 3; i >= 0; i--) {
            const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthLabel = date.toLocaleString('en-US', { month: 'short' });
            const dateKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            
            combinedMap.set(dateKey, {
                month: monthLabel,
                sales: 0,
                purchases: 0,
                sortKey: date.getTime()
            });
        }

        // Process Sales
        salesTrendRes.rows.forEach(r => {
            const d = new Date(r.month_date);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (combinedMap.has(dateKey)) {
                combinedMap.get(dateKey).sales = r.sales;
            }
        });

        // Process Purchases
        purchasesTrendRes.rows.forEach(r => {
            const d = new Date(r.month_date);
            const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
            if (combinedMap.has(dateKey)) {
                combinedMap.get(dateKey).purchases = r.purchases;
            }
        });

        // Convert to array and sort chronologically
        const combinedTrend = Array.from(combinedMap.values())
            .sort((a, b) => a.sortKey - b.sortKey)
            .map(({ month, sales, purchases }) => ({ month, sales, purchases }));

        res.json({
            totalSales: parseFloat(totalSales),
            stockValue: parseFloat(stockValue),
            totalCustomers: parseInt(totalCustomers),
            totalSuppliers: parseInt(totalSuppliers),
            lowStockCount: parseInt(lowStockCount),
            totalReceivable: parseFloat(totalReceivable),
            totalPayable: parseFloat(totalPayable),
            recentSales: recentSales.rows,
            stockDistribution: stockDistribution.rows,
            salesTrend: combinedTrend,
            topCustomers: topCustomers.rows,
            paymentStatusDistribution: paymentStatusDistribution.rows,
            salesByCategory: salesByCategory.rows,
            topSuppliers: topSuppliers.rows
        });

    } catch (err) {
        console.error(err.message);
        res.status(500).send("Server Error");
    }
};

module.exports = {
    getDashboardStats
};
