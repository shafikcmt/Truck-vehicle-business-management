const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getPayments = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { startDate, endDate, paymentMethod, search } = req.query;
    let query = 'SELECT p.*, t.customer_name, t.fare_amount, v.registration_number FROM payments p JOIN trips t ON p.trip_id = t.id JOIN vehicles v ON v.id = t.vehicle_id';
    let countQuery = 'SELECT COUNT(*) FROM payments p JOIN trips t ON p.trip_id = t.id JOIN vehicles v ON v.id = t.vehicle_id';
    let sumQuery = 'SELECT COALESCE(SUM(p.amount), 0) AS total FROM payments p JOIN trips t ON p.trip_id = t.id JOIN vehicles v ON v.id = t.vehicle_id';
    const params = [];
    const conditions = [];
    if (paymentMethod) { conditions.push('p.payment_method = $' + (params.length + 1)); params.push(paymentMethod); }
    if (startDate && endDate) { conditions.push('p.date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2)); params.push(startDate, endDate); }
    if (search) { conditions.push('(t.customer_name ILIKE $' + (params.length + 1) + ' OR v.registration_number ILIKE $' + (params.length + 1) + ' OR p.reference_no ILIKE $' + (params.length + 1) + ')'); params.push('%' + search + '%'); }
    if (conditions.length) {
      const where = ' WHERE ' + conditions.join(' AND ');
      query += where; countQuery += where; sumQuery += where;
    }
    query += ' ORDER BY p.date DESC, p.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    const [paymentsResult, countResult, sumResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
      pool.query(sumQuery, params),
    ]);
    sendSuccess(res, {
      payments: paymentsResult.rows,
      totalAmount: parseFloat(sumResult.rows[0].total) || 0,
      pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)),
    }, 'Payments fetched successfully');
  } catch (error) {
    console.error('Get payments error:', error);
    sendError(res, 'Failed to fetch payments', 500);
  }
};

const getDues = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, search } = req.query;
    const params = [];
    const searchClause = search ? 'WHERE t.customer_name ILIKE $1 OR v.registration_number ILIKE $1' : '';
    if (search) params.push('%' + search + '%');

    let baseQuery = `
      SELECT t.id as trip_id, t.customer_name, t.trip_date, v.registration_number,
        t.fare_amount, t.advance_payment, COALESCE(SUM(p.amount), 0) as total_payments,
        GREATEST(t.fare_amount - t.advance_payment - COALESCE(SUM(p.amount), 0), 0) as due_amount,
        CASE
          WHEN GREATEST(t.fare_amount - t.advance_payment - COALESCE(SUM(p.amount), 0), 0) = 0 THEN 'Paid'
          WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'Partial'
          ELSE 'Pending'
        END as status
      FROM trips t
      JOIN vehicles v ON v.id = t.vehicle_id
      LEFT JOIN payments p ON t.id = p.trip_id
      ${searchClause}
      GROUP BY t.id, v.registration_number
    `;
    if (status) {
      baseQuery += ` HAVING CASE
        WHEN GREATEST(t.fare_amount - t.advance_payment - COALESCE(SUM(p.amount), 0), 0) = 0 THEN 'Paid'
        WHEN COALESCE(SUM(p.amount), 0) > 0 THEN 'Partial'
        ELSE 'Pending'
      END = $${params.length + 1}`;
      params.push(status);
    }
    const rowsQuery = baseQuery + ` ORDER BY t.trip_date DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    const countQuery = `SELECT COUNT(*) FROM (${baseQuery}) x`;
    const [duesResult, countResult] = await Promise.all([
      pool.query(rowsQuery, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);
    const totalDue = duesResult.rows.reduce((sum, due) => sum + parseFloat(due.due_amount || 0), 0);
    sendSuccess(res, { dues: duesResult.rows, totalDue, pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)) }, 'Dues fetched successfully');
  } catch (error) {
    console.error('Get dues error:', error);
    sendError(res, 'Failed to fetch dues', 500);
  }
};

const createPayment = async (req, res) => {
  try {
    const { tripId, amount, paymentMethod, date, referenceNo, note } = req.body;
    if (!tripId || !amount || !date) return sendError(res, 'Trip ID, amount and date are required', 400);
    const tripResult = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (!tripResult.rows.length) return sendError(res, 'Trip not found', 404);
    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO payments (id, trip_id, amount, payment_method, date, reference_no, note) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *',
      [id, tripId, amount, paymentMethod || 'Cash', date, referenceNo || null, note || null]
    );
    sendSuccess(res, result.rows[0], 'Payment created successfully', 201);
  } catch (error) {
    console.error('Create payment error:', error);
    sendError(res, 'Failed to create payment', 500);
  }
};

const updatePayment = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM payments WHERE id = $1', [id]);
    if (!current.rows.length) return sendError(res, 'Payment not found', 404);
    const payment = current.rows[0];
    const { tripId, amount, paymentMethod, date, referenceNo, note } = req.body;
    const result = await pool.query(
      'UPDATE payments SET trip_id=$1, amount=$2, payment_method=$3, date=$4, reference_no=$5, note=$6 WHERE id=$7 RETURNING *',
      [tripId || payment.trip_id, amount ?? payment.amount, paymentMethod || payment.payment_method, date || payment.date, referenceNo ?? payment.reference_no, note ?? payment.note, id]
    );
    sendSuccess(res, result.rows[0], 'Payment updated successfully');
  } catch (error) {
    console.error('Update payment error:', error);
    sendError(res, 'Failed to update payment', 500);
  }
};

const deletePayment = async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM payments WHERE id = $1 RETURNING id', [req.params.id]);
    if (!result.rows.length) return sendError(res, 'Payment not found', 404);
    sendSuccess(res, {}, 'Payment deleted successfully');
  } catch (error) {
    console.error('Delete payment error:', error);
    sendError(res, 'Failed to delete payment', 500);
  }
};

const getTripDue = async (req, res) => {
  try {
    const { tripId } = req.params;
    const tripResult = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (!tripResult.rows.length) return sendError(res, 'Trip not found', 404);
    const trip = tripResult.rows[0];
    const paymentsResult = await pool.query('SELECT COALESCE(SUM(amount), 0) as total FROM payments WHERE trip_id = $1', [tripId]);
    const totalPayments = parseFloat(paymentsResult.rows[0].total) || 0;
    const dueAmount = parseFloat(trip.fare_amount || 0) - parseFloat(trip.advance_payment || 0) - totalPayments;
    sendSuccess(res, {
      tripId,
      fareAmount: trip.fare_amount,
      advancePayment: trip.advance_payment,
      totalPayments,
      dueAmount: Math.max(0, dueAmount),
      status: dueAmount <= 0 ? 'Paid' : totalPayments > 0 ? 'Partial' : 'Pending',
    }, 'Due amount fetched successfully');
  } catch (error) {
    console.error('Get trip due error:', error);
    sendError(res, 'Failed to fetch due amount', 500);
  }
};

module.exports = { getPayments, getDues, createPayment, updatePayment, deletePayment, getTripDue };
