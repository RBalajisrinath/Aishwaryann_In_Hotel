import { create } from 'zustand';

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,

  setUser: (user, accessToken, refreshToken) =>
    set({
      user,
      accessToken,
      refreshToken,
      isAuthenticated: !!user
    }),

  logout: () => {
    // Clear from both session and localStorage
    // sessionStorage is cleared automatically when tab closes
    // localStorage is cleared only on explicit logout
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('user');
    localStorage.removeItem('refreshToken'); // Keep refresh token for re-login
    set({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false
    });
  },

  loadFromStorage: () => {
    // ONLY load from sessionStorage - NOT localStorage
    // This ensures each new tab/window requires fresh login
    const token = sessionStorage.getItem('accessToken');
    const user = sessionStorage.getItem('user');
    if (token && user) {
      set({
        accessToken: token,
        user: JSON.parse(user),
        isAuthenticated: true
      });
    }
  }
}));

export const useBookingStore = create((set) => ({
  bookings: [],
  selectedBooking: null,
  loading: false,

  setBookings: (bookings) => set({ bookings }),
  setSelectedBooking: (booking) => set({ selectedBooking: booking }),
  setLoading: (loading) => set({ loading })
}));

export const useHotelStore = create((set) => ({
  hotels: [],
  selectedHotel: null,
  searchResults: [],
  loading: false,

  setHotels: (hotels) => set({ hotels }),
  setSelectedHotel: (hotel) => set({ selectedHotel: hotel }),
  setSearchResults: (results) => set({ searchResults: results }),
  setLoading: (loading) => set({ loading })
}));

export const useNotificationStore = create((set) => {
  let notificationCounter = 0;
  
  return {
    notifications: [],

    addNotification: (notification) =>
      set((state) => ({
        notifications: [...state.notifications, { ...notification, id: `${Date.now()}-${++notificationCounter}` }]
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    clearNotifications: () => set({ notifications: [] })
  };
});

// Combined store export for convenience
export const useStore = useAuthStore;
