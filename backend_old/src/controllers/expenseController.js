const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getExpenses = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { expenseType, startDate, endDate, vehicleId, tripId, search } = req.query;
    let query = 'SELECT e.*, t.customer_name, v.registration_number FROM expenses e LEFT JOIN trips t ON e.trip_id = t.id LEFT JOIN vehicles v ON e.vehicle_id = v.id';
    let countQuery = 'SELECT COUNT(*) FROM expenses e LEFT JOIN trips t ON e.trip_id = t.id LEFT JOIN vehicles v ON e.vehicle_id = v.id';
    let sumQuery = 'SELECT COALESCE(SUM(e.amount), 0) AS total FROM expenses e LEFT JOIN trips t ON e.trip_id = t.id LEFT JOIN vehicles v ON e.vehicle_id = v.id';
    const params = [];
    const conditions = [];

    if (expenseType) { conditions.push('e.expense_type = $' + (params.length + 1)); params.push(expenseType); }
    if (vehicleId) { conditions.push('e.vehicle_id = $' + (params.length + 1)); params.push(vehicleId); }
    if (tripId) { conditions.push('e.trip_id = $' + (params.length + 1)); params.push(tripId); }
    if (startDate && endDate) { conditions.push('e.date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2)); params.push(startDate, endDate); }
    if (search) { conditions.push('(e.description ILIKE $' + (params.length + 1) + ' OR t.customer_name ILIKE $' + (params.length + 1) + ' OR v.registration_number ILIKE $' + (params.length + 1) + ')'); params.push('%' + search + '%'); }
    if (conditions.length) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where; countQuery += where; sumQuery += where;
    }

    query += ' ORDER BY e.date DESC, e.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    const [expensesResult, countResult, sumResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
      pool.query(sumQuery, params),
    ]);

    sendSuccess(res, {
      expenses: expensesResult.rows,
      totalAmount: parseFloat(sumResult.rows[0].total) || 0,
      pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)),
    }, 'Expenses fetched successfully');
  } catch (error) {
    console.error('Get expenses error:', error);
    sendError(res, 'Failed to fetch expenses', 500);
  }
};

const getExpensesByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await pool.query('SELECT * FROM expenses WHERE trip_id = $1 ORDER BY date DESC', [tripId]);
    const total = result.rows.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
    sendSuccess(res, { expenses: result.rows, totalAmount: total }, 'Trip expenses fetched successfully');
  } catch (error) {
    console.error('Get trip expenses error:', error);
    sendError(res, 'Failed to fetch trip expenses', 500);
  }
};

const getExpensesByVehicle = async (req, res) => {
  try {
    const { vehicleId } = req.params;
    const { page, limit, offset } = getPagination(req.query);
    const [expensesResult, countResult] = await Promise.all([
      pool.query('SELECT * FROM expenses WHERE vehicle_id = $1 ORDER BY date DESC LIMIT $2 OFFSET $3', [vehicleId, limit, offset]),
      pool.query('SELECT COUNT(*) FROM expenses WHERE vehicle_id = $1', [vehicleId]),
    ]);
    sendSuccess(res, { expenses: expensesResult.rows, pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)) }, 'Vehicle expenses fetched successfully');
  } catch (error) {
    console.error('Get vehicle expenses error:', error);
    sendError(res, 'Failed to fetch vehicle expenses', 500);
  }
};

const createExpense = async (req, res) => {
  try {
    const { tripId, vehicleId, expenseType, amount, description, date } = req.body;
    if (!expenseType || !amount || !date) return sendError(res, 'Expense type, amount and date are required', 400);
    if (tripId) {
      const tripResult = await pool.query('SELECT vehicle_id FROM trips WHERE id = $1', [tripId]);
      if (!tripResult.rows.length) return sendError(res, 'Trip not found', 404);
    }
    if (vehicleId) {
      const vehicleResult = await pool.query('SELECT id FROM vehicles WHERE id = $1', [vehicleId]);
      if (!vehicleResult.rows.length) return sendError(res, 'Vehicle not found', 404);
    }
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO expenses (id, trip_id, vehicle_id, expense_type, amount, description, date) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, tripId || null, vehicleId || null, expenseType, amount, description || null, date]
    );
    sendSuccess(res, result.rows[0], 'Expense created successfully', 201);
  } catch (error) {
    console.error('Create expense error:', error);
    sendError(res, 'Failed to create expense', 500);
  }
};

const updateExpense = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM expenses WHERE id = $1', [id]);
    if (!current.rows.length) return sendError(res, 'Expense not found', 404);
    const expense = current.rows[0];
    const { tripId, vehicleId, expenseType, amount, description, date } = req.body;
    const result = await pool.query(
      'UPDATE expenses SET trip_id=$1, vehicle_id=$2, expense_type=$3, amount=$4, description=$5, date=$6 WHERE id=$7 RETURNING *',
      [tripId ?? expense.trip_id, vehicleId ?? expense.vehicle_id, expenseType || expense.expense_type, amount ?? expense.amount, description ?? expense.description, date || expense.date, id]
    );
    sendSuccess(res, result.rows[0], 'Expense updated successfully');
  } catch (error) {
    console.error('Update expense error:', error);
    sendError(res, 'Failed to update expense', 500);
  }
};

const deleteExpense = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return sendError(res, 'Expense not found', 404);
    sendSuccess(res, {}, 'Expense deleted successfully');
  } catch (error) {
    console.error('Delete expense error:', error);
    sendError(res, 'Failed to delete expense', 500);
  }
};

module.exports = { getExpenses, getExpensesByTrip, getExpensesByVehicle, createExpense, updateExpense, deleteExpense };
