const { Pool, types } = require("pg");

types.setTypeParser(1114, function (stringValue) {
  return new Date(stringValue.replace(" ", "T") + "Z");
});
require("dotenv").config();

console.log(
  "SERVER DATABASE_URL starts with:",
  process.env.DATABASE_URL?.substring(0, 15),
);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl:
    process.env.NODE_ENV === "production"
      ? { rejectUnauthorized: false }
      : false,
});

pool.on("connect", () => {
  console.log("Connected to the PostgreSQL database");
});

pool.on("error", (err) => {
  console.error("Unexpected error on idle client", err);
  process.exit(-1);
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
