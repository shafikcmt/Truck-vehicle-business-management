import apiClient from './client';

export const authAPI = {
  register: (email, password) => apiClient.post('/auth/register', { email, password }),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  getCurrentUser: () => apiClient.get('/auth/me'),
  changePassword: (oldPassword, newPassword) =>
    apiClient.post('/auth/change-password', { oldPassword, newPassword }),
};
