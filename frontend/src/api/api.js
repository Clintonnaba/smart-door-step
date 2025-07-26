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
    if (role === 'admin') endpoint = '/api/admin/login';
    else if (role === 'technician') endpoint = '/api/technician/login';
    else endpoint = '/api/users/login';
    return api.post(endpoint, credentials);
  },
  register: (userData, role) => {
    let endpoint = '';
    if (role === 'technician') endpoint = '/api/technician/register';
    else endpoint = '/api/users/register';
    return api.post(endpoint, userData);
  },
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  forgotPassword: (email) => api.post('/api/users/forgot-password', { email }),
};

// Services API calls
export const servicesAPI = {
  getAllServices: () => api.get('/api/services'),
  getServiceById: (id) => api.get(`/api/services/${id}`),
  createService: (serviceData) => api.post('/api/services', serviceData),
  updateService: (id, serviceData) => api.put(`/api/services/${id}`, serviceData),
  deleteService: (id) => api.delete(`/api/services/${id}`),
};

// Bookings API calls
export const bookingsAPI = {
  createBooking: (bookingData) => api.post('/api/bookings', bookingData),
  getUserBookings: () => api.get('/api/bookings/user'),
  getAllBookings: () => api.get('/api/bookings'),
  updateBookingStatus: (id, status) => api.put(`/api/bookings/${id}/status`, { status }),
  getTechnicianBookings: () => api.get('/api/bookings/technician'),
  respondToBooking: (id, status) => api.put(`/api/bookings/${id}/respond`, { status }),
  confirmBooking: (id, data) => {
    // Map 'confirmed' to 'Approved' for backend compatibility
    const mappedData = {
      ...data,
      status: data.status === 'confirmed' ? 'Approved' : data.status
    };
    return api.put(`/api/bookings/${id}/confirm`, mappedData);
  },
  // New methods for improved booking flow
  setQuote: (id, proposedPrice) => api.post(`/api/bookings/${id}/quote`, { proposedPrice }),
  respondToQuote: (id, response) => api.post(`/api/bookings/${id}/respond-quote`, { response }),
  // Real-time booking system methods
  broadcastRequest: (bookingData) => api.post('/api/bookings/broadcast', bookingData),
  respondToRequest: (bookingId, responseData) => api.post(`/api/bookings/${bookingId}/respond`, responseData),
  selectTechnician: (bookingId, technicianId) => api.post(`/api/bookings/${bookingId}/select-technician`, { technicianId }),
  getPendingRequests: () => api.get('/api/bookings/pending-requests'),
  getTechnicianOffers: (bookingId) => api.get(`/api/bookings/${bookingId}/offers`),
  getTechnicianPendingRequests: (technicianId) => api.get(`/api/bookings/technician/${technicianId}/pending`),
  adminApproval: (bookingId, action) => api.post(`/api/bookings/${bookingId}/admin-approval`, { action }),
};

// Users API calls
export const usersAPI = {
  getCurrentUser: () => api.get('/api/users/me'),
  getAllUsers: () => api.get('/api/users'),
  updateUser: (id, userData) => api.put(`/api/users/${id}`, userData),
  deleteUser: (id) => api.delete(`/api/users/${id}`),
};

// Technicians API calls
export const techniciansAPI = {
  getAllTechnicians: () => api.get('/api/technicians'),
  getTechniciansByCategory: (category) => api.get(`/api/technicians?category=${encodeURIComponent(category)}`),
  createTechnician: (technicianData) => api.post('/api/technicians', technicianData),
  updateTechnician: (id, technicianData) => api.put(`/api/technicians/${id}`, technicianData),
  deleteTechnician: (id) => api.delete(`/api/technicians/${id}`),
};

// Ratings API calls
export const ratingsAPI = {
  createRating: (ratingData) => api.post('/api/ratings', ratingData),
  getTechnicianRatings: (technicianId) => api.get(`/api/ratings/technician/${technicianId}`),
  getAverageRating: (technicianId) => api.get(`/api/ratings/technician/${technicianId}/average`),
};

export default api; 