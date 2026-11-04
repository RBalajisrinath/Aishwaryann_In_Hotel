import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { hotelAPI, adminAPI } from "../api";
import { FiChevronLeft, FiChevronRight, FiCheckCircle, FiMapPin, FiUsers, FiMaximize2 } from "react-icons/fi";
import Modal from "../components/Modal";
import { onEvent, offEvent } from "../socket";

export default function HomePage() {
  const navigate = useNavigate();
  const [rooms, setRooms] = useState([]);
  const [yearCards, setYearCards] = useState([]);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [heroData, setHeroData] = useState(null);
  const [videoError, setVideoError] = useState(false);

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

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      setCurrentCardIndex(prev => (prev + 1) % Math.max(yearCards.length, 1));
    }, 5000);

    // Listen for hero content updates from admin
    onEvent('heroContentUpdated', (data) => {
      console.log('📡 Received heroContentUpdated event:', data);
      if (data && data.data) {
        setHeroData(data.data);
        setVideoError(false);
      }
    });

    // Listen for ANY admin updates (generic broadcast)
    onEvent('adminUpdate', (data) => {
      console.log('📡 Received adminUpdate event:', data);
      // Refresh all data when any admin change is made
      if (data.path.includes('/site-content') || data.path.includes('/admin')) {
        fetchData();
      }
    });

    return () => {
      clearInterval(interval);
      offEvent('heroContentUpdated');
      offEvent('adminUpdate');
    };
  }, [yearCards.length]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch hero/background data
      try {
        const heroResponse = await adminAPI.getHeroContent();
        setHeroData(heroResponse.data?.data || heroResponse.data);
        setVideoError(false); // Reset video error when new hero data is loaded
        console.log('Hero data loaded:', heroResponse.data);
      } catch (err) {
        console.error("Error fetching hero content:", err);
      }
      
      let allRooms = [];
      try {
        const hotelsResponse = await hotelAPI.getAll();
        if (hotelsResponse.data && Array.isArray(hotelsResponse.data)) {
          console.log('HomePage: Raw hotels response:', hotelsResponse.data);
          hotelsResponse.data.forEach((hotel, hotelIndex) => {
            console.log(`HomePage: Hotel ${hotelIndex} (${hotel.name}) has ${hotel.rooms?.length || 0} rooms`);
            if (hotel.rooms && Array.isArray(hotel.rooms)) {
              hotel.rooms.forEach((room, roomIndex) => {
                console.log(`HomePage: Room ${roomIndex} - ID: ${room.id}, Type: ${room.type}, HasImage: ${!!room.imageUrl}, ImageLength: ${room.imageUrl?.length || 0}`);
              });
              allRooms.push(...hotel.rooms);
            }
          });
        }
        console.log('HomePage: Final allRooms array:', allRooms);
        setRooms(allRooms);
      } catch (err) {
        console.error("Error fetching hotels:", err);
      }
      try {
        const cardsResponse = await adminAPI.getYearCards();
        setYearCards(cardsResponse.data || []);
      } catch (err) {
        console.error("Error fetching year cards:", err);
      }
    } finally {
      setLoading(false);
    }
  };

  const nextCard = () => {
    if (yearCards.length > 0) {
      setCurrentCardIndex((prev) => (prev + 1) % yearCards.length);
    }
  };

  const prevCard = () => {
    if (yearCards.length > 0) {
      setCurrentCardIndex((prev) => (prev - 1 + yearCards.length) % yearCards.length);
    }
  };

  const handleMoreDetails = (room) => {
    setSelectedRoom(room);
    setShowDetailsModal(true);
  };

  const closeModal = () => {
    setShowDetailsModal(false);
    setSelectedRoom(null);
  };

  return (
    <div className="min-h-screen">
      <section className="relative h-screen overflow-hidden">
        {/* Background Video (if enabled) */}
        {heroData?.backgroundVideoEnabled && heroData?.backgroundVideoUrl && !videoError ? (
          <div className="absolute inset-0">
            <video
              autoPlay
              muted
              loop={heroData.backgroundVideoLoop !== false}
              playsInline
              className="w-full h-full object-cover"
              onError={(e) => {
                console.error('Video load error:', e);
                setVideoError(true);
              }}
              onLoadedData={() => console.log('Video loaded successfully')}
            >
              <source src={heroData.backgroundVideoUrl} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
            <div className="absolute inset-0 bg-black" style={{ opacity: (heroData.overlayOpacity || 50) / 100 }} />
          </div>
        ) : yearCards.length > 0 ? (
          // Gallery Slider (fallback)
          <div className="absolute inset-0">
            {yearCards.map((card, idx) => (
              <div key={card.id} className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentCardIndex ? "opacity-100" : "opacity-0"}`}>
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-r from-blue-600 to-blue-800" />
                )}
              </div>
            ))}
            <div className="absolute inset-0 bg-black bg-opacity-50" />
          </div>
        ) : (
          // Default gradient (fallback)
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-blue-800" />
        )}

        {/* Gallery Navigation (only show if video is NOT enabled and there are multiple cards) */}
        {!heroData?.backgroundVideoEnabled && yearCards.length > 1 && (
          <>
            <button onClick={prevCard} className="absolute left-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition z-10">
              <FiChevronLeft className="w-8 h-8" />
            </button>
            <button onClick={nextCard} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white bg-opacity-20 hover:bg-opacity-40 text-white p-3 rounded-full transition z-10">
              <FiChevronRight className="w-8 h-8" />
            </button>
          </>
        )}

        <div className="relative z-10 flex items-center justify-center h-full">
          <div className="max-w-4xl mx-auto px-4 text-center text-white">
            <h2 className="text-6xl font-bold mb-6 drop-shadow-lg">
              {heroData?.title || 'Welcome to Aishwaryam Inn'}
            </h2>
            <p className="text-3xl mb-8 drop-shadow-md">
              {heroData?.subtitle || 'Experience luxury comfort at an unbeatable price'}
            </p>
            <div className="space-x-4">
              <button 
                onClick={() => navigate(heroData?.primaryButtonLink || "/all-rooms")} 
                className="bg-white text-blue-600 px-8 py-4 rounded-lg hover:bg-blue-50 transition font-bold text-lg inline-block shadow-xl"
              >
                {heroData?.primaryButtonText || 'Browse Rooms'}
              </button>
              <button 
                onClick={() => navigate(heroData?.secondaryButtonLink || "/my-bookings")} 
                className="bg-transparent border-2 border-white text-white px-8 py-4 rounded-lg hover:bg-white hover:bg-opacity-20 transition font-bold text-lg inline-block"
              >
                {heroData?.secondaryButtonText || 'My Bookings'}
              </button>
            </div>
            <p className="text-sm text-white mt-4">✓ No login required ✓ Quick OTP booking ✓ Get instant confirmation</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4"></div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Premium Rooms</h3>
            <p className="text-gray-600">Beautifully designed with modern amenities</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4"></div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Best Prices</h3>
            <p className="text-gray-600">Competitive rates with flexible cancellation</p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-8 text-center">
            <div className="text-4xl mb-4"></div>
            <h3 className="text-2xl font-bold mb-2 text-gray-800">Easy Booking</h3>
            <p className="text-gray-600">Simple OTP verification, no login needed</p>
          </div>
        </div>
      </section>

      <section className="max-w-7xl mx-auto px-4 py-16">
        <h3 className="text-4xl font-bold mb-12 text-center text-gray-800">Featured Rooms</h3>

        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        )}

        {!loading && rooms.length === 0 && (
          <div className="text-center py-12 text-gray-600">
            <p>No rooms available at the moment.</p>
          </div>
        )}

        {!loading && rooms.length > 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
              {rooms.slice(0, 3).map((room) => (
                <div key={room.id} className="bg-white rounded-lg shadow-lg overflow-hidden hover:shadow-xl transition">
                  <div className="h-48 relative">
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
                    <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-5xl absolute top-0 left-0 ${room.imageUrl ? 'hidden' : ''}`}>🏨</div>
                  </div>
                  <div className="p-6">
                    <h4 className="text-xl font-bold text-gray-800 mb-4">{room.type || room.roomType || 'Room'}</h4>
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="bg-green-50 p-3 rounded">
                        <p className="text-xs text-green-600 font-semibold">Capacity</p>
                        <p className="text-gray-800 font-bold">Up to {room.capacity}</p>
                      </div>
                      <div className="bg-purple-50 p-3 rounded">
                        <p className="text-xs text-purple-600 font-semibold">Type</p>
                        <p className="text-gray-800 font-bold text-sm">{room.type || room.roomType}</p>
                      </div>
                      <div className="bg-orange-50 p-3 rounded col-span-2">
                        <p className="text-xs text-orange-600 font-semibold">Price</p>
                        <p className="text-2xl font-bold text-blue-600">
                          ₹{room.pricePerNight || room.price || room.roomPrice || '0'}
                          <span className="text-xs text-gray-600">/night</span>
                        </p>
                      </div>
                    </div>
                    {room.amenities && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Amenities:</p>
                        <div className="flex flex-wrap gap-2">
                          {parseAmenities(room.amenities).slice(0, 3).map((amenity, idx) => (
                            <span key={idx} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">{amenity}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    <button onClick={() => handleMoreDetails(room)} className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition">More Details</button>
                  </div>
                </div>
              ))}
            </div>
            <div className="text-center">
              <button onClick={() => navigate("/all-rooms")} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-bold text-lg transition">View All {rooms.length} Rooms </button>
            </div>
          </div>
        )}
      </section>

      {showDetailsModal && selectedRoom && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white">
              <h2 className="text-2xl font-bold text-gray-800">{selectedRoom.type || selectedRoom.roomType || 'Room Details'}</h2>
              <button onClick={closeModal} className="text-gray-500 hover:text-gray-700 text-3xl font-bold">✕</button>
            </div>
            <div className="p-6">
              <div className="h-64 relative rounded-lg overflow-hidden mb-6">
                {selectedRoom.imageUrl ? (
                  <img 
                    src={selectedRoom.imageUrl} 
                    alt={`${selectedRoom.type || selectedRoom.roomType} room`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      e.target.nextSibling.style.display = 'flex';
                    }}
                  />
                ) : null}
                <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-7xl absolute top-0 left-0 ${selectedRoom.imageUrl ? 'hidden' : ''}`}>🏨</div>
              </div>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-green-600 mb-2"><FiUsers /> Capacity</div>
                  <p className="text-gray-800 font-bold text-xl">Up to {selectedRoom.capacity}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="flex items-center gap-2 text-purple-600 mb-2"><FiMaximize2 /> Type</div>
                  <p className="text-gray-800 font-bold">{selectedRoom.type || selectedRoom.roomType}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <span> Price</span>
                  <p className="text-gray-800 font-bold text-2xl">₹{selectedRoom.price}/night</p>
                </div>
              </div>
              <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-bold text-gray-800 mb-3"> Room Description</h4>
                <p className="text-gray-700 leading-relaxed">Experience comfort and luxury in our {(selectedRoom.type || selectedRoom.roomType || 'room').toLowerCase()}. Spacious room with modern amenities for your stay at Aishwaryam Inn.</p>
              </div>
              {selectedRoom.amenities && (
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3"> Amenities</h4>
                  <div className="grid grid-cols-2 gap-3">
                    {parseAmenities(selectedRoom.amenities).map((amenity, idx) => (
                      <div key={idx} className="flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-3 rounded-lg">
                        <FiCheckCircle />
                        <span>{amenity}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="mb-6 p-4 bg-yellow-50 border-l-4 border-yellow-400 rounded">
                <h4 className="font-bold text-gray-800 mb-2">ℹ Information</h4>
                <ul className="text-sm text-gray-700 space-y-1">
                  <li> Check-in: 2:00 PM | Check-out: 10:00 AM</li>
                  <li> Free cancellation up to 24 hours before check-in</li>
                  <li> Complimentary breakfast included</li>
                  <li> Free WiFi & 24/7 front desk</li>
                </ul>
              </div>
              <button 
                onClick={() => {
                  closeModal();
                  navigate("/all-rooms");
                }} 
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-4 rounded-lg font-bold text-lg transition shadow-lg"
              >
                View All Rooms to Book
              </button>
              <p className="text-center text-sm text-gray-600 mt-3">Browse our complete room collection  Compare prices  Select dates</p>
            </div>
          </div>
        </div>
      )}

      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16">
        <div className="max-w-4xl mx-auto text-center px-4">
          <h3 className="text-4xl font-bold mb-6">Ready to book your stay?</h3>
          <p className="text-xl text-blue-100 mb-8">No login required at Aishwaryam Inn!</p>
          <button onClick={() => navigate("/all-rooms")} className="bg-white text-blue-600 px-8 py-3 rounded-lg hover:bg-blue-50 transition font-bold text-lg inline-block shadow-xl">Browse All Rooms</button>
        </div>
      </section>

      <footer className="bg-gray-800 text-gray-300 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p>&copy; 2024 Aishwaryam Inn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
