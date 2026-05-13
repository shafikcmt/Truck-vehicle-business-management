const { sendError } = require('../utils/response');

const authorize = (...roles) => (req, res, next) => {
  if (!req.user) return sendError(res, 'Authentication required', 401);
  if (!roles.length || roles.includes(req.user.role)) return next();
  return sendError(res, 'You do not have permission to perform this action', 403);
};

module.exports = authorize;
