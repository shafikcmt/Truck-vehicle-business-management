import axios from 'axios';
import Cookies from 'js-cookie';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  const token = Cookies.get('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

function normalizeApiError(error) {
  if (error.response) {
    return error.response.data || { message: 'Request failed. Please try again.' };
  }

  if (error.code === 'ECONNABORTED') {
    return {
      message: `Backend API request timed out. Make sure the backend is running at ${API_URL}.`,
    };
  }

  if (error.code === 'ERR_NETWORK' || error.message === 'Network Error' || !error.response) {
    return {
      message: `Backend API is not reachable at ${API_URL}. Start the backend server and PostgreSQL, then refresh this page.`,
    };
  }

  return { message: error.message || 'Unexpected API error.' };
}

// Handle responses
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401) {
      Cookies.remove('token');
      if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }
    throw normalizeApiError(error);
  }
);

export default apiClient;
