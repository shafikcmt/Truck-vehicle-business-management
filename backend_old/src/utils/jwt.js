const jwt = require('jsonwebtoken');

const generateToken = (userId, email, role = 'staff') => jwt.sign(
  { id: userId, email, role },
  process.env.JWT_SECRET,
  { expiresIn: process.env.JWT_EXPIRY || '7d' }
);

const verifyToken = (token) => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch (err) {
    return null;
  }
};

module.exports = { generateToken, verifyToken };
