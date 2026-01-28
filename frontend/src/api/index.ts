// frontend/src/api/index.ts
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const ownerApi = {
  // Get bills by category (from your code)
  getBills: async (category: string = 'all') => {
    const response = await api.get(`/owner/bills?category=${category}`);
    return response.data;
  },

  // Get complaints (from teammate's code)
  getComplaints: async () => {
    const response = await api.get('/owner/complaints');
    return response.data;
  },

  // Get payments for a month (from teammate's code)
  getPayments: async (month: string = '2025-01-01') => {
    const response = await api.get(`/owner/payments?month=${month}`);
    return response.data;
  },

  // Get available months for payments
  getPaymentMonths: async () => {
    const response = await api.get('/owner/payments/months');
    return response.data;
  }
};