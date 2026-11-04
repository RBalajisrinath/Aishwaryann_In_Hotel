import React from 'react';
import { 
  FiHome, FiDroplet, FiTruck, FiMonitor, FiPhone, FiMapPin, 
  FiZap, FiNavigation, FiStar, FiMap
} from 'react-icons/fi';

const facilities = [
  { name: 'Room Service Available', icon: <FiHome className="w-8 h-8" /> },
  { name: 'Hot Water Facility', icon: <FiDroplet className="w-8 h-8" /> },
  { name: 'Car Parking', icon: <FiTruck className="w-8 h-8" /> },
  { name: 'Satellite T.V.', icon: <FiMonitor className="w-8 h-8" /> },
  { name: 'Telephone with STD & ISD', icon: <FiPhone className="w-8 h-8" /> },
  { name: 'Pick up & Drop from Salem on demand', icon: <FiMapPin className="w-8 h-8" /> },
  { name: 'Uninterrupted power supply', icon: <FiZap className="w-8 h-8" /> },
  { name: 'Tourist Car on Demand', icon: <FiTruck className="w-8 h-8" /> },
  { name: 'Food Served on Order', icon: <FiHome className="w-8 h-8" /> },
  { name: '24 Hrs. Check out Time', icon: <FiStar className="w-8 h-8" /> },
  { name: 'Advance Booking', icon: <FiPhone className="w-8 h-8" /> },
  { 
    name: 'Walkable distance from Lake & Anna Park, Bus Stop & enroute to Raja Rajeswari Temple & Shevaroys Temple', 
    icon: <FiNavigation className="w-8 h-8" /> 
  }
];

const touristPlaces = [
  { name: 'Rajarajeswari Temple', icon: '🛕' },
  { name: 'Shevarayon Temple', icon: '⛩️' },
  { name: 'Horticulture Farm', icon: '🌿' },
  { name: "Lady's Seat", icon: '🪑' },
  { name: "Gent's Seat", icon: '💺' },
  { name: 'TNAU Horticultural Research Station', icon: '🔬' },
  { name: 'Pagoda Point', icon: '🗼' },
  { name: 'Lake', icon: '🏞️' },
  { name: 'Anna Park', icon: '🌳' },
  { name: 'Kiliyur Falls', icon: '💧' }
];

export default function Amenities() {
  return (
    <div className="min-h-screen">
      {/* Page Header */}
      <section className="bg-gradient-to-r from-blue-600 to-blue-800 text-white py-16 animate-slide-in-down">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-5xl font-bold mb-4 animate-text-fade">Aishwaryam Inn - Yercaud</h1>
          <p className="text-blue-100 text-xl animate-fade-in">Your Gateway to Comfort and Tourist Attractions</p>
          <div className="mt-6 p-4 bg-red-600 rounded-lg inline-block animate-bounce-in">
            <p className="text-2xl font-bold">DON'T USE PLASTIC BAGS</p>
            <p className="text-sm mt-1">SAVE RAIN WATER</p>
          </div>
        </div>
      </section>

      {/* Facilities Section */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center mb-4 text-red-600 animate-slide-in-left">FACILITIES</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {facilities.map((facility, idx) => (
            <div
              key={idx}
              className="bg-white rounded-lg shadow-lg p-6 border-2 border-red-100 hover-lift card-stagger"
              style={{ animationDelay: `${idx * 0.15}s` }}
            >
              <div className="flex items-start gap-4">
                <div className="text-red-600 flex-shrink-0 mt-1">
                  <span className="text-2xl">★</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="text-blue-600">{facility.icon}</div>
                  </div>
                  <p className="text-gray-800 font-semibold text-lg">{facility.name}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Tourist Places Section */}
      <section className="bg-white py-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-red-600 mb-3 animate-slide-in-right">
              Places of Tourist Interest in Yercaud
            </h2>
            <div className="h-1 w-32 bg-red-600 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {touristPlaces.map((place, idx) => (
              <div
                key={idx}
                className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg shadow-lg p-8 text-center border-2 border-red-200 hover-scale card-stagger transform transition-all duration-500"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="text-6xl mb-4 animate-float-bounce">{place.icon}</div>
                <div className="flex items-center justify-center gap-2 mb-2">
                  <span className="text-red-600 text-xl">★</span>
                  <h3 className="text-xl font-bold text-gray-800">{place.name}</h3>
                </div>
              </div>
            ))}
          </div>

          {/* Tourist Illustration */}
          <div className="mt-12 text-center">
            <div className="inline-block p-8 bg-gradient-to-r from-red-100 to-pink-100 rounded-full animate-pulse-slow">
              <p className="text-6xl">👨‍👩‍👧‍👦</p>
            </div>
            <p className="mt-4 text-gray-600 text-lg italic">Explore the Beauty of Yercaud with Your Family</p>
          </div>
        </div>
      </section>

      {/* Environmental Message */}
      <section className="bg-gradient-to-r from-green-600 to-blue-600 text-white py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="space-y-6">
            <div className="animate-bounce-in">
              <p className="text-3xl font-bold mb-2">🌍 DON'T USE PLASTIC BAGS</p>
              <p className="text-xl">Let's keep Yercaud clean and green</p>
            </div>
            <div className="animate-slide-in-up">
              <p className="text-3xl font-bold mb-2">💧 SAVE RAIN WATER</p>
              <p className="text-xl">Every drop counts for our future</p>
            </div>
          </div>
        </div>
      </section>

      {/* Location Highlight */}
      <section className="max-w-7xl mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl shadow-2xl p-12 text-center animate-zoom-in">
          <FiMap className="w-16 h-16 mx-auto mb-6" />
          <h3 className="text-3xl font-bold mb-4">Prime Location</h3>
          <p className="text-xl mb-6">
            Walkable distance from Lake & Anna Park, Bus Stop
          </p>
          <p className="text-lg text-blue-100">
            Enroute to Raja Rajeswari Temple & Shevaroys Temple
          </p>
          <div className="mt-8 flex justify-center gap-4 flex-wrap">
            <div className="bg-white/20 rounded-lg px-6 py-3">
              <p className="text-sm">To Lake</p>
              <p className="text-2xl font-bold">5 min walk</p>
            </div>
            <div className="bg-white/20 rounded-lg px-6 py-3">
              <p className="text-sm">To Anna Park</p>
              <p className="text-2xl font-bold">3 min walk</p>
            </div>
            <div className="bg-white/20 rounded-lg px-6 py-3">
              <p className="text-sm">To Bus Stop</p>
              <p className="text-2xl font-bold">2 min walk</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
