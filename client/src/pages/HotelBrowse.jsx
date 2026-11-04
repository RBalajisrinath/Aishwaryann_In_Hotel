import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { guestAPI } from '../api';
import Notification from '../components/Notification';

export default function HotelBrowse() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const user = useAuthStore((state) => state.user);
  const [hotel, setHotel] = useState(null);
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPrice: 0,
    maxPrice: 10000,
    capacity: 1,
  });
  const [sortBy, setSortBy] = useState('price');

  useEffect(() => {
    loadHotel();
  }, []);

  const handleBookRoom = (roomId) => {
    if (!user) {
      // Save the room ID to redirect after login
      localStorage.setItem('redirectAfterLogin', `/book/${roomId}`);
      navigate('/login');
      return;
    }
    navigate(`/book/${roomId}`);
  };

  const loadHotel = async () => {
    try {
      const response = await guestAPI.hotels.getAll();
      const hotelData = response.data?.[0]; // Get Aishwaryam Inn
      if (hotelData) {
        setHotel(hotelData);
        setRooms(hotelData.rooms || []);
      }
      setLoading(false);
    } catch (error) {
      console.error('Failed to load hotel:', error);
      addNotification({ 
        message: error.response?.data?.message || 'Failed to load hotel details', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const filteredRooms = rooms
    .filter(room => 
      room.price >= filters.minPrice && 
      room.price <= filters.maxPrice && 
      room.capacity >= filters.capacity
    )
    .sort((a, b) => {
      if (sortBy === 'price') return a.price - b.price;
      if (sortBy === 'capacity') return b.capacity - a.capacity;
      return 0;
    });

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
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 py-12">
          <button onClick={() => navigate(-1)} className="text-white mb-4 hover:underline">
            ← Back
          </button>
          <h1 className="text-4xl font-bold">{hotel?.name}</h1>
          <p className="text-blue-100 mt-2">{hotel?.location}</p>
          <p className="text-blue-100 mt-2">{hotel?.description}</p>
          <div className="flex gap-4 mt-4">
            {hotel?.amenities?.map(amenity => (
              <span key={amenity} className="bg-blue-700 px-3 py-1 rounded-full text-sm">
                {amenity}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <span className="text-2xl font-bold">⭐ {hotel?.rating}</span>
            <span className="text-blue-100 ml-2">({hotel?.reviewCount} reviews)</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow p-6 sticky top-4">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Filters</h2>
              
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Range: ₹{filters.minPrice} - ₹{filters.maxPrice}
                </label>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters({...filters, maxPrice: parseInt(e.target.value)})}
                  className="w-full"
                />
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Number of Guests: {filters.capacity}
                </label>
                <select
                  value={filters.capacity}
                  onChange={(e) => setFilters({...filters, capacity: parseInt(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  {[1, 2, 3, 4, 5, 6].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">Sort By</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                >
                  <option value="price">Price: Low to High</option>
                  <option value="capacity">Capacity: High to Low</option>
                </select>
              </div>

              <button
                onClick={() => setFilters({minPrice: 0, maxPrice: 10000, capacity: 1})}
                className="w-full bg-gray-300 text-gray-800 px-4 py-2 rounded hover:bg-gray-400 transition"
              >
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Rooms Grid */}
          <section className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Available Rooms</h2>
              <span className="text-gray-600">Showing {filteredRooms.length} of {rooms.length} rooms</span>
            </div>

            {filteredRooms.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {filteredRooms.map(room => (
                  <div key={room.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition">
                    {/* Room Image */}
                    <div className="w-full h-48 relative">
                      {room.imageUrl ? (
                        <img 
                          src={room.imageUrl} 
                          alt={`${room.type} room`}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center absolute top-0 left-0 ${room.imageUrl ? 'hidden' : ''}`}>
                        <span className="text-white text-4xl">🏨</span>
                      </div>
                    </div>

                    {/* Room Content */}
                    <div className="p-6">
                      <div className="flex justify-between items-start mb-2">
                        <h3 className="text-xl font-bold text-gray-900">{room.type}</h3>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                          room.available 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {room.available ? 'Available' : 'Booked'}
                        </span>
                      </div>

                      <div className="space-y-2 mb-4">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Capacity:</span> {room.capacity} {room.capacity === 1 ? 'guest' : 'guests'}
                        </p>
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Size:</span> {room.size || '25'} sq.m
                        </p>
                      </div>

                      {/* Amenities */}
                      <div className="mb-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Amenities:</p>
                        <div className="flex flex-wrap gap-2">
                          {room.amenities?.map(amenity => (
                            <span key={amenity} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Price */}
                      <div className="mb-4 pt-4 border-t">
                        <p className="text-2xl font-bold text-blue-600">₹{room.price}/night</p>
                      </div>

                      {/* Actions */}
                      <button
                        onClick={() => handleBookRoom(room.id)}
                        disabled={!room.available}
                        className={`w-full py-2 rounded font-medium transition ${
                          room.available
                            ? 'bg-blue-600 text-white hover:bg-blue-700'
                            : 'bg-gray-300 text-gray-600 cursor-not-allowed'
                        }`}
                      >
                        {room.available ? 'Book Now' : 'Unavailable'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-8 text-center">
                <p className="text-yellow-800 text-lg">
                  No rooms found matching your filters. Try adjusting your search.
                </p>
              </div>
            )}
          </section>
        </div>
      </main>

      <Notification />
    </div>
  );
}
