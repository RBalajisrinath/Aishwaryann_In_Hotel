import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { guestAPI } from '../api';
import Notification from '../components/Notification';

export default function BookingForm() {
  const navigate = useNavigate();
  const { roomId } = useParams();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const user = useAuthStore((state) => state.user);
  const [room, setRoom] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    checkInDate: '',
    checkOutDate: '',
    guests: 1,
    rooms: 1,
    specialRequests: '',
  });

  useEffect(() => {
    // Redirect to login if not authenticated
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }
    
    loadRoomDetails();
  }, [roomId, user, navigate]);

  const loadRoomDetails = async () => {
    try {
      const hotels = await guestAPI.hotels.getAll();
      const allRooms = hotels.data[0]?.rooms || [];
      const selectedRoom = allRooms.find(r => r.id === parseInt(roomId));
      if (selectedRoom) {
        setRoom(selectedRoom);
      } else {
        addNotification({ message: 'Room not found', type: 'error' });
        navigate('/browse');
      }
      setLoading(false);
    } catch (error) {
      addNotification({ message: 'Failed to load room details', type: 'error' });
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'guests' || name === 'rooms' ? parseInt(value) : value,
    });
  };

  const calculateNights = () => {
    if (!formData.checkInDate || !formData.checkOutDate) return 0;
    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    return Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
  };

  const totalPrice = calculateNights() * (room?.price || 0) * formData.rooms;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.checkInDate || !formData.checkOutDate) {
      addNotification({ message: 'Please select check-in and check-out dates', type: 'error' });
      return;
    }

    const checkIn = new Date(formData.checkInDate);
    const checkOut = new Date(formData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      addNotification({ message: 'Check-in date cannot be in the past', type: 'error' });
      return;
    }

    if (checkOut <= checkIn) {
      addNotification({ message: 'Check-out date must be after check-in date', type: 'error' });
      return;
    }

    // Allow up to 6 guests for family/group bookings, but warn if exceeding room capacity
    if (formData.guests > 6) {
      addNotification({ message: 'Maximum 6 guests allowed per booking', type: 'error' });
      return;
    }

    if (formData.guests > room.capacity && formData.guests <= 3) {
      addNotification({ message: `This room can only accommodate ${room.capacity} guests`, type: 'error' });
      return;
    }

    if (formData.guests > room.capacity && formData.guests > 3) {
      // Show warning but allow booking for family/group sizes
      addNotification({ 
        message: `Note: This room is designed for ${room.capacity} guests. Additional guests may require extra arrangements.`, 
        type: 'warning' 
      });
    }

    try {
      setSubmitting(true);
      const bookingData = {
        roomId: room.id,
        checkInDate: formData.checkInDate,
        checkOutDate: formData.checkOutDate,
        guests: formData.guests,
        numberOfRooms: formData.rooms,
        specialRequests: formData.specialRequests,
      };

      const response = await guestAPI.createBooking(bookingData);
      addNotification({ message: 'Booking created successfully!', type: 'success' });
      
      // Redirect to confirmation page
      setTimeout(() => {
        navigate(`/booking-confirmation/${response.id}`);
      }, 1500);
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Failed to create booking';
      addNotification({ message: errorMessage, type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">Room not found</p>
          <button
            onClick={() => navigate('/browse')}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            Back to Browse
          </button>
        </div>
      </div>
    );
  }

  const nights = calculateNights();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <button onClick={() => navigate(-1)} className="text-blue-600 mb-4 hover:underline">
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Complete Your Booking</h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Booking Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Booking Details</h2>

              {/* Room Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-2">{room.type}</h3>
                <p className="text-sm text-gray-600">
                  Capacity: {room.capacity} guests | Size: {room.size || '25'} sq.m
                </p>
              </div>

              {/* Check-in Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-in Date *
                </label>
                <input
                  type="date"
                  name="checkInDate"
                  value={formData.checkInDate}
                  onChange={handleChange}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* Check-out Date */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Check-out Date *
                </label>
                <input
                  type="date"
                  name="checkOutDate"
                  value={formData.checkOutDate}
                  onChange={handleChange}
                  min={formData.checkInDate || new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>

              {/* Number of Guests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests *
                </label>
                <select
                  name="guests"
                  value={formData.guests}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                >
                  {Array.from({ length: Math.max(room.capacity, 3) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Guest' : 'Guests'}
                    </option>
                  ))}
                  {room.capacity >= 3 && (
                    <>
                      <option value={4}>4+ Guests (Family)</option>
                      <option value={5}>5+ Guests (Large Family)</option>
                      <option value={6}>6+ Guests (Group)</option>
                    </>
                  )}
                </select>
              </div>

              {/* Number of Rooms */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Rooms *
                </label>
                <select
                  name="rooms"
                  value={formData.rooms}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                >
                  {Array.from({ length: Math.min(room.availableRooms || 5, 10) }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} {n === 1 ? 'Room' : 'Rooms'}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {room.availableRooms ? `${room.availableRooms} rooms available` : 'Select dates to see availability'}
                </p>
              </div>

              {/* Special Requests */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests (Optional)
                </label>
                <textarea
                  name="specialRequests"
                  value={formData.specialRequests}
                  onChange={handleChange}
                  placeholder="e.g., High floor preference, late check-in, etc."
                  rows="4"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                />
              </div>

              {/* Terms */}
              <div className="mb-6">
                <label className="flex items-center">
                  <input type="checkbox" required className="w-4 h-4 text-blue-600" />
                  <span className="ml-2 text-sm text-gray-700">
                    I agree to the <button className="text-blue-600 hover:underline">terms and conditions</button>
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
              >
                {submitting ? 'Processing...' : 'Confirm Booking'}
              </button>
            </form>
          </div>

          {/* Booking Summary */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-md p-6 sticky top-4">
              <h3 className="text-xl font-bold text-gray-900 mb-6">Booking Summary</h3>

              {/* Room Details */}
              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">{room.type}</h4>
                <p className="text-sm text-gray-600 mb-2">per night</p>
                <p className="text-2xl font-bold text-blue-600">₹{room.price}</p>
              </div>

              {/* Dates */}
              {formData.checkInDate && formData.checkOutDate && (
                <div className="border-t pt-6 mb-6">
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Check-in</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(formData.checkInDate).toLocaleDateString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-gray-600 mb-1">Check-out</p>
                      <p className="font-semibold text-gray-900">
                        {new Date(formData.checkOutDate).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    <span className="font-medium">{nights}</span> night{nights !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Price Breakdown */}
              {nights > 0 && (
                <div className="border-t pt-6">
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-600">
                      ₹{room.price} × {nights} night{nights !== 1 ? 's' : ''} × {formData.rooms} room{formData.rooms !== 1 ? 's' : ''}
                    </span>
                    <span className="font-semibold">₹{nights * room.price * formData.rooms}</span>
                  </div>
                  <div className="flex justify-between mb-4">
                    <span className="text-gray-600">Taxes & Fees</span>
                    <span className="font-semibold">₹{Math.round((nights * room.price * formData.rooms) * 0.18)}</span>
                  </div>
                  <div className="border-t pt-4 flex justify-between">
                    <span className="font-bold text-lg">Total</span>
                    <span className="font-bold text-lg text-blue-600">
                      ₹{Math.round((nights * room.price * formData.rooms) + (nights * room.price * formData.rooms * 0.18))}
                    </span>
                  </div>
                </div>
              )}

              {/* Cancellation Policy */}
              <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-xs font-medium text-yellow-800 mb-1">Cancellation Policy</p>
                <p className="text-xs text-yellow-700">
                  Free cancellation up to 7 days before check-in. Otherwise charges apply.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Notification />
    </div>
  );
}
