const bcrypt = require('bcryptjs');
const { sendSuccess, sendError } = require('../utils/response');
const pool = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const { getPagination, paginationMeta } = require('../utils/pagination');

const publicUserFields = 'id, email, role, status, full_name, phone_number, created_at, updated_at';

const getUsers = async (req, res) => {
  try {
    const { page, limit, offset } = getPagination(req.query);
    const search = req.query.search;
    const params = [];
    let where = '';
    if (search) {
      where = 'WHERE email ILIKE $1 OR full_name ILIKE $1 OR phone_number ILIKE $1';
      params.push(`%${search}%`);
    }

    const [usersResult, countResult] = await Promise.all([
      pool.query(`SELECT ${publicUserFields} FROM users ${where} ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`, [...params, limit, offset]),
      pool.query(`SELECT COUNT(*) FROM users ${where}`, params),
    ]);

    sendSuccess(res, { users: usersResult.rows, pagination: paginationMeta(page, limit, parseInt(countResult.rows[0].count, 10)) }, 'Users fetched successfully');
  } catch (error) {
    console.error('Get users error:', error);
    sendError(res, 'Failed to fetch users', 500);
  }
};

const createUser = async (req, res) => {
  try {
    const { email, password, role, fullName, phoneNumber, status } = req.body;
    if (!email || !password) return sendError(res, 'Email and password are required', 400);
    if (password.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);

    const existing = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existing.rows.length) return sendError(res, 'Email already exists', 400);

    const passwordHash = await bcrypt.hash(password, 10);
    const id = uuidv4();
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, status, full_name, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING ${publicUserFields}`,
      [id, email, passwordHash, role || 'staff', status || 'Active', fullName || null, phoneNumber || null]
    );
    sendSuccess(res, result.rows[0], 'User created successfully', 201);
  } catch (error) {
    console.error('Create user error:', error);
    sendError(res, 'Failed to create user', 500);
  }
};

const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const current = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!current.rows.length) return sendError(res, 'User not found', 404);

    const user = current.rows[0];
    const { email, role, fullName, phoneNumber, status, password } = req.body;
    let passwordHash = user.password_hash;
    if (password) {
      if (password.length < 6) return sendError(res, 'Password must be at least 6 characters', 400);
      passwordHash = await bcrypt.hash(password, 10);
    }

    const result = await pool.query(
      `UPDATE users SET email=$1, role=$2, status=$3, full_name=$4, phone_number=$5, password_hash=$6, updated_at=CURRENT_TIMESTAMP
       WHERE id=$7 RETURNING ${publicUserFields}`,
      [email || user.email, role || user.role, status || user.status, fullName ?? user.full_name, phoneNumber ?? user.phone_number, passwordHash, id]
    );
    sendSuccess(res, result.rows[0], 'User updated successfully');
  } catch (error) {
    console.error('Update user error:', error);
    sendError(res, 'Failed to update user', 500);
  }
};

const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user.id) return sendError(res, 'You cannot delete your own account', 400);
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (!result.rows.length) return sendError(res, 'User not found', 404);
    sendSuccess(res, {}, 'User deleted successfully');
  } catch (error) {
    console.error('Delete user error:', error);
    sendError(res, 'Failed to delete user', 500);
  }
};

module.exports = { getUsers, createUser, updateUser, deleteUser };
