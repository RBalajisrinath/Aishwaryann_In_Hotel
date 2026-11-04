import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import Notification from '../components/Notification';

function AdminPendingApprovals() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState(null);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingBookings();
  }, []);

  const fetchPendingBookings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingApprovals();
      setBookings(response.data.bookings);
    } catch (error) {
      console.error('Error fetching pending bookings:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to fetch pending bookings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (bookingId) => {
    if (!confirm('Are you sure you want to approve this booking?')) {
      return;
    }

    try {
      setProcessing(true);
      await adminAPI.approveBooking(bookingId, { adminNotes });
      
      setNotification({
        type: 'success',
        message: 'Booking approved successfully!'
      });
      
      // Refresh list
      fetchPendingBookings();
      setAdminNotes('');
    } catch (error) {
      console.error('Error approving booking:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to approve booking'
      });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setNotification({
        type: 'error',
        message: 'Rejection reason is required'
      });
      return;
    }

    try {
      setProcessing(true);
      await adminAPI.rejectBooking(showRejectModal, {
        rejectionReason,
        adminNotes
      });
      
      setNotification({
        type: 'success',
        message: 'Booking rejected successfully'
      });
      
      // Close modal and refresh
      setShowRejectModal(null);
      setRejectionReason('');
      setAdminNotes('');
      fetchPendingBookings();
    } catch (error) {
      console.error('Error rejecting booking:', error);
      setNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to reject booking'
      });
    } finally {
      setProcessing(false);
    }
  };

  const openPaymentProof = (url) => {
    window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <BackButton />
        
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Pending Approvals</h1>
            <p className="text-gray-600 mt-1">
              Review and approve bookings with payment proofs
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-lg font-semibold">
              {bookings.length} Pending
            </div>
            <button
              onClick={fetchPendingBookings}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition"
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {notification && (
          <Notification
            type={notification.type}
            message={notification.message}
            onClose={() => setNotification(null)}
          />
        )}

        {bookings.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-gray-400 text-6xl mb-4">✓</div>
            <h2 className="text-2xl font-semibold text-gray-700 mb-2">
              All caught up!
            </h2>
            <p className="text-gray-600">
              No pending booking approvals at the moment.
            </p>
          </div>
        ) : (
          <div className="grid gap-6">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white rounded-lg shadow-lg p-6 hover:shadow-xl transition"
              >
                <div className="grid md:grid-cols-3 gap-6">
                  {/* Left: Booking Details */}
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Booking Details
                    </h3>
                    <div className="space-y-2 text-sm">
                      <div>
                        <span className="text-gray-600">Confirmation:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {booking.confirmationNumber}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Guest:</span>
                        <span className="font-semibold text-gray-900 ml-2">
                          {booking.guestName}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Email:</span>
                        <span className="text-gray-700 ml-2">{booking.guestEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Phone:</span>
                        <span className="text-gray-700 ml-2">{booking.guestPhone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Room Type:</span>
                        <span className="text-gray-700 ml-2">{booking.roomType}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Number of Rooms:</span>
                        <span className="font-bold text-indigo-600 ml-2">
                          {booking.numberOfRooms || 1} {(booking.numberOfRooms || 1) > 1 ? 'rooms' : 'room'}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Check-in:</span>
                        <span className="text-gray-700 ml-2">
                          {new Date(booking.checkInDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Check-out:</span>
                        <span className="text-gray-700 ml-2">
                          {new Date(booking.checkOutDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-2">
                        <p className="text-sm font-semibold text-gray-800 mb-2">Guests Breakdown:</p>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">👤 Adults:</span>
                            <span className="font-bold text-gray-900">{booking.numberOfAdults || 1}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">👶 Children:</span>
                            <span className="font-bold text-gray-900">{booking.numberOfChildren || 0}</span>
                          </div>
                          <div className="flex justify-between pt-2 border-t border-blue-200">
                            <span className="text-gray-700 font-semibold">Total Guests:</span>
                            <span className="font-bold text-blue-600">{(booking.numberOfAdults || 1) + (booking.numberOfChildren || 0)}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Middle: Payment Details */}
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      Payment Details
                    </h3>
                    <div className="space-y-3 text-sm">
                      {/* Payment Type Badge */}
                      <div className="flex items-center justify-between pb-2 border-b border-gray-200">
                        <span className="text-gray-600 font-medium">Payment Type:</span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                          booking.paymentType === 'full' 
                            ? 'bg-green-100 text-green-700 border border-green-300' 
                            : 'bg-blue-100 text-blue-700 border border-blue-300'
                        }`}>
                          {booking.paymentType === 'full' ? '✓ Full Payment' : '◐ Partial Payment'}
                        </span>
                      </div>

                      {/* Amount Breakdown */}
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-3 rounded-lg border border-green-200">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-gray-600">Total Booking Amount:</span>
                          <span className="font-bold text-gray-900 text-lg">₹{booking.totalPrice?.toLocaleString() || 0}</span>
                        </div>
                        <div className="flex items-center justify-between pt-2 border-t border-green-200">
                          <span className="text-green-700 font-medium">Amount Paid Now:</span>
                          <span className="font-bold text-green-600 text-lg">
                            ₹{booking.amountPaid?.toLocaleString() || booking.totalPrice?.toLocaleString() || 0}
                          </span>
                        </div>
                        {booking.paymentType === 'partial' && booking.remainingAmount > 0 && (
                          <div className="flex items-center justify-between mt-2 pt-2 border-t border-green-200">
                            <span className="text-orange-700 font-medium">Balance Due at Hotel:</span>
                            <span className="font-bold text-orange-600 text-lg">
                              ₹{booking.remainingAmount?.toLocaleString() || 0}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Transaction Details */}
                      <div className="space-y-2 pt-2">
                        <div>
                          <span className="text-gray-600 block mb-1">Transaction ID:</span>
                          <span className="font-mono text-gray-900 text-xs bg-gray-100 px-3 py-2 rounded block break-all">
                            {booking.transactionId}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 block mb-1">Payment To:</span>
                          <div className="bg-gray-50 p-2 rounded space-y-1">
                            <div className="font-mono text-xs text-gray-800">📱 {booking.paymentPhoneNumber}</div>
                            <div className="font-mono text-xs text-gray-800">💳 {booking.paymentUpiId}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-500 pt-2 border-t border-gray-100">
                          <span className="block">Submitted: {new Date(booking.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right: Payment Proof & Actions */}
                  <div className="md:col-span-1">
                    <h3 className="text-lg font-bold text-gray-900 mb-3">
                      Payment Proof
                    </h3>
                    {booking.paymentProofUrl ? (
                      <div className="space-y-3">
                        <img
                          src={booking.paymentProofUrl}
                          alt="Payment Proof"
                          className="w-full h-48 object-contain bg-gray-100 rounded-lg border border-gray-300 cursor-pointer hover:border-blue-500 transition"
                          onClick={() => openPaymentProof(booking.paymentProofUrl)}
                          title="Click to view full size"
                        />
                        <button
                          onClick={() => openPaymentProof(booking.paymentProofUrl)}
                          className="w-full bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition text-sm"
                        >
                          🔍 View Full Size
                        </button>
                      </div>
                    ) : (
                      <div className="bg-gray-100 h-48 rounded-lg flex items-center justify-center text-gray-400">
                        No image available
                      </div>
                    )}

                    {/* Admin Notes */}
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Admin Notes (Optional)
                      </label>
                      <textarea
                        value={adminNotes}
                        onChange={(e) => setAdminNotes(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        rows="2"
                        placeholder="Add any notes..."
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex space-x-2">
                      <button
                        onClick={() => handleApprove(booking.id)}
                        disabled={processing}
                        className="flex-1 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        ✓ Approve
                      </button>
                      <button
                        onClick={() => setShowRejectModal(booking.id)}
                        disabled={processing}
                        className="flex-1 bg-red-600 text-white px-4 py-3 rounded-lg hover:bg-red-700 transition font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        ✗ Reject
                      </button>
                    </div>

                    {booking.specialRequests && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                        <span className="text-xs font-semibold text-blue-700">Special Requests:</span>
                        <p className="text-sm text-blue-800 mt-1">{booking.specialRequests}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Rejection Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                Reject Booking
              </h2>
              <p className="text-gray-600 mb-4">
                Please provide a reason for rejecting this booking. The guest will receive this message.
              </p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rejection Reason *
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="3"
                    placeholder="e.g., Payment proof unclear, transaction ID mismatch..."
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Admin Notes (Optional)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                    rows="2"
                    placeholder="Internal notes..."
                  />
                </div>
              </div>
              <div className="mt-6 flex space-x-3">
                <button
                  onClick={() => {
                    setShowRejectModal(null);
                    setRejectionReason('');
                    setAdminNotes('');
                  }}
                  disabled={processing}
                  className="flex-1 bg-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-400 transition disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={processing || !rejectionReason.trim()}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {processing ? 'Rejecting...' : 'Confirm Reject'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminPendingApprovals;
