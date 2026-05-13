const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all drivers with pagination
const getDrivers = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let query = 'SELECT * FROM drivers';
    let countQuery = 'SELECT COUNT(*) FROM drivers';
    const params = [];
    const conditions = [];

    if (status) {
      conditions.push('status = $' + (params.length + 1));
      params.push(status);
    }
    if (search) {
      conditions.push('(name ILIKE $' + (params.length + 1) + ' OR phone_number ILIKE $' + (params.length + 1) + ' OR license_number ILIKE $' + (params.length + 1) + ')');
      params.push('%' + search + '%');
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [driversResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      drivers: driversResult.rows,
      pagination: {
        current: page,
        limit,
        total,
        totalPages,
      },
    }, 'Drivers fetched successfully');
  } catch (error) {
    console.error('Get drivers error:', error);
    sendError(res, 'Failed to fetch drivers', 500);
  }
};

// Get driver by ID
const getDriverById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 'Driver not found', 404);
    }

    sendSuccess(res, result.rows[0], 'Driver fetched successfully');
  } catch (error) {
    console.error('Get driver error:', error);
    sendError(res, 'Failed to fetch driver', 500);
  }
};

// Create driver
const createDriver = async (req, res) => {
  try {
    const { name, phoneNumber, licenseNumber, address, salaryOrCommissionType, salaryAmount, commissionPercentage } = req.body;

    if (!name) {
      return sendError(res, 'Driver name is required', 400);
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO drivers (id, name, phone_number, license_number, address, salary_or_commission_type, salary_amount, commission_percentage, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *',
      [id, name, phoneNumber || null, licenseNumber || null, address || null, salaryOrCommissionType || null, salaryAmount || null, commissionPercentage || null, 'Active']
    );

    sendSuccess(res, result.rows[0], 'Driver created successfully', 201);
  } catch (error) {
    console.error('Create driver error:', error);
    sendError(res, 'Failed to create driver', 500);
  }
};

// Update driver
const updateDriver = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, phoneNumber, licenseNumber, address, salaryOrCommissionType, salaryAmount, commissionPercentage, status } = req.body;

    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return sendError(res, 'Driver not found', 404);
    }

    const driver = result.rows[0];
    const updateResult = await pool.query(
      'UPDATE drivers SET name = $1, phone_number = $2, license_number = $3, address = $4, salary_or_commission_type = $5, salary_amount = $6, commission_percentage = $7, status = $8, updated_at = CURRENT_TIMESTAMP WHERE id = $9 RETURNING *',
      [name || driver.name, phoneNumber || driver.phone_number, licenseNumber || driver.license_number, address || driver.address, salaryOrCommissionType || driver.salary_or_commission_type, salaryAmount || driver.salary_amount, commissionPercentage || driver.commission_percentage, status || driver.status, id]
    );

    sendSuccess(res, updateResult.rows[0], 'Driver updated successfully');
  } catch (error) {
    console.error('Update driver error:', error);
    sendError(res, 'Failed to update driver', 500);
  }
};

// Delete driver
const deleteDriver = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return sendError(res, 'Driver not found', 404);
    }

    await pool.query('DELETE FROM drivers WHERE id = $1', [id]);

    sendSuccess(res, {}, 'Driver deleted successfully');
  } catch (error) {
    console.error('Delete driver error:', error);
    sendError(res, 'Failed to delete driver', 500);
  }
};

// Get driver's trip history
const getDriverTrips = async (req, res) => {
  try {
    const { id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Check if driver exists
    const driverResult = await pool.query('SELECT * FROM drivers WHERE id = $1', [id]);
    if (driverResult.rows.length === 0) {
      return sendError(res, 'Driver not found', 404);
    }

    const [tripsResult, countResult] = await Promise.all([
      pool.query(
        'SELECT t.*, v.registration_number, v.vehicle_type FROM trips t JOIN vehicles v ON t.vehicle_id = v.id WHERE t.driver_id = $1 ORDER BY t.trip_date DESC LIMIT $2 OFFSET $3',
        [id, limit, offset]
      ),
      pool.query('SELECT COUNT(*) FROM trips WHERE driver_id = $1', [id]),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      trips: tripsResult.rows,
      pagination: {
        current: page,
        limit,
        total,
        totalPages,
      },
    }, 'Driver trips fetched successfully');
  } catch (error) {
    console.error('Get driver trips error:', error);
    sendError(res, 'Failed to fetch driver trips', 500);
  }
};

module.exports = {
  getDrivers,
  getDriverById,
  createDriver,
  updateDriver,
  deleteDriver,
  getDriverTrips,
};
