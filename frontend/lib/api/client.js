import Cookies from 'js-cookie';

function normalizeBaseUrl(value) {
  const fallback = 'http://localhost:5000/api';
  const raw = String(value || fallback).trim();
  return raw.replace(/\/+$/, '');
}

export const API_URL = normalizeBaseUrl(process.env.NEXT_PUBLIC_API_URL);
export const HEALTH_URL = API_URL.replace(/\/api$/, '') + '/api/health';

const REQUEST_TIMEOUT_MS = 120000;

function buildUrl(path, params) {
  const cleanPath = String(path || '').startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_URL}${cleanPath}`);

  if (params && typeof params === 'object') {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });
  }

  return url.toString();
}

async function parseBody(response) {
  const text = await response.text();
  if (!text) return {};

  try {
    return JSON.parse(text);
  } catch (error) {
    return { message: text };
  }
}

function getNetworkErrorMessage(error) {
  if (error?.name === 'AbortError') {
    return `Backend API request timed out after ${REQUEST_TIMEOUT_MS / 1000}s. Render free backend may be cold starting. Open ${HEALTH_URL}, wait for OK, then try again.`;
  }

  return `Frontend could not reach backend API at ${API_URL}. Backend health is ${HEALTH_URL}. If health opens in browser but login fails, open DevTools Console and check for CORS or Failed to fetch details.`;
}

async function request(method, path, body, config = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  const token = Cookies.get('token');
  const headers = {
    Accept: 'application/json',
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(config.headers || {}),
  };

  try {
    const response = await fetch(buildUrl(path, config.params), {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal: controller.signal,
      mode: 'cors',
      cache: 'no-store',
      credentials: 'omit',
    });

    const data = await parseBody(response);

    if (!response.ok) {
      if (response.status === 401) {
        Cookies.remove('token');
        if (typeof window !== 'undefined' && window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      throw {
        ...data,
        status: response.status,
        message: data?.message || `Request failed with HTTP ${response.status}`,
      };
    }

    return data;
  } catch (error) {
    if (error?.status || error?.message?.includes('Invalid email')) {
      throw error;
    }

    throw {
      message: getNetworkErrorMessage(error),
      originalError: error?.message || String(error),
    };
  } finally {
    clearTimeout(timeoutId);
  }
}

const apiClient = {
  get: (path, config = {}) => request('GET', path, undefined, config),
  post: (path, data, config = {}) => request('POST', path, data, config),
  put: (path, data, config = {}) => request('PUT', path, data, config),
  patch: (path, data, config = {}) => request('PATCH', path, data, config),
  delete: (path, config = {}) => request('DELETE', path, undefined, config),
  health: () => request('GET', '/health'),
};

export default apiClient;
