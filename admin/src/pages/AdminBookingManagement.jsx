import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiFilter, FiDownload, FiX, FiArrowLeft, FiCalendar, FiUser, FiHome, FiDollarSign, FiAlertCircle, FiSearch, FiEdit3, FiTrash2 } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminBookingManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState({
    status: 'all',
    sortBy: 'recent',
  });
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [deleteConfirmBooking, setDeleteConfirmBooking] = useState(null);
  const [paymentStatusModal, setPaymentStatusModal] = useState(null);
  const [updatingPaymentStatus, setUpdatingPaymentStatus] = useState(false);

  useEffect(() => {
    loadBookings();
  }, [filters]);

  const loadBookings = async () => {
    try {
      const data = await adminAPI.getBookings();
      let filtered = data.data || [];

      if (filters.status !== 'all') {
        filtered = filtered.filter(b => b.status === filters.status);
      }

      if (filters.sortBy === 'recent') {
        filtered.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      } else if (filters.sortBy === 'upcoming') {
        filtered.sort((a, b) => new Date(a.checkInDate) - new Date(b.checkInDate));
      }

      setBookings(filtered);
      setLoading(false);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to load bookings', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const handleSearchBooking = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      addNotification({ message: 'Please enter a booking ID', type: 'error' });
      return;
    }
    
    try {
      setSearchLoading(true);
      const response = await adminAPI.searchBookingById(searchQuery.trim());
      if (response.data.booking) {
        setSelectedBooking(response.data.booking);
        setBookings([response.data.booking]);
        addNotification({ 
          message: 'Booking found successfully!', 
          type: 'success' 
        });
      }
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Booking not found with this ID', 
        type: 'error' 
      });
      setBookings([]);
      setSelectedBooking(null);
    } finally {
      setSearchLoading(false);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedBooking(null);
    loadBookings();
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to cancel this booking?')) return;
    try {
      await adminAPI.updateBooking(bookingId, { status: 'cancelled' });
      addNotification({ 
        message: 'Booking cancelled successfully', 
        type: 'success' 
      });
      loadBookings();
      setSelectedBooking(null);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to cancel booking', 
        type: 'error' 
      });
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to permanently delete this booking? This action cannot be undone.')) return;
    
    try {
      await adminAPI.deleteBooking(bookingId);
      addNotification({ 
        message: 'Booking deleted successfully', 
        type: 'success' 
      });
      loadBookings();
      setSelectedBooking(null);
      setDeleteConfirmBooking(null);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to delete booking', 
        type: 'error' 
      });
    }
  };

  const handleDownloadDetails = async (bookingId) => {
    try {
      const resp = await adminAPI.downloadBookingPackage(bookingId);
      // resp.data is a Blob because responseType: 'blob'
      const blob = new Blob([resp.data], { type: resp.data.type || 'application/zip' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const fileName = `booking_${selectedBooking?.confirmationNumber || bookingId}.zip`;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      addNotification({ message: 'Booking package downloaded', type: 'success' });
    } catch (error) {
      addNotification({ message: error.response?.data?.message || 'Failed to download booking package', type: 'error' });
    }
  };

  const handleUpdatePaymentStatus = async (newStatus) => {
    if (!selectedBooking) return;
    
    try {
      setUpdatingPaymentStatus(true);
      await adminAPI.updateBooking(selectedBooking.id, { paymentStatus: newStatus });
      
      // Update local state
      setSelectedBooking({
        ...selectedBooking,
        paymentStatus: newStatus
      });
      
      // Update bookings list
      setBookings(bookings.map(b => 
        b.id === selectedBooking.id 
          ? { ...b, paymentStatus: newStatus }
          : b
      ));
      
      setPaymentStatusModal(null);
      addNotification({ 
        message: `Payment status updated to ${newStatus === 'completed' ? 'Paid' : 'Pending'}`, 
        type: 'success' 
      });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to update payment status', 
        type: 'error' 
      });
    } finally {
      setUpdatingPaymentStatus(false);
    }
  };

  const handleCheckoutBooking = async (bookingId) => {
    if (!window.confirm('Are you sure you want to checkout this booking? This will release the room(s) back to available inventory.')) return;
    
    try {
      await adminAPI.checkoutBooking(bookingId);
      
      // Update local state
      setSelectedBooking({
        ...selectedBooking,
        bookingStatus: 'checked_out'
      });
      
      // Update bookings list
      setBookings(bookings.map(b => 
        b.id === bookingId 
          ? { ...b, bookingStatus: 'checked_out' }
          : b
      ));
      
      addNotification({ 
        message: 'Booking checked out successfully. Room availability updated.', 
        type: 'success' 
      });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to checkout booking', 
        type: 'error' 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-purple-600"></div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    const colors = {
      'confirmed': 'from-green-600 to-green-800 text-green-200',
      'pending': 'from-yellow-600 to-yellow-800 text-yellow-200',
      'cancelled': 'from-red-600 to-red-800 text-red-200',
      'checked_in': 'from-blue-600 to-blue-800 text-blue-200',
      'completed': 'from-purple-600 to-purple-800 text-purple-200'
    };
    return colors[status] || 'from-slate-600 to-slate-800 text-slate-200';
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-4xl font-bold text-white mb-2">Booking Management</h1>
            <p className="text-slate-400">Total Bookings: <span className="font-semibold text-blue-400">{bookings.length}</span></p>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-6 mb-6 border border-slate-600">
          <form onSubmit={handleSearchBooking} className="flex gap-4 items-end">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-200 mb-2">Search Booking by ID</label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter booking ID, confirmation number, or guest unique ID (e.g., HBFTVQHXJ85H)"
                className="w-full px-4 py-2 bg-slate-600 bg-opacity-50 border border-slate-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition placeholder-slate-400"
              />
            </div>
            <button
              type="submit"
              disabled={searchLoading || !searchQuery.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-600 text-white px-6 py-2 rounded-lg transition font-medium flex items-center gap-2 min-w-[120px] justify-center"
            >
              {searchLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <FiSearch className="w-4 h-4" />
                  Search
                </>
              )}
            </button>
            {searchQuery && (
              <button
                type="button"
                onClick={clearSearch}
                className="bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition"
              >
                Clear
              </button>
            )}
          </form>
        </div>

        {/* Filters */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-6 mb-6 border border-slate-600">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Status Filter</label>
              <select
                value={filters.status}
                onChange={(e) => setFilters({...filters, status: e.target.value})}
                className="w-full px-4 py-2 bg-slate-600 bg-opacity-50 border border-slate-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="all">All Bookings</option>
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="checked_in">Checked In</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-200 mb-2">Sort By</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="w-full px-4 py-2 bg-slate-600 bg-opacity-50 border border-slate-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 transition"
              >
                <option value="recent">Most Recent</option>
                <option value="upcoming">Upcoming First</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => setFilters({status: 'all', sortBy: 'recent'})}
                className="w-full bg-slate-600 hover:bg-slate-700 text-white px-4 py-2 rounded-lg transition font-medium flex items-center justify-center gap-2"
              >
                <FiFilter className="w-4 h-4" />
                Reset Filters
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Bookings List */}
          <div className="lg:col-span-2">
            <div className="space-y-4 max-h-[600px] overflow-y-auto">
              {bookings.map(booking => (
                <div
                  key={booking.id}
                  onClick={() => setSelectedBooking(booking)}
                  className={`bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-4 border-2 cursor-pointer transition transform hover:scale-102 duration-300 ${
                    selectedBooking?.id === booking.id
                      ? 'border-blue-500 shadow-lg shadow-blue-500/20'
                      : 'border-slate-600 hover:border-slate-500'
                  }`}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <p className="font-mono text-sm text-slate-400">ID: <span className="text-white font-semibold">#{booking.id}</span></p>
                      {booking.confirmationNumber && (
                        <p className="font-mono text-sm text-slate-400">Confirmation: <span className="text-green-400 font-semibold">{booking.confirmationNumber}</span></p>
                      )}
                      <p className="text-lg font-bold text-white mt-1">{booking.guestName || 'Guest'}</p>
                    </div>
                    <span className={`bg-gradient-to-r ${getStatusColor(booking.status)} px-3 py-1 rounded-full text-xs font-semibold`}>
                      {booking.status?.toUpperCase() || 'PENDING'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-slate-400 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Check-in</p>
                      <p className="text-white font-semibold">{new Date(booking.checkInDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 flex items-center gap-1"><FiCalendar className="w-3 h-3" /> Check-out</p>
                      <p className="text-white font-semibold">{new Date(booking.checkOutDate).toLocaleDateString()}</p>
                    </div>
                    <div>
                      <p className="text-slate-400 flex items-center gap-1"><FiDollarSign className="w-3 h-3" /> Total</p>
                      <p className="text-green-400 font-semibold">₹{booking.totalPrice || 0}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {bookings.length === 0 && (
              <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-12 border border-slate-600 text-center">
                <FiFilter className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">No bookings found matching your filters.</p>
              </div>
            )}
          </div>

          {/* Booking Details */}
          <div className="lg:col-span-1">
            {selectedBooking ? (
              <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-6 border border-slate-600 sticky top-8 shadow-xl">
                <div className="flex justify-between items-center mb-6 pb-4 border-b border-slate-600">
                  <h3 className="text-xl font-bold text-white">Details</h3>
                  <button onClick={() => setSelectedBooking(null)} className="text-slate-400 hover:text-white transition">
                    <FiX className="w-5 h-5" />
                  </button>
                </div>

                {/* Guest Info */}
                <div className="mb-6 pb-6 border-b border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FiUser className="w-5 h-5 text-blue-400" />
                    <p className="text-sm text-slate-400">Guest Information</p>
                  </div>
                  <p className="font-semibold text-white text-lg">{selectedBooking.guestName || 'Guest'}</p>
                  <p className="text-sm text-slate-400">{selectedBooking.guestEmail}</p>
                  <p className="text-sm text-slate-400">{selectedBooking.guestPhone}</p>
                </div>

                {/* Room Info */}
                <div className="mb-6 pb-6 border-b border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FiHome className="w-5 h-5 text-purple-400" />
                    <p className="text-sm text-slate-400">Room Information</p>
                  </div>
                  <p className="font-semibold text-white text-lg">{selectedBooking.roomType || 'Room'}</p>
                  <p className="text-sm text-slate-400">{selectedBooking.capacity || 2} guests capacity</p>
                </div>

                {/* Dates */}
                <div className="mb-6 pb-6 border-b border-slate-600">
                  <div className="flex items-center gap-2 mb-3">
                    <FiCalendar className="w-5 h-5 text-green-400" />
                    <p className="text-sm text-slate-400">Stay Duration</p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs text-slate-500">Check-in</p>
                      <p className="font-semibold text-white">{new Date(selectedBooking.checkInDate).toLocaleDateString('en-IN')}</p>
                    </div>
                    <div>
                      <p className="text-xs text-slate-500">Check-out</p>
                      <p className="font-semibold text-white">{new Date(selectedBooking.checkOutDate).toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>
                </div>

                {/* Price */}
                <div className="mb-6 pb-6 border-b border-slate-600 bg-gradient-to-r from-green-600 to-green-800 bg-opacity-20 p-3 rounded-lg">
                  <p className="text-sm text-slate-300 mb-1">Total Price</p>
                  <p className="text-3xl font-bold text-green-400">₹{selectedBooking.totalPrice || 0}</p>
                </div>

                {/* Payment Status */}
                <div className="mb-6 pb-6 border-b border-slate-600">
                  <p className="text-sm text-slate-400 mb-2">Payment Status</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-300">Status:</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        selectedBooking.paymentStatus === 'completed' 
                          ? 'bg-green-600 text-green-100' 
                          : selectedBooking.paymentStatus === 'paid'
                          ? 'bg-emerald-600 text-emerald-100'
                          : 'bg-orange-600 text-orange-100'
                      }`}>
                        {selectedBooking.paymentStatus === 'completed' ? '✓ Paid' : selectedBooking.paymentStatus === 'paid' ? '✓ Paid' : '⏳ Pending'}
                      </span>
                    </div>
                    {selectedBooking.paymentProofUrl && (
                      <div className="flex items-center justify-between pt-2 border-t border-slate-500">
                        <span className="text-slate-300">Proof:</span>
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                          <span>📎</span> Attached
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Special Requests */}
                {selectedBooking.specialRequests && (
                  <div className="mb-6 pb-6 border-b border-slate-600 bg-gradient-to-r from-yellow-600 to-orange-800 bg-opacity-20 p-3 rounded-lg">
                    <div className="flex items-start gap-2 mb-2">
                      <FiAlertCircle className="w-5 h-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium text-slate-300">Special Requests</p>
                    </div>
                    <p className="text-sm text-slate-300">{selectedBooking.specialRequests}</p>
                  </div>
                )}

                {/* Actions */}
                <div className="space-y-2">
                  <button
                    onClick={() => setPaymentStatusModal(true)}
                    className="w-full bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Update Payment Status
                  </button>
                  <button
                    onClick={() => handleCheckoutBooking(selectedBooking.id)}
                    disabled={selectedBooking.bookingStatus === 'checked_out' || selectedBooking.bookingStatus === 'cancelled'}
                    title={selectedBooking.bookingStatus === 'checked_out' ? 'Already checked out' : 'Mark as checked out and release room'}
                    className="w-full bg-gradient-to-r from-teal-600 to-green-600 hover:from-teal-700 hover:to-green-700 disabled:from-slate-600 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2 disabled:cursor-not-allowed"
                  >
                    <FiEdit3 className="w-4 h-4" />
                    Checkout
                  </button>
                  <button
                    onClick={() => handleDownloadDetails(selectedBooking.id)}
                    title="Download booking details (PDF + Payment Proof)"
                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium flex items-center justify-center gap-2"
                  >
                    <FiDownload className="w-4 h-4" />
                    Download Details
                  </button>
                  <button
                    onClick={() => handleCancelBooking(selectedBooking.id)}
                    disabled={selectedBooking.bookingStatus === 'cancelled'}
                    className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 disabled:from-slate-600 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium transform hover:scale-105 disabled:cursor-not-allowed"
                  >
                    Cancel Booking
                  </button>
                  <button
                    onClick={() => handleDeleteBooking(selectedBooking.id)}
                    disabled={selectedBooking.bookingStatus === 'checked_in' || selectedBooking.bookingStatus === 'completed'}
                    className="w-full bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 disabled:from-slate-600 disabled:to-slate-600 text-white px-4 py-2 rounded-lg transition text-sm font-medium transform hover:scale-105 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Booking
                  </button>
                </div>
              </div>
            ) : (
              <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-slate-600 text-center">
                <p className="text-slate-400">Select a booking to view details</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Status Update Modal */}
        {paymentStatusModal && selectedBooking && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-slate-600 p-8 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white">Update Payment Status</h2>
                <button
                  onClick={() => setPaymentStatusModal(null)}
                  disabled={updatingPaymentStatus}
                  className="text-slate-400 hover:text-white transition disabled:opacity-50"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-6">
                <p className="text-slate-300 mb-4">
                  Booking ID: <span className="font-semibold text-blue-400">{selectedBooking.confirmationNumber}</span>
                </p>
                <p className="text-slate-300 mb-4">
                  Current Status: <span className={`font-semibold ${
                    selectedBooking.paymentStatus === 'completed' 
                      ? 'text-green-400' 
                      : 'text-orange-400'
                  }`}>
                    {selectedBooking.paymentStatus === 'completed' ? '✓ Paid' : '⏳ Pending'}
                  </span>
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => handleUpdatePaymentStatus('completed')}
                  disabled={updatingPaymentStatus || selectedBooking.paymentStatus === 'completed'}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-600 text-white px-4 py-3 rounded-lg transition font-medium disabled:cursor-not-allowed"
                >
                  {updatingPaymentStatus ? 'Updating...' : 'Mark as Paid ✓'}
                </button>
                <button
                  onClick={() => handleUpdatePaymentStatus('pending')}
                  disabled={updatingPaymentStatus || selectedBooking.paymentStatus === 'pending'}
                  className="w-full bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 disabled:from-slate-600 disabled:to-slate-600 text-white px-4 py-3 rounded-lg transition font-medium disabled:cursor-not-allowed"
                >
                  {updatingPaymentStatus ? 'Updating...' : 'Mark as Pending ⏳'}
                </button>
                <button
                  onClick={() => setPaymentStatusModal(null)}
                  disabled={updatingPaymentStatus}
                  className="w-full bg-slate-700 hover:bg-slate-600 text-white px-4 py-3 rounded-lg transition font-medium disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}