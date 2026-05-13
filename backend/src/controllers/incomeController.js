const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getIncome = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { startDate, endDate, incomeType, search } = req.query;
    let query = 'SELECT i.*, t.customer_name FROM income i LEFT JOIN trips t ON i.trip_id = t.id';
    let countQuery = 'SELECT COUNT(*) FROM income i LEFT JOIN trips t ON i.trip_id = t.id';
    let sumQuery = 'SELECT COALESCE(SUM(i.amount), 0) AS total FROM income i LEFT JOIN trips t ON i.trip_id = t.id';
    const params = [];
    const conditions = [];

    if (incomeType) { conditions.push('i.income_type = $' + (params.length + 1)); params.push(incomeType); }
    if (startDate && endDate) { conditions.push('i.date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2)); params.push(startDate, endDate); }
    if (search) { conditions.push('(i.description ILIKE $' + (params.length + 1) + ' OR t.customer_name ILIKE $' + (params.length + 1) + ')'); params.push('%' + search + '%'); }
    if (conditions.length) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where; countQuery += where; sumQuery += where;
    }

    query += ' ORDER BY i.date DESC, i.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    const [incomeResult, countResult, sumResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
      pool.query(sumQuery, params),
    ]);

    sendSuccess(res, {
      income: incomeResult.rows,
      totalAmount: parseFloat(sumResult.rows[0].total) || 0,
      pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)),
    }, 'Income fetched successfully');
  } catch (error) {
    console.error('Get income error:', error);
    sendError(res, 'Failed to fetch income', 500);
  }
};

const getIncomeByTrip = async (req, res) => {
  try {
    const { tripId } = req.params;
    const result = await pool.query('SELECT * FROM income WHERE trip_id = $1 ORDER BY date DESC', [tripId]);
    sendSuccess(res, result.rows, 'Trip income fetched successfully');
  } catch (error) {
    console.error('Get trip income error:', error);
    sendError(res, 'Failed to fetch trip income', 500);
  }
};

const createIncome = async (req, res) => {
  try {
    const { tripId, amount, incomeType, description, date } = req.body;
    if (!amount || !incomeType || !date) return sendError(res, 'Amount, income type and date are required', 400);
    if (tripId) {
      const tripResult = await pool.query('SELECT id FROM trips WHERE id = $1', [tripId]);
      if (!tripResult.rows.length) return sendError(res, 'Trip not found', 404);
    }
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO income (id, trip_id, amount, income_type, description, date) VALUES ($1, $2, $3, $4, $5, $6) RETURNING *',
      [id, tripId || null, amount, incomeType, description || null, date]
    );
    sendSuccess(res, result.rows[0], 'Income created successfully', 201);
  } catch (error) {
    console.error('Create income error:', error);
    sendError(res, 'Failed to create income', 500);
  }
};

const updateIncome = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM income WHERE id = $1', [id]);
    if (!current.rows.length) return sendError(res, 'Income not found', 404);
    const income = current.rows[0];
    const { tripId, amount, incomeType, description, date } = req.body;
    const result = await pool.query(
      'UPDATE income SET trip_id=$1, amount=$2, income_type=$3, description=$4, date=$5 WHERE id=$6 RETURNING *',
      [tripId ?? income.trip_id, amount ?? income.amount, incomeType || income.income_type, description ?? income.description, date || income.date, id]
    );
    sendSuccess(res, result.rows[0], 'Income updated successfully');
  } catch (error) {
    console.error('Update income error:', error);
    sendError(res, 'Failed to update income', 500);
  }
};

const deleteIncome = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM income WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return sendError(res, 'Income not found', 404);
    sendSuccess(res, {}, 'Income deleted successfully');
  } catch (error) {
    console.error('Delete income error:', error);
    sendError(res, 'Failed to delete income', 500);
  }
};

const getIncomeByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) return sendError(res, 'Start date and end date are required', 400);
    const result = await pool.query(
      'SELECT i.*, t.customer_name FROM income i LEFT JOIN trips t ON i.trip_id = t.id WHERE i.date BETWEEN $1 AND $2 ORDER BY i.date DESC',
      [startDate, endDate]
    );
    const total = result.rows.reduce((sum, income) => sum + parseFloat(income.amount), 0);
    sendSuccess(res, { income: result.rows, totalAmount: total }, 'Income fetched successfully');
  } catch (error) {
    console.error('Get income by date range error:', error);
    sendError(res, 'Failed to fetch income', 500);
  }
};

module.exports = { getIncome, getIncomeByTrip, createIncome, updateIncome, deleteIncome, getIncomeByDateRange };
