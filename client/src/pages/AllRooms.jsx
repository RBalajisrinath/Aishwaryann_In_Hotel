import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { hotelAPI } from '../api';
import { FiWifi, FiMonitor, FiWind, FiCoffee, FiDroplet, FiSmartphone, FiAlertCircle, FiSearch } from 'react-icons/fi';

const amenityIcons = {
  'WiFi': <FiWifi className="w-5 h-5" />,
  'TV': <FiMonitor className="w-5 h-5" />,
  'AC': <FiWind className="w-5 h-5" />,
  'Coffee Maker': <FiCoffee className="w-5 h-5" />,
  'Hot Shower': <FiDroplet className="w-5 h-5" />,
  'Smart Lock': <FiSmartphone className="w-5 h-5" />
};

export default function AllRooms() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [rooms, setRooms] = useState([]);
  const [filteredRooms, setFilteredRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');

  // Helper function to safely parse amenities
  const parseAmenities = (amenities) => {
    if (!amenities) return [];
    if (Array.isArray(amenities)) return amenities;
    try {
      const parsed = JSON.parse(amenities);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error('Failed to parse amenities:', e);
      return [];
    }
  };
  const [checkInDate, setCheckInDate] = useState('');
  const [checkOutDate, setCheckOutDate] = useState('');

  useEffect(() => {
    fetchRooms();
  }, []);

  // Re-fetch when dates change
  useEffect(() => {
    if (checkInDate && checkOutDate) {
      fetchRooms();
    }
  }, [checkInDate, checkOutDate]);

  useEffect(() => {
    applyFilters();
  }, [rooms, searchTerm]);

  const fetchRooms = async () => {
    try {
      setLoading(true);
      let response;

      // If dates are selected, use search API to check availability
      if (checkInDate && checkOutDate) {
        console.log(`Searching rooms for ${checkInDate} to ${checkOutDate}`);
        response = await hotelAPI.search({ 
          checkIn: checkInDate, 
          checkOut: checkOutDate
        });
      } else {
        // Otherwise, get all rooms
        response = await hotelAPI.getAll();
      }
      
      // Extract all rooms from all hotels
      if (response.data && Array.isArray(response.data)) {
        let allRooms = [];
        response.data.forEach(hotel => {
          // Normalize available rooms: the server may return a numeric count (legacy) or an array
          let roomsArray = hotel.availableRooms;
          if (Array.isArray(roomsArray)) {
            // OK
          } else if (typeof roomsArray === 'number') {
            // Legacy numeric count - treat as empty array (no details available)
            roomsArray = [];
          } else {
            roomsArray = hotel.rooms || [];
          }

          if (Array.isArray(roomsArray)) {
            allRooms.push(...roomsArray);
          }
        });
        console.log('Fetched rooms:', allRooms);
        
        // Debug: Check image URLs
        allRooms.forEach((room, index) => {
          console.log(`Room ${index + 1} (${room.type}):`, {
            id: room.id,
            hasImageUrl: !!room.imageUrl,
            imageUrlLength: room.imageUrl?.length || 0,
            imageUrl: room.imageUrl?.substring(0, 50) + (room.imageUrl?.length > 50 ? '...' : '')
          });
        });
        
        setRooms(allRooms);
        setFilteredRooms(allRooms);
      }
    } catch (err) {
      console.error('Error fetching rooms:', err);
      setError('Failed to load rooms. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = rooms;

    // No price/capacity filters (removed per request)

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(room =>
        (room.type || room.roomType || '').toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredRooms(filtered);
  };

  const handleBookRoom = (room) => {
    console.log('Book Now clicked for room:', room);
    
    // Check if dates are selected
    if (!checkInDate || !checkOutDate) {
      addNotification({ 
        message: 'Please select check-in and check-out dates first to book a room', 
        type: 'warning' 
      });
      return;
    }
    
    setSelectedRoom(room);
    setShowBookingModal(true);
  };

  const handleQuickBook = (room) => {
    // Check if dates are selected
    if (!checkInDate || !checkOutDate) {
      addNotification({ 
        message: 'Please select check-in and check-out dates first to book a room', 
        type: 'warning' 
      });
      return;
    }
    
    // Direct booking without modal - goes to guest booking with OTP
    const dateParams = `?checkIn=${checkInDate}&checkOut=${checkOutDate}`;
    navigate(`/book/${room.id}${dateParams}`);
  };

  const handleProceedToBooking = () => {
    console.log('Proceed to booking clicked');
    console.log('Selected room:', selectedRoom);
    console.log('Dates:', checkInDate, checkOutDate);
    
    if (!selectedRoom) return;
    
    // Dates are already validated before opening modal
    const dateParams = `?checkIn=${checkInDate}&checkOut=${checkOutDate}`;
    
    console.log('Navigating to:', `/book/${selectedRoom.id}${dateParams}`);
    
    // Always go to guest booking page (with OTP verification)
    navigate(`/book/${selectedRoom.id}${dateParams}`);
    
    // Close modal after navigating
    setShowBookingModal(false);
  };

  const resetFilters = () => {
    setSearchTerm('');
    setCheckInDate('');
    setCheckOutDate('');
  };

  const handleViewDetails = (room) => {
    setSelectedRoom(room);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRoom(null);
  };

  const closeBookingModal = () => {
    setShowBookingModal(false);
  };

  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-4xl font-bold mb-3">All Rooms at Aishwaryam Inn</h1>
          <p className="text-blue-100 text-lg">Browse our complete collection of {rooms.length} premium rooms</p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg p-6 sticky top-20">
              <h3 className="text-xl font-bold text-gray-800 mb-6">Filters</h3>

              {/* Search */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Search Room</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search by type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                  <FiSearch className="absolute left-3 top-2.5 text-gray-400" />
                </div>
              </div>

              {/* Check-in Date */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-in <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={checkInDate}
                  onChange={(e) => setCheckInDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  min={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Check-out Date */}
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Check-out <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={checkOutDate}
                  onChange={(e) => setCheckOutDate(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-blue-600"
                  min={checkInDate || new Date().toISOString().split('T')[0]}
                  required
                />
              </div>

              {/* Date Selection Required Notice */}
              {(!checkInDate || !checkOutDate) && (
                <div className="mb-6 bg-yellow-50 border border-yellow-300 rounded-lg p-3">
                  <p className="text-yellow-800 text-xs font-medium">
                    ⚠️ Please select dates to book a room
                  </p>
                </div>
              )}

              {/* (Max Price & Min Capacity filters removed) */}

              {/* Reset Button */}
              <button
                onClick={resetFilters}
                className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition"
              >
                Reset Filters
              </button>

              {/* Results Count */}
              <div className="mt-6 p-3 bg-blue-50 rounded-lg text-sm text-blue-800">
                <p className="font-semibold">Results: {filteredRooms.length} room{filteredRooms.length !== 1 ? 's' : ''}</p>
              </div>

              {/* Selected Dates Info */}
              {checkInDate && checkOutDate && (
                <div className="mt-4 p-3 bg-green-50 rounded-lg text-sm text-green-800">
                  <p className="font-semibold">📅 Dates Selected:</p>
                  <p className="mt-1">Check-in: {new Date(checkInDate).toLocaleDateString('en-IN')}</p>
                  <p>Check-out: {new Date(checkOutDate).toLocaleDateString('en-IN')}</p>
                  <p className="mt-2 text-xs">
                    {Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))} nights
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Rooms Grid */}
          <div className="lg:col-span-3">
            {/* Date Requirement Banner */}
            {(!checkInDate || !checkOutDate) && !loading && (
              <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-l-4 border-yellow-500 rounded-lg p-4 mb-6 shadow-md">
                <div className="flex items-start gap-3">
                  <FiAlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-yellow-800 mb-1">Dates Required to Book</h4>
                    <p className="text-yellow-700 text-sm">
                      Please select check-in and check-out dates from the filter panel on the left to proceed with booking. 
                      Only rooms available for your selected dates will be shown.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Date Confirmation Banner */}
            {checkInDate && checkOutDate && !loading && (
              <div className="bg-gradient-to-r from-green-50 to-teal-50 border-l-4 border-green-500 rounded-lg p-4 mb-6 shadow-md">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">✅</div>
                  <div>
                    <h4 className="font-bold text-green-800 mb-1">Ready to Book!</h4>
                    <p className="text-green-700 text-sm">
                      Showing available rooms from <strong>{new Date(checkInDate).toLocaleDateString('en-IN')}</strong> to <strong>{new Date(checkOutDate).toLocaleDateString('en-IN')}</strong> 
                      ({Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))} nights)
                    </p>
                  </div>
                </div>
              </div>
            )}

            {loading && (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 text-lg">Loading all rooms...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <FiAlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-800">Error</h4>
                  <p className="text-red-700">{error}</p>
                  <button
                    onClick={fetchRooms}
                    className="mt-2 text-sm underline text-red-600 hover:text-red-800"
                  >
                    Try again
                  </button>
                </div>
              </div>
            )}

            {!loading && filteredRooms.length === 0 && !error && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <p className="text-yellow-800 text-lg">No rooms match your filters.</p>
                <button
                  onClick={resetFilters}
                  className="mt-3 text-blue-600 hover:text-blue-800 underline"
                >
                  Reset filters to see all rooms
                </button>
              </div>
            )}

            {!loading && filteredRooms.length > 0 && (
              <div className="space-y-6">
                {filteredRooms.map((room, idx) => (
                  <div
                    key={room.id}
                    className="bg-white/95 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden hover-lift card-stagger"
                    style={{ 
                      animationDelay: `${idx * 0.2}s`,
                      opacity: 0
                    }}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-0">
                      {/* Room Image - Left Side */}
                      <div className="md:col-span-1 h-64 md:h-auto">
                        {room.imageUrl ? (
                          <img 
                            src={room.imageUrl} 
                            alt={`${room.type || room.roomType} room`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-8xl ${room.imageUrl ? 'hidden' : ''}`}>
                          🛏️
                        </div>
                      </div>

                      {/* Room Info - Right Side */}
                      <div className="md:col-span-2 p-6 flex flex-col">
                        {/* Header with title and price */}
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h4 className="text-2xl font-bold text-gray-800">{room.type || room.roomType}</h4>
                          </div>
                          <div className="text-right">
                            <p className="text-3xl font-bold text-blue-600">₹{room.pricePerNight || room.price}</p>
                            <p className="text-sm text-gray-600">per night</p>
                          </div>
                        </div>

                        {/* Features Section */}
                        {room.amenities && (
                          <div className="mb-4">
                            <p className="text-sm font-semibold text-gray-700 mb-2">Features</p>
                            <div className="flex flex-wrap gap-2">
                              {parseAmenities(room.amenities).slice(0, 4).map((amenity, idx) => (
                                <span key={idx} className="text-xs bg-gray-100 text-gray-700 px-3 py-1 rounded">
                                  {amenity}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Facilities Section */}
                        <div className="mb-6">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Facilities</p>
                          <div className="flex flex-wrap gap-2">
                            {room.amenities && parseAmenities(room.amenities).slice(0, 4).map((amenity, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-1 text-gray-600 text-sm"
                              >
                                {amenityIcons[amenity] || <FiWifi className="w-4 h-4" />}
                                <span>{amenity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Buttons */}
                        <div className="flex gap-3 mt-auto">
                          <button
                            onClick={() => handleBookRoom(room)}
                            className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-2 rounded-lg font-semibold transition"
                          >
                            Book Now
                          </button>
                          <button
                            onClick={() => handleViewDetails(room)}
                            className="flex-1 border-2 border-gray-300 hover:bg-gray-50 text-gray-700 py-2 rounded-lg font-semibold transition"
                          >
                            More details
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Room Details Modal */}
        {showDetailsModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
                <h2 className="text-2xl font-bold text-gray-800">{selectedRoom.type || selectedRoom.roomType}</h2>
                <button onClick={closeDetailsModal} className="text-gray-500 hover:text-gray-700 text-3xl">✕</button>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-1">Room Type</p>
                    <p className="text-gray-800 font-bold text-lg">{selectedRoom.type || selectedRoom.roomType}</p>
                  </div>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-1">Capacity</p>
                    <p className="text-gray-800 font-bold text-lg">{selectedRoom.capacity} Guests</p>
                  </div>
                  <div className="bg-orange-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-1">Price per Night</p>
                    <p className="text-gray-800 font-bold text-lg">₹{selectedRoom.pricePerNight || selectedRoom.price}</p>
                  </div>
                  <div className="bg-indigo-50 p-4 rounded-lg">
                    <p className="text-gray-600 text-sm font-semibold mb-1">Size</p>
                    <p className="text-gray-800 font-bold text-lg">{selectedRoom.size || 'N/A'} sq.m</p>
                  </div>
                </div>

                {selectedRoom.amenities && (
                  <div className="mb-6">
                    <h4 className="font-bold text-gray-800 mb-3">✨ Amenities & Features</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {parseAmenities(selectedRoom.amenities).map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-blue-50 text-gray-700 px-4 py-3 rounded-lg">
                          <span className="text-blue-600">✓</span>
                          <span className="font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <h4 className="font-bold text-gray-800 mb-3">📋 Room Information</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li><span className="text-blue-600">•</span> Type: <span className="font-semibold text-gray-800">{selectedRoom.type || selectedRoom.roomType}</span></li>
                    <li><span className="text-blue-600">•</span> Capacity: <span className="font-semibold text-gray-800">{selectedRoom.capacity} guests</span></li>
                    <li><span className="text-blue-600">•</span> Size: <span className="font-semibold text-gray-800">{selectedRoom.size || 'Not specified'} sq.m</span></li>
                    <li><span className="text-blue-600">•</span> Rate: <span className="font-semibold text-gray-800">₹{selectedRoom.pricePerNight || selectedRoom.price}/night</span></li>
                    <li><span className="text-blue-600">•</span> Total Amenities: <span className="font-semibold text-gray-800">{parseAmenities(selectedRoom.amenities).length}</span></li>
                  </ul>
                </div>

                {/* Extra Charges Section */}
                <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                  <h4 className="font-bold text-gray-800 mb-3">💰 Extra Charges</h4>
                  <ul className="text-sm text-gray-700 space-y-2">
                    <li className="flex justify-between">
                      <span><span className="text-orange-600">•</span> Per Adult Person:</span>
                      <span className="font-semibold text-orange-600">₹300</span>
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      closeDetailsModal();
                      handleBookRoom(selectedRoom);
                    }}
                    className="flex-1 bg-teal-500 hover:bg-teal-600 text-white py-3 rounded-lg font-bold transition"
                  >
                    🎉 Book This Room Now
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Booking Confirmation Modal */}
        {showBookingModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-teal-500 to-teal-600">
                <h2 className="text-2xl font-bold text-white">Confirm Booking</h2>
                <button onClick={closeBookingModal} className="text-white hover:text-gray-200 text-3xl">✕</button>
              </div>
              <div className="p-6">
                {/* Room Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Room Details</h3>
                  <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Room Type:</span>
                      <span className="font-semibold text-gray-800">{selectedRoom.type || selectedRoom.roomType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Capacity:</span>
                      <span className="font-semibold text-gray-800">{selectedRoom.capacity} Guests</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Price per Night:</span>
                      <span className="font-semibold text-teal-600">₹{selectedRoom.pricePerNight || selectedRoom.price}</span>
                    </div>
                  </div>
                </div>

                {/* Date Summary */}
                <div className="mb-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-4">Booking Dates</h3>
                  <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-in:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(checkInDate).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Check-out:</span>
                      <span className="font-semibold text-gray-800">
                        {new Date(checkOutDate).toLocaleDateString('en-IN', { 
                          weekday: 'short', 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-600">Total Nights:</span>
                      <span className="font-bold text-gray-800">
                        {Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))} nights
                      </span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-blue-200">
                      <span className="text-gray-700 font-semibold">Total Amount:</span>
                      <span className="font-bold text-teal-600 text-xl">
                        ₹{(selectedRoom.pricePerNight || selectedRoom.price) * 
                          Math.ceil((new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <button
                    onClick={closeBookingModal}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 rounded-lg font-semibold transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleProceedToBooking}
                    className="flex-1 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white py-3 rounded-lg font-bold transition shadow-lg hover:shadow-xl"
                  >
                    Proceed to Book
                  </button>
                </div>

                <p className="text-center text-xs text-gray-600 mt-3">
                  ⚡ Quick OTP verification • No login required
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
