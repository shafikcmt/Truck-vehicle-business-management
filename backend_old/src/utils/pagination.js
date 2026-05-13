const getPagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || 10, 1), 100);
  const offset = (page - 1) * limit;
  return { page, limit, offset };
};

const paginationMeta = (page, limit, total) => ({
  current: page,
  limit,
  total,
  totalPages: Math.ceil(total / limit),
});

module.exports = { getPagination, paginationMeta };
