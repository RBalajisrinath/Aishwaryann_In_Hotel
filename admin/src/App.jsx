import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import Notification from './components/Notification';
import { useIdleTimeout } from './hooks/useIdleTimeout.jsx';

// Pages
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import AdminRoomManagement from './pages/AdminRoomManagement';
import AdminBookingManagement from './pages/AdminBookingManagement';
import AdminUserManagement from './pages/AdminUserManagement';
import AdminGuestManagement from './pages/AdminGuestManagement';
import AdminProfileUpdate from './pages/AdminProfileUpdate';
import AdminWebsiteStatus from './pages/AdminWebsiteStatus';
import AdminRatingsReviews from './pages/AdminRatingsReviews';
import AdminPoliciesManagement from './pages/AdminPoliciesManagement';
import AdminPendingApprovals from './pages/AdminPendingApprovals';
import AdminPaymentSettings from './pages/AdminPaymentSettings';
import AdminWebsiteContentManager from './pages/AdminWebsiteContentManager';
import AdminAmenitiesManagement from './pages/AdminAmenitiesManagement';

// Idle Timeout Wrapper Component
function AppWithIdleTimeout() {
  const warningModal = useIdleTimeout();
  return warningModal;
}

export default function App() {
  return (
    <Router>
      <AppWithIdleTimeout />
      <Routes>
        <Route path="/login" element={<AdminLogin />} />
        
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/rooms"
          element={
            <ProtectedRoute>
              <AdminRoomManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/amenities"
          element={
            <ProtectedRoute>
              <AdminAmenitiesManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/bookings"
          element={
            <ProtectedRoute>
              <AdminBookingManagement />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/users"
          element={
            <ProtectedRoute>
              <AdminUserManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/guests"
          element={
            <ProtectedRoute>
              <AdminGuestManagement />
            </ProtectedRoute>
          }
        />

        

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <AdminProfileUpdate />
            </ProtectedRoute>
          }
        />

        <Route
          path="/website-status"
          element={
            <ProtectedRoute>
              <AdminWebsiteStatus />
            </ProtectedRoute>
          }
        />

        <Route
          path="/reviews"
          element={
            <ProtectedRoute>
              <AdminRatingsReviews />
            </ProtectedRoute>
          }
        />

        

        <Route
          path="/policies"
          element={
            <ProtectedRoute>
              <AdminPoliciesManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/pending-approvals"
          element={
            <ProtectedRoute>
              <AdminPendingApprovals />
            </ProtectedRoute>
          }
        />

        <Route
          path="/payment-settings"
          element={
            <ProtectedRoute>
              <AdminPaymentSettings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/website-content"
          element={
            <ProtectedRoute>
              <AdminWebsiteContentManager />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/dashboard" />} />
      </Routes>
      
      <Notification />
    </Router>
  );
}
