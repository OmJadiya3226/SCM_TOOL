const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// Helper function to get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Helper function to make API requests
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    },
    ...options,
  };

  if (options.body && typeof options.body === 'object') {
    config.body = JSON.stringify(options.body);
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  } catch (error) {
    throw error;
  }
};

// Auth API
export const authAPI = {
  login: (email, password) => apiRequest('/auth/login', {
    method: 'POST',
    body: { email, password },
  }),
  register: (name, email, password, role, secretPassword) => apiRequest('/auth/register', {
    method: 'POST',
    body: { name, email, password, role, secretPassword },
  }),
  getMe: () => apiRequest('/auth/me'),
};

// Suppliers API
export const suppliersAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/suppliers${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/suppliers/${id}`),
  create: (data) => apiRequest('/suppliers', {
    method: 'POST',
    body: data,
  }),
  update: (id, data) => apiRequest(`/suppliers/${id}`, {
    method: 'PUT',
    body: data,
  }),
  delete: (id) => apiRequest(`/suppliers/${id}`, {
    method: 'DELETE',
  }),
};

// Raw Materials API
export const rawMaterialsAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/raw-materials${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/raw-materials/${id}`),
  create: (data) => apiRequest('/raw-materials', {
    method: 'POST',
    body: data,
  }),
  update: (id, data) => apiRequest(`/raw-materials/${id}`, {
    method: 'PUT',
    body: data,
  }),
  delete: (id) => apiRequest(`/raw-materials/${id}`, {
    method: 'DELETE',
  }),
};

// Batches API
export const batchesAPI = {
  getAll: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/batches${queryString ? `?${queryString}` : ''}`);
  },
  getById: (id) => apiRequest(`/batches/${id}`),
  create: (data) => apiRequest('/batches', {
    method: 'POST',
    body: data,
  }),
  update: (id, data) => apiRequest(`/batches/${id}`, {
    method: 'PUT',
    body: data,
  }),
  delete: (id) => apiRequest(`/batches/${id}`, {
    method: 'DELETE',
  }),
};

// Dashboard API
export const dashboardAPI = {
  getStats: () => apiRequest('/dashboard/stats'),
  getRecentBatches: () => apiRequest('/dashboard/recent-batches'),
  getSupplierAlerts: () => apiRequest('/dashboard/supplier-alerts'),
};
