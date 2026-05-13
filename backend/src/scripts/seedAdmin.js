require('dotenv').config();
const pool = require('../config/database');
const { ensureDefaultAdmin } = require('../utils/seedAdmin');

ensureDefaultAdmin()
  .then(() => {
    console.log('Admin seed completed.');
    return pool.end();
  })
  .catch((error) => {
    console.error('Admin seed failed:', error.message);
    console.error('Make sure PostgreSQL is running and both migrations have been applied.');
    process.exit(1);
  });
