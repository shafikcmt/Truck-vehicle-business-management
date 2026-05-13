const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');

const backupTables = ['users', 'owners', 'vehicles', 'drivers', 'trips', 'income', 'expenses', 'payments', 'owner_payments', 'branches', 'app_settings'];

const getSettings = async (req, res) => {
  try {
    const result = await pool.query('SELECT key, value FROM app_settings ORDER BY key');
    const settings = result.rows.reduce((acc, row) => ({ ...acc, [row.key]: row.value }), {});
    sendSuccess(res, settings, 'Settings fetched successfully');
  } catch (error) {
    console.error('Get settings error:', error);
    sendError(res, 'Failed to fetch settings', 500);
  }
};

const updateSettings = async (req, res) => {
  try {
    const entries = Object.entries(req.body || {});
    for (const [key, value] of entries) {
      await pool.query(
        `INSERT INTO app_settings (key, value, updated_at) VALUES ($1, $2, CURRENT_TIMESTAMP)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = CURRENT_TIMESTAMP`,
        [key, String(value)]
      );
    }
    sendSuccess(res, {}, 'Settings updated successfully');
  } catch (error) {
    console.error('Update settings error:', error);
    sendError(res, 'Failed to update settings', 500);
  }
};

const createBackup = async (req, res) => {
  try {
    const backup = { generatedAt: new Date().toISOString(), version: '1.0', tables: {} };
    for (const table of backupTables) {
      try {
        const result = await pool.query(`SELECT * FROM ${table}`);
        backup.tables[table] = result.rows;
      } catch (tableError) {
        backup.tables[table] = { error: tableError.message };
      }
    }
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="truck-business-backup-${new Date().toISOString().split('T')[0]}.json"`);
    res.status(200).send(JSON.stringify(backup, null, 2));
  } catch (error) {
    console.error('Backup error:', error);
    sendError(res, 'Failed to create backup', 500);
  }
};

module.exports = { getSettings, updateSettings, createBackup };
