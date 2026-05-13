const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');

// Get all vehicles with pagination
const getVehicles = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;
    const status = req.query.status;
    const search = req.query.search;

    let query = 'SELECT v.*, o.name AS owner_account_name FROM vehicles v LEFT JOIN owners o ON o.id = v.owner_id';
    let countQuery = 'SELECT COUNT(*) FROM vehicles v LEFT JOIN owners o ON o.id = v.owner_id';
    const params = [];

    const conditions = [];
    if (status) {
      conditions.push('v.status = $' + (params.length + 1));
      params.push(status);
    }
    if (search) {
      conditions.push('(v.registration_number ILIKE $' + (params.length + 1) + ' OR v.vehicle_type ILIKE $' + (params.length + 1) + ' OR COALESCE(o.name, v.owner_name) ILIKE $' + (params.length + 1) + ')');
      params.push('%' + search + '%');
    }
    if (conditions.length) {
      query += ' WHERE ' + conditions.join(' AND ');
      countQuery += ' WHERE ' + conditions.join(' AND ');
    }

    query += ' ORDER BY v.created_at DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);

    const [vehiclesResult, countResult] = await Promise.all([
      pool.query(query, [...params, limit, offset]),
      pool.query(countQuery, params),
    ]);

    const total = parseInt(countResult.rows[0].count);
    const totalPages = Math.ceil(total / limit);

    sendSuccess(res, {
      vehicles: vehiclesResult.rows,
      pagination: {
        current: page,
        limit,
        total,
        totalPages,
      },
    }, 'Vehicles fetched successfully');
  } catch (error) {
    console.error('Get vehicles error:', error);
    sendError(res, 'Failed to fetch vehicles', 500);
  }
};

// Get vehicle by ID
const getVehicleById = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);

    if (result.rows.length === 0) {
      return sendError(res, 'Vehicle not found', 404);
    }

    sendSuccess(res, result.rows[0], 'Vehicle fetched successfully');
  } catch (error) {
    console.error('Get vehicle error:', error);
    sendError(res, 'Failed to fetch vehicle', 500);
  }
};

// Create vehicle
const createVehicle = async (req, res) => {
  try {
    const { registrationNumber, vehicleType, ownerName, ownerId, model, capacity, fitnessExpiryDate, taxExpiryDate, insuranceExpiryDate } = req.body;

    if (!registrationNumber || !vehicleType) {
      return sendError(res, 'Registration number and vehicle type are required', 400);
    }

    // Check if vehicle already exists
    const existingVehicle = await pool.query('SELECT * FROM vehicles WHERE registration_number = $1', [registrationNumber]);
    if (existingVehicle.rows.length > 0) {
      return sendError(res, 'Vehicle with this registration number already exists', 400);
    }

    const id = uuidv4();
    const result = await pool.query(
      'INSERT INTO vehicles (id, registration_number, vehicle_type, owner_name, owner_id, model, capacity, fitness_expiry_date, tax_expiry_date, insurance_expiry_date, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *',
      [id, registrationNumber, vehicleType, ownerName || null, ownerId || null, model || null, capacity || null, fitnessExpiryDate || null, taxExpiryDate || null, insuranceExpiryDate || null, 'Available']
    );

    sendSuccess(res, result.rows[0], 'Vehicle created successfully', 201);
  } catch (error) {
    console.error('Create vehicle error:', error);
    sendError(res, 'Failed to create vehicle', 500);
  }
};

// Update vehicle
const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const { registrationNumber, vehicleType, ownerName, ownerId, model, capacity, status, fitnessExpiryDate, taxExpiryDate, insuranceExpiryDate } = req.body;

    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return sendError(res, 'Vehicle not found', 404);
    }

    const updateResult = await pool.query(
      'UPDATE vehicles SET registration_number = $1, vehicle_type = $2, owner_name = $3, owner_id = $4, model = $5, capacity = $6, status = $7, fitness_expiry_date = $8, tax_expiry_date = $9, insurance_expiry_date = $10, updated_at = CURRENT_TIMESTAMP WHERE id = $11 RETURNING *',
      [registrationNumber || result.rows[0].registration_number, vehicleType || result.rows[0].vehicle_type, ownerName ?? result.rows[0].owner_name, ownerId ?? result.rows[0].owner_id, model ?? result.rows[0].model, capacity ?? result.rows[0].capacity, status || result.rows[0].status, fitnessExpiryDate || result.rows[0].fitness_expiry_date, taxExpiryDate || result.rows[0].tax_expiry_date, insuranceExpiryDate || result.rows[0].insurance_expiry_date, id]
    );

    sendSuccess(res, updateResult.rows[0], 'Vehicle updated successfully');
  } catch (error) {
    console.error('Update vehicle error:', error);
    sendError(res, 'Failed to update vehicle', 500);
  }
};

// Delete vehicle
const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;

    const result = await pool.query('SELECT * FROM vehicles WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return sendError(res, 'Vehicle not found', 404);
    }

    await pool.query('DELETE FROM vehicles WHERE id = $1', [id]);

    sendSuccess(res, {}, 'Vehicle deleted successfully');
  } catch (error) {
    console.error('Delete vehicle error:', error);
    sendError(res, 'Failed to delete vehicle', 500);
  }
};

// Search vehicle by registration number
const searchVehicle = async (req, res) => {
  try {
    const { number } = req.params;
    const result = await pool.query('SELECT * FROM vehicles WHERE registration_number ILIKE $1', [`%${number}%`]);

    sendSuccess(res, result.rows, 'Vehicles found');
  } catch (error) {
    console.error('Search vehicle error:', error);
    sendError(res, 'Failed to search vehicles', 500);
  }
};

module.exports = {
  getVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  searchVehicle,
};
