const app = require('./src/index');
const pool = require('./src/config/database');
const { ensureDefaultAdmin } = require('./src/utils/seedAdmin');
const { runMigrations } = require('./src/scripts/migrate');

const PORT = process.env.PORT || 5000;

function printDatabaseHelp(error) {
  console.error('Backend startup failed:', error.message);
  console.error('');
  console.error('Database connection help:');
  console.error('1) If you already installed PostgreSQL, open backend/.env and set DB_PASSWORD to your real postgres password.');
  console.error('2) If you want the included default password to work, run from project root: docker compose up -d postgres');
  console.error('3) After PostgreSQL is running, run: cd backend && npm run migrate && npm run seed:admin');
  console.error('');
  console.error('Current database settings used by the app:');
  console.error(`DB_HOST=${process.env.DB_HOST || ''}`);
  console.error(`DB_PORT=${process.env.DB_PORT || ''}`);
  console.error(`DB_NAME=${process.env.DB_NAME || ''}`);
  console.error(`DB_USER=${process.env.DB_USER || ''}`);
  console.error('DB_PASSWORD=********');
}

async function startServer() {
  try {
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully');

    if (process.env.RUN_MIGRATIONS_ON_START !== 'false') {
      await runMigrations();
    }

    await ensureDefaultAdmin();

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
      console.log(`Default admin: ${process.env.DEFAULT_ADMIN_EMAIL || 'admin@example.com'} / ${process.env.DEFAULT_ADMIN_PASSWORD || 'password123'}`);
    });
  } catch (error) {
    printDatabaseHelp(error);
    process.exit(1);
  }
}

startServer();
