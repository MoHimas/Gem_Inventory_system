const pool = require("../config/db");

// Get all stocks
const getAllStocks = async (req, res) => {
  try {
    const stocks = await pool.query(
      "SELECT * FROM gemstones WHERE user_id = $1 ORDER BY created_at DESC",
      [req.user.id],
    );
    res.json(stocks.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  getAllStocks,
};
