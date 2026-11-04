import axios from 'axios';
import { useAuthStore } from './store.js';

const API_URL = '/api';

const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add token to requests
apiClient.interceptors.request.use((config) => {
  // Check sessionStorage first (current tab/window session)
  // Fall back to localStorage (for persistent sessions if needed)
  const token = sessionStorage.getItem('accessToken') || localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle errors
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear from both storage types
      sessionStorage.removeItem('accessToken');
      sessionStorage.removeItem('user');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  register: (data) => apiClient.post('/auth/register', data),
  login: (email, password) => apiClient.post('/auth/login', { email, password }),
  logout: () => apiClient.post('/auth/logout'),
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  requestPasswordReset: (email) => apiClient.post('/auth/request-password-reset', { email }),
  resetPassword: (token, newPassword) =>
    apiClient.post('/auth/reset-password', { token, newPassword }),
  getWebsiteStatus: () => apiClient.get('/auth/website-status')
};

// NEW: Guest APIs (OTP-based booking - No auth required)
export const guestBookingAPI = {
  sendOTP: (email) => apiClient.post('/guest/send-otp', { email }),
  verifyOTP: (email, otp) => apiClient.post('/guest/verify-otp', { email, otp }),
  createBooking: (bookingData) => apiClient.post('/guest/create-booking', bookingData),
  createBookingWithPayment: (formData) => apiClient.post('/guest/create-booking-with-payment', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  retrieveBookings: (uniqueId) => apiClient.post('/guest/retrieve-bookings', { uniqueId }),
  forgotId: (email) => apiClient.post('/guest/forgot-id', { email }),
  getBookingByConfirmation: (confirmationNumber) => 
    apiClient.get(`/guest/booking/${confirmationNumber}`),
  sendBookingEmail: (bookingId, email) => 
    apiClient.post('/guest/send-booking-email', { bookingId, email })
};

// Hotel APIs
export const hotelAPI = {
  getAll: () => apiClient.get('/hotels/all'),
  search: (params) => apiClient.get('/hotels/search', { params }),
  getById: (hotelId) => apiClient.get(`/hotels/${hotelId}`),
  getRoomById: (hotelId, roomId) => apiClient.get(`/hotels/${hotelId}/rooms/${roomId}`),
  getPolicies: (hotelId = 1) => apiClient.get(`/hotels/${hotelId}/policies`),
  getPaymentSettings: (hotelId = 1) => apiClient.get(`/hotels/${hotelId}/payment-settings`),
  checkAvailability: (roomId, checkIn, checkOut) =>
    apiClient.get(`/hotels/${roomId}/check-availability`, {
      params: { roomId, checkIn, checkOut }
    }),
  getVideos: () => apiClient.get('/site-content/videos')
};

// Booking APIs
export const bookingAPI = {
  create: (data) => apiClient.post('/bookings/create', data),
  getMyBookings: () => apiClient.get('/bookings/my-bookings'),
  getById: (bookingId) => apiClient.get(`/bookings/${bookingId}`),
  cancel: (bookingId) => apiClient.post(`/bookings/${bookingId}/cancel`),
  updateStatus: (bookingId, status) =>
    apiClient.put(`/bookings/${bookingId}/status`, { status })
};

// Bill APIs
// Billing APIs removed

// Admin APIs
export const adminAPI = {
  getDashboardStats: () => apiClient.get('/admin/dashboard/stats'),
  getUsers: () => apiClient.get('/admin/users'),
  getUserDetails: (userId) => apiClient.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, status) =>
    apiClient.put(`/admin/users/${userId}/status`, { status }),
  getHotels: () => apiClient.get('/admin/hotels'),
  updateHotel: (hotelId, data) => apiClient.put(`/admin/hotels/${hotelId}`, data),
  getRooms: () => apiClient.get('/admin/rooms'),
  updateRoom: (roomId, data) => apiClient.put(`/admin/rooms/${roomId}`, data),
  getBookings: (params) => apiClient.get('/admin/bookings', { params }),
  getRevenueReport: (params) => apiClient.get('/admin/reports/revenue', { params }),
  getOccupancyReport: () => apiClient.get('/admin/reports/occupancy'),
  
  // Admin Profile Management
  updateAdminProfile: (data) => apiClient.put('/admin/profile/update', data),
  getAdminProfile: () => apiClient.get('/admin/profile'),
  
  // Website Status Management
  getWebsiteStatus: () => apiClient.get('/admin/website/status'),
  updateWebsiteStatus: (data) => apiClient.put('/admin/website/status', data),
  closeWebsite: (message) => apiClient.post('/admin/website/close', { message }),
  openWebsite: () => apiClient.post('/admin/website/open'),
  toggleWebsite: (message) => apiClient.post('/admin/website/toggle', { message }),
  
  // Reviews & Ratings Management
  getAllReviews: () => apiClient.get('/admin/reviews/all'),
  approveReview: (reviewId) => apiClient.put(`/admin/reviews/${reviewId}/approve`),
  rejectReview: (reviewId) => apiClient.put(`/admin/reviews/${reviewId}/reject`),
  deleteReview: (reviewId) => apiClient.delete(`/admin/reviews/${reviewId}`),
  
  // Billing Management
  // Billing management removed
  
  // Gallery/Year Card Management
  getYearCards: () => apiClient.get('/gallery/year-cards'),
  getYearCardById: (cardId) => apiClient.get(`/gallery/year-cards/${cardId}`),
  uploadYearCard: (formData) => apiClient.post('/gallery/year-cards/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateYearCard: (cardId, formData) => apiClient.put(`/gallery/year-cards/${cardId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  reorderYearCards: (cards) => apiClient.post('/gallery/year-cards/reorder', { cards }),
  deleteYearCard: (cardId) => apiClient.delete(`/gallery/year-cards/${cardId}`),
  
  // Website Content Management
  getHeroContent: () => apiClient.get('/site-content/hero'),
  
  // Bill Template Management
  // Bill template features removed
};

// Guest APIs (alias for convenience)
export const guestAPI = {
  getProfile: () => apiClient.get('/auth/profile'),
  updateProfile: (data) => apiClient.put('/auth/profile', data),
  getBookings: () => apiClient.get('/bookings/my-bookings'),
  getBookingById: (bookingId) => apiClient.get(`/bookings/${bookingId}`),
  cancelBooking: (bookingId) => apiClient.post(`/bookings/${bookingId}/cancel`),
  
  // Also keep nested references
  bookings: bookingAPI,
  hotels: hotelAPI,
  auth: authAPI
};

export default apiClient;
