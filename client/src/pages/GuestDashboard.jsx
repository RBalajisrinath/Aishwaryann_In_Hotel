import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { guestAPI } from '../api';
import Notification from '../components/Notification';

export default function GuestDashboard() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [bookings, setBookings] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('bookings');

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const bookingsData = await guestAPI.getBookings();
      const profileData = await guestAPI.getProfile();
      setBookings(bookingsData.data || []);
      setProfile(profileData);
      setLoading(false);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to load dashboard', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await guestAPI.cancelBooking(bookingId);
      addNotification({ 
        message: 'Booking cancelled successfully', 
        type: 'success' 
      });
      loadDashboard();
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to cancel booking', 
        type: 'error' 
      });
    }
  };

  const upcomingBookings = bookings.filter(b => new Date(b.checkInDate) > new Date());
  const pastBookings = bookings.filter(b => new Date(b.checkOutDate) < new Date());

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {user?.name}!</h1>
          <button
            onClick={handleLogout}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('bookings')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'bookings'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Bookings ({bookings.length})
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`px-4 py-2 font-medium ${
              activeTab === 'profile'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            My Profile
          </button>
        </div>

        {/* Bookings Tab */}
        {activeTab === 'bookings' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Upcoming Bookings</h2>
            {upcomingBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {upcomingBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {booking.roomType}
                        </h3>
                        <p className="text-sm text-gray-600">Confirmation: {booking.confirmationNumber}</p>
                      </div>
                      <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {booking.status}
                      </span>
                    </div>
                    <div className="space-y-2 mb-4">
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Check-in:</span> {new Date(booking.checkInDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Check-out:</span> {new Date(booking.checkOutDate).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        <span className="font-medium">Guests:</span> {booking.guests}
                      </p>
                      <p className="text-lg font-semibold text-blue-600">
                        ₹{booking.totalPrice}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate(`/booking/${booking.id}`)}
                        className="flex-1 bg-blue-600 text-white px-3 py-2 rounded hover:bg-blue-700 transition text-sm"
                      >
                        View Details
                      </button>
                      <button
                        onClick={() => handleCancelBooking(booking.id)}
                        className="flex-1 bg-red-600 text-white px-3 py-2 rounded hover:bg-red-700 transition text-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 mb-8">
                <p className="text-yellow-800">No upcoming bookings. <button onClick={() => navigate('/browse')} className="text-blue-600 font-medium hover:underline">Browse rooms</button></p>
              </div>
            )}

            <h2 className="text-2xl font-bold text-gray-900 mb-4 mt-8">Past Bookings</h2>
            {pastBookings.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {pastBookings.map(booking => (
                  <div key={booking.id} className="bg-white rounded-lg shadow-md p-6 opacity-75">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      {booking.roomType}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2">
                      {new Date(booking.checkInDate).toLocaleDateString()} - {new Date(booking.checkOutDate).toLocaleDateString()}
                    </p>
                    <p className="text-lg font-semibold text-blue-600">₹{booking.totalPrice}</p>
                    <button
                      onClick={() => navigate(`/booking/${booking.id}`)}
                      className="mt-3 w-full bg-gray-600 text-white px-3 py-2 rounded hover:bg-gray-700 transition text-sm"
                    >
                      View Booking
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-600">No past bookings yet.</p>
            )}
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === 'profile' && profile && (
          <div className="max-w-2xl mx-auto bg-white rounded-lg shadow-md p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Profile Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Name</label>
                <input
                  type="text"
                  value={profile.name}
                  disabled
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="email"
                  value={profile.email}
                  disabled
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="tel"
                  value={profile.phone || 'Not provided'}
                  disabled
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <textarea
                  value={profile.address || 'Not provided'}
                  disabled
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                  rows="3"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Member Since</label>
                <input
                  type="text"
                  value={new Date(profile.createdAt).toLocaleDateString()}
                  disabled
                  className="mt-1 w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50"
                />
              </div>
              <button
                onClick={() => navigate('/profile/edit')}
                className="mt-6 w-full bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Edit Profile
              </button>
            </div>
          </div>
        )}
      </main>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/browse')}
        className="fixed bottom-8 right-8 bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition font-medium"
      >
        Browse Rooms
      </button>

      <Notification />
    </div>
  );
}
