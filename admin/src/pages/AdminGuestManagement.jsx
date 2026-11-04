import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiUser, FiMail, FiPhone, FiMapPin, FiCalendar, FiArrowLeft, FiSearch } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminGuestManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [guests, setGuests] = useState([]);
  const [selectedGuest, setSelectedGuest] = useState(null);
  const [guestBookings, setGuestBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.get('/admin/guests');
      setGuests(response.data || []);
    } catch (error) {
      addNotification({
        message: error.response?.data?.message || 'Failed to load guests',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGuest = async (guest) => {
    try {
      setSelectedGuest(guest);
      const response = await adminAPI.get(`/admin/guests/${guest.uniqueId}`);
      setGuestBookings(response.data.bookings || []);
    } catch (error) {
      addNotification({
        message: 'Failed to load guest details',
        type: 'error'
      });
    }
  };

  const filteredGuests = guests.filter(guest =>
    guest.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    guest.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (guest.phone && guest.phone.includes(searchTerm))
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-purple-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="flex justify-between items-center mt-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-3">Guest Management</h1>
              <p className="text-slate-400">View and manage guest profiles and booking history</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Guests List */}
          <div className="lg:col-span-1 bg-slate-800 rounded-xl shadow-xl overflow-hidden border border-slate-700">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-4">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FiUser className="w-5 h-5" />
                Guests ({filteredGuests.length})
              </h2>
            </div>

            {/* Search */}
            <div className="p-4 border-b border-slate-700">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-slate-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by name, email, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Guests List */}
            <div className="max-h-[600px] overflow-y-auto">
              {filteredGuests.length === 0 ? (
                <div className="p-8 text-center text-slate-400">
                  No guests found
                </div>
              ) : (
                filteredGuests.map((guest) => (
                  <button
                    key={guest.id}
                    onClick={() => handleSelectGuest(guest)}
                    className={`w-full p-4 border-b border-slate-700 text-left hover:bg-slate-700 transition ${
                      selectedGuest?.id === guest.id ? 'bg-slate-700 border-l-4 border-l-blue-500' : ''
                    }`}
                  >
                    <p className="font-semibold text-white">{guest.name}</p>
                    <p className="text-sm text-slate-400">{guest.email}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {guest.totalBookings || 0} booking{guest.totalBookings !== 1 ? 's' : ''}
                    </p>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Guest Details */}
          <div className="lg:col-span-2">
            {selectedGuest ? (
              <div className="space-y-6">
                {/* Profile Card */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 flex items-center gap-4">
                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                      <FiUser className="w-8 h-8 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-white">{selectedGuest.name}</h3>
                      <p className="text-blue-100">ID: {selectedGuest.uniqueId}</p>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Contact Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <FiMail className="w-4 h-4" />
                          <span className="text-sm font-semibold">Email</span>
                        </div>
                        <p className="text-white break-all">{selectedGuest.email}</p>
                      </div>

                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <FiPhone className="w-4 h-4" />
                          <span className="text-sm font-semibold">Phone</span>
                        </div>
                        <p className="text-white">{selectedGuest.phone || 'Not provided'}</p>
                      </div>
                    </div>

                    {/* Address */}
                    {selectedGuest.address && (
                      <div className="bg-slate-700 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-slate-400 mb-2">
                          <FiMapPin className="w-4 h-4" />
                          <span className="text-sm font-semibold">Address</span>
                        </div>
                        <p className="text-white">{selectedGuest.address}</p>
                      </div>
                    )}

                    {/* ID Proof */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {selectedGuest.idProofType && (
                        <div className="bg-slate-700 rounded-lg p-4">
                          <p className="text-slate-400 text-sm font-semibold mb-1">ID Proof Type</p>
                          <p className="text-white">{selectedGuest.idProofType}</p>
                        </div>
                      )}
                      {selectedGuest.idProofNumber && (
                        <div className="bg-slate-700 rounded-lg p-4">
                          <p className="text-slate-400 text-sm font-semibold mb-1">ID Number</p>
                          <p className="text-white">{selectedGuest.idProofNumber}</p>
                        </div>
                      )}
                    </div>

                    {/* Member Since */}
                    <div className="bg-slate-700 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-slate-400 mb-2">
                        <FiCalendar className="w-4 h-4" />
                        <span className="text-sm font-semibold">Member Since</span>
                      </div>
                      <p className="text-white">
                        {new Date(selectedGuest.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Booking History */}
                <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl shadow-xl border border-slate-700 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-600 to-emerald-600 p-4">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <FiCalendar className="w-5 h-5" />
                      Booking History ({guestBookings.length})
                    </h3>
                  </div>

                  {guestBookings.length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      No bookings yet
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-slate-700 bg-slate-700">
                            <th className="px-4 py-3 text-left font-semibold text-white">Booking ID</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Room Type</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Check-In</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Check-Out</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Total Price</th>
                            <th className="px-4 py-3 text-left font-semibold text-white">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {guestBookings.map((booking) => (
                            <tr key={booking.id} className="border-b border-slate-700 hover:bg-slate-700 transition">
                              <td className="px-4 py-3 text-white font-mono text-xs">{booking.bookingId}</td>
                              <td className="px-4 py-3 text-white">{booking.roomType}</td>
                              <td className="px-4 py-3 text-slate-300">
                                {new Date(booking.checkInDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-slate-300">
                                {new Date(booking.checkOutDate).toLocaleDateString()}
                              </td>
                              <td className="px-4 py-3 text-green-400 font-semibold">₹{booking.totalPrice}</td>
                              <td className="px-4 py-3">
                                <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                                  booking.bookingStatus === 'confirmed' ? 'bg-green-900 text-green-200' :
                                  booking.bookingStatus === 'checked-in' ? 'bg-blue-900 text-blue-200' :
                                  booking.bookingStatus === 'cancelled' ? 'bg-red-900 text-red-200' :
                                  'bg-yellow-900 text-yellow-200'
                                }`}>
                                  {booking.bookingStatus}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="bg-slate-800 rounded-xl shadow-xl border border-slate-700 p-12 text-center">
                <FiUser className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                <p className="text-slate-400 text-lg">Select a guest to view details</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
