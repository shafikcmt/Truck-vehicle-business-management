const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');

const getDashboardSummary = async (req, res) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [vehiclesResult, activeTripsResult, todayIncomeResult, todayExpensesResult, dueSqlResult, monthlyIncomeResult, monthlyExpensesResult, recentTransactionsResult, alertsResult, monthlyTrendResult] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM vehicles'),
      pool.query("SELECT COUNT(*) FROM trips WHERE status IN ('Running', 'Pending')"),
      pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE date = $1', [today]),
      pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE date = $1', [today]),
      pool.query(`
        SELECT COALESCE(SUM(GREATEST(t.fare_amount - t.advance_payment - COALESCE(p.total_payments, 0), 0)), 0) as total_due
        FROM trips t
        LEFT JOIN (SELECT trip_id, SUM(amount) as total_payments FROM payments GROUP BY trip_id) p ON t.id = p.trip_id
      `),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM income WHERE TO_CHAR(date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')"),
      pool.query("SELECT COALESCE(SUM(amount), 0) as total FROM expenses WHERE TO_CHAR(date, 'YYYY-MM') = TO_CHAR(CURRENT_DATE, 'YYYY-MM')"),
      pool.query(`
        SELECT 'Income' as type, amount, description, date FROM income
        UNION ALL
        SELECT 'Expense' as type, amount, description, date FROM expenses
        ORDER BY date DESC LIMIT 10
      `),
      pool.query(`
        SELECT registration_number, 'Fitness' AS document_type, fitness_expiry_date AS expiry_date FROM vehicles WHERE fitness_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 day'
        UNION ALL
        SELECT registration_number, 'Tax' AS document_type, tax_expiry_date AS expiry_date FROM vehicles WHERE tax_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 day'
        UNION ALL
        SELECT registration_number, 'Insurance' AS document_type, insurance_expiry_date AS expiry_date FROM vehicles WHERE insurance_expiry_date BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '30 day'
        ORDER BY expiry_date ASC LIMIT 10
      `),
      pool.query(`
        WITH months AS (
          SELECT TO_CHAR(date_trunc('month', CURRENT_DATE) - (interval '1 month' * generate_series(0,5)), 'YYYY-MM') AS month
        ), ledger AS (
          SELECT TO_CHAR(date, 'YYYY-MM') AS month, amount, 'Income' AS type FROM income WHERE date >= CURRENT_DATE - INTERVAL '6 month'
          UNION ALL
          SELECT TO_CHAR(date, 'YYYY-MM') AS month, amount, 'Expense' AS type FROM expenses WHERE date >= CURRENT_DATE - INTERVAL '6 month'
        )
        SELECT m.month,
          COALESCE(SUM(CASE WHEN l.type='Income' THEN l.amount ELSE 0 END),0) AS income,
          COALESCE(SUM(CASE WHEN l.type='Expense' THEN l.amount ELSE 0 END),0) AS expense
        FROM months m LEFT JOIN ledger l ON l.month = m.month
        GROUP BY m.month ORDER BY m.month
      `),
    ]);

    const monthlyIncome = parseFloat(monthlyIncomeResult.rows[0].total) || 0;
    const monthlyExpenses = parseFloat(monthlyExpensesResult.rows[0].total) || 0;

    sendSuccess(res, {
      totalVehicles: parseInt(vehiclesResult.rows[0].count, 10),
      activeTrips: parseInt(activeTripsResult.rows[0].count, 10),
      todayIncome: parseFloat(todayIncomeResult.rows[0].total) || 0,
      todayExpenses: parseFloat(todayExpensesResult.rows[0].total) || 0,
      totalDue: parseFloat(dueSqlResult.rows[0].total_due) || 0,
      monthlyProfitLoss: monthlyIncome - monthlyExpenses,
      recentTransactions: recentTransactionsResult.rows,
      documentAlerts: alertsResult.rows,
      monthlyTrend: monthlyTrendResult.rows,
    }, 'Dashboard summary fetched successfully');
  } catch (error) {
    console.error('Get dashboard summary error:', error);
    sendError(res, 'Failed to fetch dashboard summary', 500);
  }
};

module.exports = { getDashboardSummary };
