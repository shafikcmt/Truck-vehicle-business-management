import apiClient from './client';

export const vehicleAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/vehicles', { params: { page, limit, ...filters } }),
  getById: (id) => apiClient.get(`/vehicles/${id}`),
  create: (data) => apiClient.post('/vehicles', data),
  update: (id, data) => apiClient.put(`/vehicles/${id}`, data),
  delete: (id) => apiClient.delete(`/vehicles/${id}`),
  search: (number) => apiClient.get(`/vehicles/search/${number}`),
};

export const driverAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/drivers', { params: { page, limit, ...filters } }),
  getById: (id) => apiClient.get(`/drivers/${id}`),
  create: (data) => apiClient.post('/drivers', data),
  update: (id, data) => apiClient.put(`/drivers/${id}`, data),
  delete: (id) => apiClient.delete(`/drivers/${id}`),
  getTrips: (id, page = 1, limit = 10) => apiClient.get(`/drivers/${id}/trips`, { params: { page, limit } }),
};

export const tripAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/trips', { params: { page, limit, ...filters } }),
  getById: (id) => apiClient.get(`/trips/${id}`),
  create: (data) => apiClient.post('/trips', data),
  update: (id, data) => apiClient.put(`/trips/${id}`, data),
  updateStatus: (id, status) => apiClient.patch(`/trips/${id}/status`, { status }),
  delete: (id) => apiClient.delete(`/trips/${id}`),
};

export const incomeAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/income', { params: { page, limit, ...filters } }),
  create: (data) => apiClient.post('/income', data),
  update: (id, data) => apiClient.put(`/income/${id}`, data),
  delete: (id) => apiClient.delete(`/income/${id}`),
  getByTrip: (tripId) => apiClient.get(`/income/by-trip/${tripId}`),
  getByDateRange: (startDate, endDate) => apiClient.get('/income/by-date-range', { params: { startDate, endDate } }),
};

export const expenseAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/expenses', { params: { page, limit, ...filters } }),
  create: (data) => apiClient.post('/expenses', data),
  update: (id, data) => apiClient.put(`/expenses/${id}`, data),
  delete: (id) => apiClient.delete(`/expenses/${id}`),
  getByTrip: (tripId) => apiClient.get(`/expenses/by-trip/${tripId}`),
  getByVehicle: (vehicleId, page = 1, limit = 10) => apiClient.get(`/expenses/by-vehicle/${vehicleId}`, { params: { page, limit } }),
};

export const paymentAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/payments/all', { params: { page, limit, ...filters } }),
  getDues: (page = 1, limit = 10, filters = {}) => apiClient.get('/payments/dues', { params: { page, limit, ...filters } }),
  create: (data) => apiClient.post('/payments', data),
  update: (id, data) => apiClient.put(`/payments/entry/${id}`, data),
  delete: (id) => apiClient.delete(`/payments/entry/${id}`),
  getTripDue: (tripId) => apiClient.get(`/payments/${tripId}`),
};

export const ownerAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/owners', { params: { page, limit, ...filters } }),
  getById: (id) => apiClient.get(`/owners/${id}`),
  create: (data) => apiClient.post('/owners', data),
  update: (id, data) => apiClient.put(`/owners/${id}`, data),
  delete: (id) => apiClient.delete(`/owners/${id}`),
  recordPayment: (id, data) => apiClient.post(`/owners/${id}/payments`, data),
};

export const userAPI = {
  getAll: (page = 1, limit = 10, filters = {}) => apiClient.get('/users', { params: { page, limit, ...filters } }),
  create: (data) => apiClient.post('/users', data),
  update: (id, data) => apiClient.put(`/users/${id}`, data),
  delete: (id) => apiClient.delete(`/users/${id}`),
};

export const reportAPI = {
  get: (type, filters = {}) => apiClient.get(`/reports/${type}`, { params: filters }),
  url: (type, filters = {}) => {
    const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
    const params = new URLSearchParams(filters).toString();
    return `${base}/reports/${type}${params ? `?${params}` : ''}`;
  },
};

export const dashboardAPI = { getSummary: () => apiClient.get('/dashboard/summary') };

export const billingAPI = {
  invoiceUrl: (tripId) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/invoice/${tripId}`,
  challanUrl: (tripId) => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/billing/challan/${tripId}`,
};

export const systemAPI = {
  getSettings: () => apiClient.get('/system/settings'),
  updateSettings: (data) => apiClient.put('/system/settings', data),
  backupUrl: () => `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/system/backup`,
};
