import { create } from 'zustand';
import { authAPI } from './utils/api';

const getStoredUser = () => {
  try {
    const stored = localStorage.getItem('adminUser');
    return stored ? JSON.parse(stored) : null;
  } catch (error) {
    return null;
  }
};

export const useAuthStore = create((set) => ({
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('adminToken'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const response = await authAPI.login(email, password);
      console.log('Login response:', response.data);
      const { accessToken, user } = response.data;
      console.log('Storing token:', accessToken);
      console.log('User data:', user);
      localStorage.setItem('adminToken', accessToken);
      localStorage.setItem('adminUser', JSON.stringify(user));
      set({ user: user, isAuthenticated: true, loading: false });
      return true;
    } catch (err) {
      console.error('Login error:', err);
      set({ error: err.response?.data?.message || 'Login failed', loading: false });
      return false;
    }
  },

  logout: async () => {
    await authAPI.logout();
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    set({ user: null, isAuthenticated: false });
  },

  setUser: (userData) => {
    localStorage.setItem('adminUser', JSON.stringify(userData));
    set({ user: userData });
  },

  verifyAuth: async () => {
    const token = localStorage.getItem('adminToken');
    console.log('Verifying auth, token:', token);
    if (!token) {
      set({ isAuthenticated: false, user: null });
      return false;
    }
    
    try {
      const response = await authAPI.verify();
      console.log('Verify response:', response.data);
      set({ user: response.data.user, isAuthenticated: true });
      return true;
    } catch (err) {
      console.error('Verify error:', err.response?.status, err.response?.data);
      // Token is invalid or expired - clear auth state
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      set({ isAuthenticated: false, user: null });
      return false;
    }
  },
}));

let notificationCounter = 0;

export const useNotificationStore = create((set) => ({
  notifications: [],
  addNotification: (notification) => {
    const id = `${Date.now()}-${notificationCounter++}`;
    set((state) => ({
      notifications: [...state.notifications, { ...notification, id }],
    }));
    setTimeout(() => {
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id),
      }));
    }, 3000);
  },
  removeNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
}));
