const bcrypt = require('bcryptjs');
const pool = require('../config/database');

async function ensureDefaultAdmin() {
  const autoCreate = process.env.AUTO_CREATE_ADMIN;
  if (autoCreate === 'false') {
    return;
  }

  const email = process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com';
  const password = process.env.DEFAULT_ADMIN_PASSWORD || 'password123';

  const existingAdmin = await pool.query("SELECT id, email FROM users WHERE role = 'admin' LIMIT 1");
  if (existingAdmin.rows.length > 0) {
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await pool.query(
    'INSERT INTO users (email, password_hash, role) VALUES ($1, $2, $3)',
    [email, passwordHash, 'admin']
  );

  console.log(`Default admin created: ${email} / ${password}`);
  console.log('Change this password after first login. Set AUTO_CREATE_ADMIN=false in production.');
}

module.exports = { ensureDefaultAdmin };
