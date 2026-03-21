const jwt = require("jsonwebtoken");
require("dotenv").config();

module.exports = async (req, res, next) => {
  try {
    const token =
      req.cookies.token || req.header("Authorization")?.split(" ")[1];

    if (!token) {
      return res
        .status(403)
        .json({ IsAuthenticated: false, message: "Not Authorized" });
    }

    const payload = jwt.verify(token, process.env.JWT_SECRET);

    const { Pool } = require("pg");
    const pool = require("../config/db");

    const userCheck = await pool.query(
      "SELECT is_active FROM users WHERE id = $1",
      [payload.user.id],
    );

    if (userCheck.rows.length === 0 || userCheck.rows[0].is_active === false) {
      return res
        .status(403)
        .json({
          IsAuthenticated: false,
          message: "Account disabled. Access denied.",
        });
    }

    req.user = payload.user;

    next();
  } catch (err) {
    console.error(err.message);
    return res
      .status(403)
      .json({
        IsAuthenticated: false,
        message: "Not Authorized (Invalid Token)",
      });
  }
};
