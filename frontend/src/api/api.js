import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
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

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API calls
export const authAPI = {
  login: (credentials, role) => {
    let endpoint = '';
    if (role === 'admin') endpoint = '/admin/login';
    else if (role === 'technician') endpoint = '/technician/login';
    else endpoint = '/users/login';
    return api.post(endpoint, credentials);
  },
  register: (userData, role) => {
    let endpoint = '';
    if (role === 'technician') endpoint = '/technician/register';
    else endpoint = '/users/register';
    return api.post(endpoint, userData);
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  forgotPassword: (email) => api.post('/users/forgot-password', { email }),
};

// Services API calls
export const servicesAPI = {
  getAllServices: () => api.get('/services'),
  getServiceById: (id) => api.get(`/services/${id}`),
  createService: (serviceData) => api.post('/services', serviceData),
  updateService: (id, serviceData) => api.put(`/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/services/${id}`),
};

// Bookings API calls
export const bookingsAPI = {
  createBooking: (bookingData) => api.post('/bookings', bookingData),
  getUserBookings: () => api.get('/bookings/user'),
  getAllBookings: () => api.get('/bookings'),
  updateBookingStatus: (id, status) => api.put(`/bookings/${id}/status`, { status }),
  getTechnicianBookings: () => api.get('/bookings/technician'),
  respondToBooking: (id, status) => api.put(`/bookings/${id}/respond`, { status }),
  confirmBooking: (id, data) => api.put(`/bookings/${id}/confirm`, data),
};

// Users API calls
export const usersAPI = {
  getCurrentUser: () => api.get('/users/profile'),
  getAllUsers: () => api.get('/users'),
  updateUser: (id, userData) => api.put(`/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/users/${id}`),
};

// Technicians API calls
export const techniciansAPI = {
  getAllTechnicians: () => api.get('/technicians'),
  getTechniciansByCategory: (category) => api.get(`/technicians?category=${encodeURIComponent(category)}`),
  createTechnician: (technicianData) => api.post('/technicians', technicianData),
  updateTechnician: (id, technicianData) => api.put(`/technicians/${id}`, technicianData),
  deleteTechnician: (id) => api.delete(`/technicians/${id}`),
};

export default api; 