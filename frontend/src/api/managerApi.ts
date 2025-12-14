import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const managerApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
managerApi.interceptors.request.use(
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

export const managerEndpoints = {
  // Dashboard
  getDashboardStats: () => managerApi.get('/manager/dashboard/stats'),
  
  // Renter Management
  getRenters: (params?: any) => managerApi.get('/manager/renters', { params }),
  getRenterById: (id: string) => managerApi.get(`/manager/renters/${id}`),
  approveRenter: (id: string, data: any) => managerApi.post(`/manager/renters/${id}/approve`, data),
  updateRenter: (id: string, data: any) => managerApi.put(`/manager/renters/${id}`, data),
  
  // Bills Management
  getBills: () => managerApi.get('/manager/bills'),
  payBill: (billId: string, data: any) => managerApi.post(`/manager/bills/${billId}/pay`, data),
  
  // Complaints
  getComplaints: (status?: string) => managerApi.get('/manager/complaints', { params: { status } }),
  updateComplaintStatus: (complaintId: string, data: any) => 
    managerApi.put(`/manager/complaints/${complaintId}/status`, data),
  
  // Payments Verification
  getPendingPayments: () => managerApi.get('/manager/payments/pending'),
  verifyPayment: (paymentId: string, data: any) => 
    managerApi.post(`/manager/payments/${paymentId}/verify`, data),
  
  // Tasks
  getTasks: () => managerApi.get('/manager/tasks'),
  updateTask: (taskId: string, data: any) => managerApi.put(`/manager/tasks/${taskId}`, data),
  
  // Messages
  getMessages: (userId?: string) => managerApi.get('/manager/messages', { params: { userId } }),
  sendMessage: (data: any) => managerApi.post('/manager/messages', data),
};

export default managerApi;