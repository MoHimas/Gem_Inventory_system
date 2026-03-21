const jwt = require('jsonwebtoken');
require('dotenv').config();

function jwtGenerator(user_id, role) {
  const payload = {
    user: {
      id: user_id,
      role: role
    }
  };

  if (!process.env.JWT_SECRET) {
    console.error("CRITICAL ERROR: JWT_SECRET is missing from environment variables.");
    throw new Error("JWT_SECRET is missing");
  }
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' });
}

module.exports = jwtGenerator;
