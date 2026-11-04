import axios from 'axios';

// Determine API base URL - use production domain in production, relative path otherwise
const getAPIBaseURL = () => {
  // If running on production domain, use relative path
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
    return '/api';
  }
  // If running on localhost with different port, use full production URL
  if (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
    // In development mode accessing from localhost, use production API
    return 'https://aishwaryaminn.cloud/api';
  }
  return '/api';
};

const API_BASE_URL = getAPIBaseURL();

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Log responses
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: (email, password) => api.post('/admin/login', { email, password }),
  logout: () => {
    localStorage.removeItem('adminToken');
    return Promise.resolve();
  },
  verify: () => api.get('/admin/verify'),
};

export const adminAPI = {
  // Dashboard
  getDashboardStats: () => api.get('/admin/dashboard/stats'),
  getOccupancyByRoomType: () => api.get('/admin/reports/occupancy'),
  
  // Rooms
  getRooms: () => api.get('/admin/rooms'),
  addRoom: (data) => api.post('/admin/rooms', data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateRoom: (id, data) => api.put(`/admin/rooms/${id}`, data, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  removeRoomImage: (id) => api.delete(`/admin/rooms/${id}/image`),
  deleteRoom: (id) => api.delete(`/admin/rooms/${id}`),

  // Amenities
  getAmenities: () => api.get('/admin/amenities'),
  getAmenitiesByCategory: () => api.get('/admin/amenities/by-category'),
  createAmenity: (data) => api.post('/admin/amenities', data),
  updateAmenity: (id, data) => api.put(`/admin/amenities/${id}`, data),
  deleteAmenity: (id) => api.delete(`/admin/amenities/${id}`),

  // Bookings
  getBookings: () => api.get('/admin/bookings'),
  getAllBookings: () => api.get('/admin/bookings'),
  searchBookingById: (bookingId) => api.get(`/admin/bookings/search/${bookingId}`),
  updateBooking: (id, data) => api.put(`/admin/bookings/${id}`, data),
  checkoutBooking: (id) => api.post(`/admin/bookings/${id}/checkout`),
  deleteBooking: (id) => api.delete(`/admin/bookings/${id}`),
  downloadBooking: (id) => api.get(`/admin/bookings/${id}/download`, { responseType: 'blob' }),
  downloadBookingPackage: (id) => api.get(`/admin/bookings/${id}/package`, { responseType: 'blob' }),

  // Users
  getUsers: () => api.get('/admin/users'),
  getAllUsers: () => api.get('/admin/users'),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),


  // Ratings
  getRatings: () => api.get('/admin/ratings'),
  deleteRating: (id) => api.delete(`/admin/ratings/${id}`),

  // Website Status
  getStatus: () => api.get('/admin/website/status'),
  updateStatus: (data) => api.put('/admin/website/status', data),
  closeWebsite: () => api.post('/admin/website/close'),
  openWebsite: () => api.post('/admin/website/open'),
  toggleWebsite: () => api.post('/admin/website/toggle'),

  // Profile
  getProfile: () => api.get('/admin/profile'),
  updateProfile: (data) => api.put('/admin/profile', data),


  // Hotel Policies
  getHotelPolicies: (hotelId = 1) => api.get(`/admin/policies/${hotelId}`),
  updateHotelPolicy: (hotelId, policyType, data) => api.put(`/admin/policies/${hotelId}/${policyType}`, data),
  getActivePolicyType: () => api.get('/admin/policies/active/current'),

  // Payment Approvals (Manual Payment Workflow)
  getPendingApprovals: () => api.get('/admin/pending-approvals'),
  approveBooking: (bookingId, data) => api.put(`/admin/approve/${bookingId}`, data),
  rejectBooking: (bookingId, data) => api.put(`/admin/reject/${bookingId}`, data),

  // Payment Settings
  getPaymentSettings: (hotelId) => api.get(`/hotels/${hotelId}/payment-settings`),
  updatePaymentSettings: (hotelId, data) => api.put(`/admin/payment-settings/${hotelId}`, data),

  // Videos
  getVideos: () => api.get('/admin/site-content/videos/admin/all'),
  createVideo: (formData) => api.post('/admin/site-content/videos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateVideo: (id, data) => api.put(`/admin/site-content/videos/${id}`, data),
  deleteVideo: (id) => api.delete(`/admin/site-content/videos/${id}`),
  reorderVideos: (videos) => api.post('/admin/site-content/videos/reorder', { videos }),
};

export default api;
