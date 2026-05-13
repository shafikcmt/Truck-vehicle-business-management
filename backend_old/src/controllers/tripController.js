const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getTrips = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const { status, startDate, endDate, search, vehicleId, driverId, paymentStatus } = req.query;

    let query = `
      SELECT t.*, v.registration_number, v.vehicle_type, d.name as driver_name,
        COALESCE(pay.total_payments, 0) as total_payments,
        GREATEST(t.fare_amount - t.advance_payment - COALESCE(pay.total_payments,0), 0) as due_amount
      FROM trips t
      JOIN vehicles v ON t.vehicle_id = v.id
      JOIN drivers d ON t.driver_id = d.id
      LEFT JOIN (SELECT trip_id, SUM(amount) AS total_payments FROM payments GROUP BY trip_id) pay ON pay.trip_id = t.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id';
    const params = [];
    const conditions = [];

    if (status) { conditions.push('t.status = $' + (params.length + 1)); params.push(status); }
    if (vehicleId) { conditions.push('t.vehicle_id = $' + (params.length + 1)); params.push(vehicleId); }
    if (driverId) { conditions.push('t.driver_id = $' + (params.length + 1)); params.push(driverId); }
    if (startDate && endDate) { conditions.push('t.trip_date BETWEEN $' + (params.length + 1) + ' AND $' + (params.length + 2)); params.push(startDate, endDate); }
    if (search) {
      conditions.push('(t.customer_name ILIKE $' + (params.length + 1) + ' OR v.registration_number ILIKE $' + (params.length + 1) + ' OR d.name ILIKE $' + (params.length + 1) + ' OR t.loading_point ILIKE $' + (params.length + 1) + ' OR t.unloading_point ILIKE $' + (params.length + 1) + ')');
      params.push('%' + search + '%');
    }

    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    if (paymentStatus) {
      const paymentCondition = paymentStatus === 'Paid'
        ? 'GREATEST(t.fare_amount - t.advance_payment - COALESCE(pay.total_payments,0), 0) = 0'
        : paymentStatus === 'Partial'
          ? 'COALESCE(pay.total_payments,0) > 0 AND GREATEST(t.fare_amount - t.advance_payment - COALESCE(pay.total_payments,0), 0) > 0'
          : 'COALESCE(pay.total_payments,0) = 0 AND GREATEST(t.fare_amount - t.advance_payment, 0) > 0';
      query += (conditions.length ? ' AND ' : ' WHERE ') + paymentCondition;
    }

    query += ' ORDER BY t.trip_date DESC, t.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [tripsResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    sendSuccess(res, {
      trips: tripsResult.rows,
      pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)),
    }, 'Trips fetched successfully');
  } catch (error) {
    console.error('Get trips error:', error);
    sendError(res, 'Failed to fetch trips', 500);
  }
};

const getTripById = async (req, res) => {
  try {
    const { id } = req.params;
    const tripResult = await pool.query(
      `SELECT t.*, v.registration_number, v.vehicle_type, d.name as driver_name, d.phone_number
       FROM trips t JOIN vehicles v ON t.vehicle_id = v.id JOIN drivers d ON t.driver_id = d.id WHERE t.id = $1`,
      [id]
    );

    if (!tripResult.rows.length) return sendError(res, 'Trip not found', 404);
    const trip = tripResult.rows[0];

    const [expensesResult, paymentsResult, incomeResult] = await Promise.all([
      pool.query('SELECT * FROM expenses WHERE trip_id = $1 ORDER BY date DESC', [id]),
      pool.query('SELECT * FROM payments WHERE trip_id = $1 ORDER BY date DESC', [id]),
      pool.query('SELECT * FROM income WHERE trip_id = $1 ORDER BY date DESC', [id]),
    ]);

    trip.expenses = expensesResult.rows;
    trip.payments = paymentsResult.rows;
    trip.income = incomeResult.rows;
    trip.totalExpenses = expensesResult.rows.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    trip.totalPaymentsReceived = paymentsResult.rows.reduce((sum, pay) => sum + parseFloat(pay.amount || 0), 0);
    trip.totalIncome = incomeResult.rows.reduce((sum, inc) => sum + parseFloat(inc.amount || 0), 0);
    trip.dueAmount = Math.max(0, parseFloat(trip.fare_amount || 0) - parseFloat(trip.advance_payment || 0) - trip.totalPaymentsReceived);
    trip.profitLoss = parseFloat(trip.fare_amount || 0) - trip.totalExpenses;

    sendSuccess(res, trip, 'Trip fetched successfully');
  } catch (error) {
    console.error('Get trip error:', error);
    sendError(res, 'Failed to fetch trip', 500);
  }
};

const createTrip = async (req, res) => {
  const client = await pool.connect();
  try {
    const { vehicleId, driverId, customerName, customerPhone, loadingPoint, unloadingPoint, goodsDescription, branchName, tripDate, fareAmount, advancePayment, status } = req.body;
    if (!vehicleId || !driverId || !customerName || !tripDate || !fareAmount) return sendError(res, 'Required fields missing', 400);

    await client.query('BEGIN');
    const vehicleResult = await client.query('SELECT * FROM vehicles WHERE id = $1', [vehicleId]);
    if (!vehicleResult.rows.length) { await client.query('ROLLBACK'); return sendError(res, 'Vehicle not found', 404); }
    const driverResult = await client.query('SELECT * FROM drivers WHERE id = $1', [driverId]);
    if (!driverResult.rows.length) { await client.query('ROLLBACK'); return sendError(res, 'Driver not found', 404); }

    const id = uuidv4();
    const result = await client.query(
      `INSERT INTO trips (id, vehicle_id, driver_id, customer_name, customer_phone, loading_point, unloading_point, goods_description, branch_name, trip_date, fare_amount, advance_payment, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,
      [id, vehicleId, driverId, customerName, customerPhone || null, loadingPoint || null, unloadingPoint || null, goodsDescription || null, branchName || null, tripDate, fareAmount, advancePayment || 0, status || 'Pending']
    );

    if (['Pending', 'Running'].includes(status || 'Pending')) {
      await client.query("UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2", [status === 'Running' ? 'On Trip' : 'Available', vehicleId]);
    }

    await client.query('COMMIT');
    sendSuccess(res, result.rows[0], 'Trip created successfully', 201);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Create trip error:', error);
    sendError(res, 'Failed to create trip', 500);
  } finally {
    client.release();
  }
};

const updateTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const { vehicleId, driverId, customerName, customerPhone, loadingPoint, unloadingPoint, goodsDescription, branchName, tripDate, fareAmount, advancePayment, status } = req.body;
    const result = await pool.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (!result.rows.length) return sendError(res, 'Trip not found', 404);

    const trip = result.rows[0];
    const updateResult = await pool.query(
      `UPDATE trips SET vehicle_id=$1, driver_id=$2, customer_name=$3, customer_phone=$4, loading_point=$5, unloading_point=$6,
       goods_description=$7, branch_name=$8, trip_date=$9, fare_amount=$10, advance_payment=$11, status=$12, updated_at=CURRENT_TIMESTAMP WHERE id=$13 RETURNING *`,
      [vehicleId || trip.vehicle_id, driverId || trip.driver_id, customerName || trip.customer_name, customerPhone ?? trip.customer_phone,
        loadingPoint ?? trip.loading_point, unloadingPoint ?? trip.unloading_point, goodsDescription ?? trip.goods_description, branchName ?? trip.branch_name,
        tripDate || trip.trip_date, fareAmount || trip.fare_amount, advancePayment !== undefined ? advancePayment : trip.advance_payment, status || trip.status, id]
    );
    sendSuccess(res, updateResult.rows[0], 'Trip updated successfully');
  } catch (error) {
    console.error('Update trip error:', error);
    sendError(res, 'Failed to update trip', 500);
  }
};

const updateTripStatus = async (req, res) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { status } = req.body;
    if (!status) return sendError(res, 'Status is required', 400);
    const validStatuses = ['Pending', 'Running', 'Completed', 'Cancelled'];
    if (!validStatuses.includes(status)) return sendError(res, 'Invalid status', 400);

    await client.query('BEGIN');
    const result = await client.query('SELECT * FROM trips WHERE id = $1', [id]);
    if (!result.rows.length) { await client.query('ROLLBACK'); return sendError(res, 'Trip not found', 404); }

    let updateQuery = 'UPDATE trips SET status = $1, updated_at = CURRENT_TIMESTAMP';
    if (status === 'Completed') updateQuery += ', completed_at = CURRENT_TIMESTAMP';
    updateQuery += ' WHERE id = $2 RETURNING *';
    const updateResult = await client.query(updateQuery, [status, id]);

    const vehicleStatus = status === 'Running' ? 'On Trip' : 'Available';
    await client.query('UPDATE vehicles SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [vehicleStatus, result.rows[0].vehicle_id]);
    await client.query('COMMIT');

    sendSuccess(res, updateResult.rows[0], 'Trip status updated successfully');
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Update trip status error:', error);
    sendError(res, 'Failed to update trip status', 500);
  } finally {
    client.release();
  }
};

const deleteTrip = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return sendError(res, 'Trip not found', 404);
    sendSuccess(res, {}, 'Trip deleted successfully');
  } catch (error) {
    console.error('Delete trip error:', error);
    sendError(res, 'Failed to delete trip', 500);
  }
};

module.exports = { getTrips, getTripById, createTrip, updateTrip, updateTripStatus, deleteTrip };
