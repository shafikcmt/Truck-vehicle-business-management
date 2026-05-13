const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const getOwners = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search;
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE o.name ILIKE $1 OR o.phone_number ILIKE $1';
      params.push(`%${search}%`);
    }

    const [ownersResult, countResult] = await Promise.all([
      pool.query(`
        SELECT o.*,
          COUNT(v.id) AS total_vehicles,
          COALESCE(SUM(owner_income.total_income), 0) AS total_income,
          COALESCE(SUM(owner_expense.total_expense), 0) AS total_expense,
          COALESCE(SUM(owner_paid.total_paid), 0) AS total_paid
        FROM owners o
        LEFT JOIN vehicles v ON v.owner_id = o.id
        LEFT JOIN (
          SELECT t.vehicle_id, SUM(t.fare_amount) AS total_income
          FROM trips t GROUP BY t.vehicle_id
        ) owner_income ON owner_income.vehicle_id = v.id
        LEFT JOIN (
          SELECT e.vehicle_id, SUM(e.amount) AS total_expense
          FROM expenses e GROUP BY e.vehicle_id
        ) owner_expense ON owner_expense.vehicle_id = v.id
        LEFT JOIN (
          SELECT owner_id, SUM(amount) AS total_paid
          FROM owner_payments GROUP BY owner_id
        ) owner_paid ON owner_paid.owner_id = o.id
        ${where}
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) FROM owners o ${where}`, params),
    ]);

    sendSuccess(res, {
      owners: ownersResult.rows,
      pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)),
    }, 'Owners fetched successfully');
  } catch (error) {
    console.error('Get owners error:', error);
    sendError(res, 'Failed to fetch owners', 500);
  }
};

const getOwnerById = async (req, res) => {
  try {
    const { id } = req.params;
    const ownerResult = await pool.query('SELECT * FROM owners WHERE id = $1', [id]);
    if (!ownerResult.rows.length) return sendError(res, 'Owner not found', 404);

    const [vehiclesResult, paymentsResult, summaryResult] = await Promise.all([
      pool.query('SELECT * FROM vehicles WHERE owner_id = $1 ORDER BY registration_number', [id]),
      pool.query('SELECT * FROM owner_payments WHERE owner_id = $1 ORDER BY payment_date DESC', [id]),
      pool.query(`
        SELECT
          COALESCE(SUM(t.fare_amount), 0) AS gross_income,
          COALESCE(SUM(e.amount), 0) AS expenses,
          COALESCE(SUM(op.amount), 0) AS owner_paid
        FROM owners o
        LEFT JOIN vehicles v ON v.owner_id = o.id
        LEFT JOIN trips t ON t.vehicle_id = v.id
        LEFT JOIN expenses e ON e.vehicle_id = v.id
        LEFT JOIN owner_payments op ON op.owner_id = o.id
        WHERE o.id = $1
      `, [id]),
    ]);

    sendSuccess(res, {
      ...ownerResult.rows[0],
      vehicles: vehiclesResult.rows,
      payments: paymentsResult.rows,
      summary: summaryResult.rows[0],
    }, 'Owner fetched successfully');
  } catch (error) {
    console.error('Get owner error:', error);
    sendError(res, 'Failed to fetch owner', 500);
  }
};

const createOwner = async (req, res) => {
  try {
    const { name, phoneNumber, address, commissionPercentage, profitSharePercentage, notes } = req.body;
    if (!name) return sendError(res, 'Owner name is required', 400);

    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO owners (id, name, phone_number, address, commission_percentage, profit_share_percentage, notes)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [id, name, phoneNumber || null, address || null, commissionPercentage || 0, profitSharePercentage || 0, notes || null]
    );
    sendSuccess(res, result.rows[0], 'Owner created successfully', 201);
  } catch (error) {
    console.error('Create owner error:', error);
    sendError(res, 'Failed to create owner', 500);
  }
};

const updateOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM owners WHERE id = $1', [id]);
    if (!current.rows.length) return sendError(res, 'Owner not found', 404);

    const owner = current.rows[0];
    const { name, phoneNumber, address, commissionPercentage, profitSharePercentage, notes, status } = req.body;
    const result = await pool.query(
      `UPDATE owners SET name=$1, phone_number=$2, address=$3, commission_percentage=$4,
       profit_share_percentage=$5, notes=$6, status=$7, updated_at=CURRENT_TIMESTAMP WHERE id=$8 RETURNING *`,
      [name || owner.name, phoneNumber ?? owner.phone_number, address ?? owner.address,
        commissionPercentage ?? owner.commission_percentage, profitSharePercentage ?? owner.profit_share_percentage,
        notes ?? owner.notes, status || owner.status, id]
    );
    sendSuccess(res, result.rows[0], 'Owner updated successfully');
  } catch (error) {
    console.error('Update owner error:', error);
    sendError(res, 'Failed to update owner', 500);
  }
};

const deleteOwner = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('DELETE FROM owners WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return sendError(res, 'Owner not found', 404);
    sendSuccess(res, {}, 'Owner deleted successfully');
  } catch (error) {
    console.error('Delete owner error:', error);
    sendError(res, 'Failed to delete owner', 500);
  }
};

const recordOwnerPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { amount, paymentMethod, paymentDate, note } = req.body;
    if (!amount || !paymentDate) return sendError(res, 'Amount and payment date are required', 400);
    const owner = await pool.query('SELECT id FROM owners WHERE id = $1', [id]);
    if (!owner.rows.length) return sendError(res, 'Owner not found', 404);

    const paymentId = uuidv4();
    const result = await pool.query(
      `INSERT INTO owner_payments (id, owner_id, amount, payment_method, payment_date, note)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [paymentId, id, amount, paymentMethod || 'Cash', paymentDate, note || null]
    );
    sendSuccess(res, result.rows[0], 'Owner payment recorded successfully', 201);
  } catch (error) {
    console.error('Owner payment error:', error);
    sendError(res, 'Failed to record owner payment', 500);
  }
};

module.exports = { getOwners, getOwnerById, createOwner, updateOwner, deleteOwner, recordOwnerPayment };
