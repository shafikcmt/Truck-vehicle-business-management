const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { sendCsv, htmlPage, taka, formatDate } = require('../utils/exporters');

const resolveRange = (query) => {
  const endDate = query.endDate || new Date().toISOString().split('T')[0];
  const startDate = query.startDate || new Date(new Date(endDate).getFullYear(), new Date(endDate).getMonth(), 1).toISOString().split('T')[0];
  return { startDate, endDate };
};

const respondReport = (req, res, payload, filename, columns) => {
  const format = (req.query.format || 'json').toLowerCase();
  if (format === 'csv' || format === 'excel') {
    return sendCsv(res, `${filename}.csv`, payload.rows || [], columns);
  }
  if (format === 'print' || format === 'pdf') {
    const tableRows = (payload.rows || []).map((row) => `<tr>${columns.map((col) => `<td>${row[col.key] ?? ''}</td>`).join('')}</tr>`).join('');
    const tableHead = `<tr>${columns.map((col) => `<th>${col.label || col.key}</th>`).join('')}</tr>`;
    return res.send(htmlPage({
      title: payload.title || filename,
      body: `<div class="header"><div><h1>${payload.title || filename}</h1><div class="muted">${payload.startDate || ''} to ${payload.endDate || ''}</div></div><span class="badge">Printable Report</span></div><table><thead>${tableHead}</thead><tbody>${tableRows}</tbody></table>`,
    }));
  }
  return sendSuccess(res, payload, 'Report generated successfully');
};

const getSummaryReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const groupBy = req.query.groupBy || 'day';
    const dateExpr = groupBy === 'year' ? "TO_CHAR(date_value, 'YYYY')" : groupBy === 'month' ? "TO_CHAR(date_value, 'YYYY-MM')" : "TO_CHAR(date_value, 'YYYY-MM-DD')";

    const result = await pool.query(`
      WITH ledger AS (
        SELECT date AS date_value, amount, 'Income' AS type FROM income WHERE date BETWEEN $1 AND $2
        UNION ALL
        SELECT date AS date_value, amount * -1 AS amount, 'Expense' AS type FROM expenses WHERE date BETWEEN $1 AND $2
      )
      SELECT ${dateExpr} AS period,
        COALESCE(SUM(CASE WHEN type='Income' THEN amount ELSE 0 END), 0) AS income,
        COALESCE(SUM(CASE WHEN type='Expense' THEN ABS(amount) ELSE 0 END), 0) AS expense,
        COALESCE(SUM(amount), 0) AS profit_loss
      FROM ledger
      GROUP BY period
      ORDER BY period
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Income Expense Summary', startDate, endDate, rows: result.rows }, 'summary-report', [
      { key: 'period', label: 'Period' },
      { key: 'income', label: 'Income' },
      { key: 'expense', label: 'Expense' },
      { key: 'profit_loss', label: 'Profit/Loss' },
    ]);
  } catch (error) {
    console.error('Summary report error:', error);
    sendError(res, 'Failed to generate summary report', 500);
  }
};

const getProfitLossReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const [incomeResult, expenseResult, tripResult] = await Promise.all([
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM income WHERE date BETWEEN $1 AND $2', [startDate, endDate]),
      pool.query('SELECT COALESCE(SUM(amount),0) AS total FROM expenses WHERE date BETWEEN $1 AND $2', [startDate, endDate]),
      pool.query(`
        SELECT t.id, t.customer_name, t.trip_date, v.registration_number, d.name AS driver_name,
          t.fare_amount,
          t.advance_payment,
          COALESCE(SUM(DISTINCT p.amount),0) AS payments,
          COALESCE(SUM(e.amount),0) AS expenses,
          (t.fare_amount - COALESCE(SUM(e.amount),0)) AS profit_loss
        FROM trips t
        JOIN vehicles v ON v.id = t.vehicle_id
        JOIN drivers d ON d.id = t.driver_id
        LEFT JOIN payments p ON p.trip_id = t.id
        LEFT JOIN expenses e ON e.trip_id = t.id
        WHERE t.trip_date BETWEEN $1 AND $2
        GROUP BY t.id, v.registration_number, d.name
        ORDER BY t.trip_date DESC
      `, [startDate, endDate]),
    ]);

    const totalIncome = parseFloat(incomeResult.rows[0].total) || 0;
    const totalExpense = parseFloat(expenseResult.rows[0].total) || 0;
    const rows = tripResult.rows;
    respondReport(req, res, {
      title: 'Profit Loss Report', startDate, endDate,
      totalIncome, totalExpense, netProfitLoss: totalIncome - totalExpense,
      rows,
    }, 'profit-loss-report', [
      { key: 'trip_date', label: 'Trip Date' },
      { key: 'registration_number', label: 'Vehicle' },
      { key: 'driver_name', label: 'Driver' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'fare_amount', label: 'Fare' },
      { key: 'expenses', label: 'Expenses' },
      { key: 'profit_loss', label: 'Profit/Loss' },
    ]);
  } catch (error) {
    console.error('Profit loss report error:', error);
    sendError(res, 'Failed to generate profit/loss report', 500);
  }
};

const getVehicleReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const result = await pool.query(`
      SELECT v.registration_number, v.vehicle_type, COALESCE(o.name, v.owner_name) AS owner_name,
        COUNT(DISTINCT t.id) AS total_trips,
        COALESCE(SUM(t.fare_amount),0) AS total_fare,
        COALESCE(SUM(e.amount),0) AS total_expense,
        COALESCE(SUM(t.fare_amount),0) - COALESCE(SUM(e.amount),0) AS profit_loss
      FROM vehicles v
      LEFT JOIN owners o ON o.id = v.owner_id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.trip_date BETWEEN $1 AND $2
      LEFT JOIN expenses e ON e.vehicle_id = v.id AND e.date BETWEEN $1 AND $2
      GROUP BY v.id, o.name
      ORDER BY v.registration_number
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Vehicle Wise Report', startDate, endDate, rows: result.rows }, 'vehicle-report', [
      { key: 'registration_number', label: 'Vehicle Number' },
      { key: 'vehicle_type', label: 'Type' },
      { key: 'owner_name', label: 'Owner' },
      { key: 'total_trips', label: 'Trips' },
      { key: 'total_fare', label: 'Income' },
      { key: 'total_expense', label: 'Expense' },
      { key: 'profit_loss', label: 'Profit/Loss' },
    ]);
  } catch (error) {
    console.error('Vehicle report error:', error);
    sendError(res, 'Failed to generate vehicle report', 500);
  }
};

const getDriverReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const result = await pool.query(`
      SELECT d.name AS driver_name, d.phone_number, d.license_number,
        COUNT(t.id) AS total_trips,
        COALESCE(SUM(t.fare_amount),0) AS total_fare,
        COALESCE(SUM(e.amount),0) AS trip_expense
      FROM drivers d
      LEFT JOIN trips t ON t.driver_id = d.id AND t.trip_date BETWEEN $1 AND $2
      LEFT JOIN expenses e ON e.trip_id = t.id AND e.date BETWEEN $1 AND $2
      GROUP BY d.id
      ORDER BY d.name
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Driver Wise Report', startDate, endDate, rows: result.rows }, 'driver-report', [
      { key: 'driver_name', label: 'Driver' },
      { key: 'phone_number', label: 'Phone' },
      { key: 'license_number', label: 'License' },
      { key: 'total_trips', label: 'Trips' },
      { key: 'total_fare', label: 'Trip Fare' },
      { key: 'trip_expense', label: 'Trip Expense' },
    ]);
  } catch (error) {
    console.error('Driver report error:', error);
    sendError(res, 'Failed to generate driver report', 500);
  }
};

const getCustomerReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const result = await pool.query(`
      SELECT t.customer_name,
        COUNT(t.id) AS total_trips,
        COALESCE(SUM(t.fare_amount),0) AS total_fare,
        COALESCE(SUM(t.advance_payment),0) AS advance_payment,
        COALESCE(SUM(p.amount),0) AS paid_amount,
        COALESCE(SUM(t.fare_amount - t.advance_payment),0) - COALESCE(SUM(p.amount),0) AS due_amount
      FROM trips t
      LEFT JOIN payments p ON p.trip_id = t.id
      WHERE t.trip_date BETWEEN $1 AND $2
      GROUP BY t.customer_name
      ORDER BY total_fare DESC
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Customer Wise Report', startDate, endDate, rows: result.rows }, 'customer-report', [
      { key: 'customer_name', label: 'Customer' },
      { key: 'total_trips', label: 'Trips' },
      { key: 'total_fare', label: 'Fare' },
      { key: 'advance_payment', label: 'Advance' },
      { key: 'paid_amount', label: 'Paid' },
      { key: 'due_amount', label: 'Due' },
    ]);
  } catch (error) {
    console.error('Customer report error:', error);
    sendError(res, 'Failed to generate customer report', 500);
  }
};

const getDueReport = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT t.customer_name, t.trip_date, v.registration_number, t.fare_amount, t.advance_payment,
        COALESCE(SUM(p.amount),0) AS paid_amount,
        t.fare_amount - t.advance_payment - COALESCE(SUM(p.amount),0) AS due_amount
      FROM trips t
      JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN payments p ON p.trip_id = t.id
      GROUP BY t.id, v.registration_number
      HAVING t.fare_amount - t.advance_payment - COALESCE(SUM(p.amount),0) > 0
      ORDER BY t.trip_date DESC
    `);

    respondReport(req, res, { title: 'Due Report', rows: result.rows }, 'due-report', [
      { key: 'trip_date', label: 'Trip Date' },
      { key: 'registration_number', label: 'Vehicle' },
      { key: 'customer_name', label: 'Customer' },
      { key: 'fare_amount', label: 'Fare' },
      { key: 'advance_payment', label: 'Advance' },
      { key: 'paid_amount', label: 'Paid' },
      { key: 'due_amount', label: 'Due' },
    ]);
  } catch (error) {
    console.error('Due report error:', error);
    sendError(res, 'Failed to generate due report', 500);
  }
};

const getExpenseReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const result = await pool.query(`
      SELECT expense_type, COUNT(*) AS total_entries, COALESCE(SUM(amount),0) AS total_amount
      FROM expenses
      WHERE date BETWEEN $1 AND $2
      GROUP BY expense_type
      ORDER BY total_amount DESC
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Expense Report', startDate, endDate, rows: result.rows }, 'expense-report', [
      { key: 'expense_type', label: 'Expense Type' },
      { key: 'total_entries', label: 'Entries' },
      { key: 'total_amount', label: 'Amount' },
    ]);
  } catch (error) {
    console.error('Expense report error:', error);
    sendError(res, 'Failed to generate expense report', 500);
  }
};

const getOwnerReport = async (req, res) => {
  try {
    const { startDate, endDate } = resolveRange(req.query);
    const result = await pool.query(`
      SELECT o.name AS owner_name, COUNT(DISTINCT v.id) AS vehicles,
        COUNT(DISTINCT t.id) AS trips,
        COALESCE(SUM(t.fare_amount),0) AS gross_income,
        COALESCE(SUM(e.amount),0) AS expense,
        COALESCE(SUM(op.amount),0) AS owner_paid,
        COALESCE(SUM(t.fare_amount),0) - COALESCE(SUM(e.amount),0) - COALESCE(SUM(op.amount),0) AS owner_due
      FROM owners o
      LEFT JOIN vehicles v ON v.owner_id = o.id
      LEFT JOIN trips t ON t.vehicle_id = v.id AND t.trip_date BETWEEN $1 AND $2
      LEFT JOIN expenses e ON e.vehicle_id = v.id AND e.date BETWEEN $1 AND $2
      LEFT JOIN owner_payments op ON op.owner_id = o.id AND op.payment_date BETWEEN $1 AND $2
      GROUP BY o.id
      ORDER BY o.name
    `, [startDate, endDate]);

    respondReport(req, res, { title: 'Owner Partner Report', startDate, endDate, rows: result.rows }, 'owner-report', [
      { key: 'owner_name', label: 'Owner' },
      { key: 'vehicles', label: 'Vehicles' },
      { key: 'trips', label: 'Trips' },
      { key: 'gross_income', label: 'Gross Income' },
      { key: 'expense', label: 'Expense' },
      { key: 'owner_paid', label: 'Owner Paid' },
      { key: 'owner_due', label: 'Owner Due' },
    ]);
  } catch (error) {
    console.error('Owner report error:', error);
    sendError(res, 'Failed to generate owner report', 500);
  }
};

module.exports = {
  getSummaryReport,
  getProfitLossReport,
  getVehicleReport,
  getDriverReport,
  getCustomerReport,
  getDueReport,
  getExpenseReport,
  getOwnerReport,
};
