import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store';
import { authAPI } from './api';
import { initializeSocket } from './socket';
import { NotificationContainer } from './components/Notification';

// Animation Components
import PageLoader from './components/PageLoader';
import PageTransition from './components/PageTransition';
import BackgroundSlider from './components/BackgroundSlider';

// Public Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AllRooms from './pages/AllRooms';
import Amenities from './pages/Amenities';
import Contact from './pages/Contact';

// NEW: Guest OTP Booking Pages (No login required)
import GuestBookingPage from './pages/GuestBookingPage';
import BookingSuccessPage from './pages/BookingSuccessPage';
import MyBookingsPage from './pages/MyBookingsPage';

// Guest Pages (OLD - Keep for existing guest functionality)
import GuestDashboard from './pages/GuestDashboard';
import HotelBrowse from './pages/HotelBrowse';
import BookingForm from './pages/BookingForm';

// Components
import MaintenancePage from './components/MaintenancePage';
import Navbar from './components/Navbar';
import './index.css';

// Protected Route Components
function ProtectedRoute({ children, user, requiredRole = null }) {
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (requiredRole && user.role !== requiredRole) {
    if (user.role === 'admin') {
      window.location.href = '/admin/';
      return null;
    } else {
      return <Navigate to="/dashboard" />;
    }
  }
  
  return children;
}

function GuestRoute({ children, user }) {
  if (!user) {
    return <Navigate to="/login" />;
  }
  
  if (user.role === 'admin') {
    return <Navigate to="/" />;
  }
  
  return children;
}

export default function App() {
  const user = useAuthStore((state) => state.user);
  const loadFromStorage = useAuthStore((state) => state.loadFromStorage);
  const [websiteStatus, setWebsiteStatus] = useState(null);
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    // Load user from sessionStorage (per-tab session only)
    // This ensures each new tab/window requires fresh login
    loadFromStorage();

    // Check website status
    checkWebsiteStatus();

    // Initialize socket for real-time updates (pass token if available)
    const token = sessionStorage.getItem('accessToken') || null;
    initializeSocket(token);
  }, [loadFromStorage]);

  const checkWebsiteStatus = async () => {
    try {
      const response = await authAPI.getWebsiteStatus();
      setWebsiteStatus(response.data);
    } catch (error) {
      console.error('Failed to check website status:', error);
      // Default to open if check fails
      setWebsiteStatus({ isOpen: true });
    } finally {
      setCheckingStatus(false);
    }
  };

  // Show loading state
  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking website status...</p>
        </div>
      </div>
    );
  }

  // Show maintenance page if website is closed and user is not admin
  if (!websiteStatus?.isOpen && (!user || user.role !== 'super-admin')) {
    return <MaintenancePage message={websiteStatus?.maintenanceMessage} />;
  }

  return (
    <Router>
      <BackgroundSlider />
      <PageLoader isLoading={false} />
      <Navbar />
      <NotificationContainer />
      <PageTransition>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          
          {/* Legacy routes - redirect to new booking flow */}
          <Route path="/login" element={<Navigate to="/" />} />
          <Route path="/register" element={<Navigate to="/" />} />

          {/* Browse Rooms - PUBLIC (no login needed) */}
          <Route path="/browse" element={<HotelBrowse />} />
          <Route path="/all-rooms" element={<AllRooms />} />
          <Route path="/amenities" element={<Amenities />} />
          <Route path="/contact" element={<Contact />} />

          {/* NEW: Guest OTP Booking Routes - PUBLIC (no login needed) */}
          <Route path="/book/:roomId" element={<GuestBookingPage />} />
          <Route path="/booking-success" element={<BookingSuccessPage />} />
          <Route path="/my-bookings" element={<MyBookingsPage />} />

          {/* OLD: Guest Dashboard - Keep for backward compatibility */}
          <Route
            path="/dashboard"
            element={
              <GuestRoute user={user}>
                <GuestDashboard />
              </GuestRoute>
            }
          />
          {/* Billing route removed */}

          {/* Catch-all - 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </PageTransition>
    </Router>
  );
}
