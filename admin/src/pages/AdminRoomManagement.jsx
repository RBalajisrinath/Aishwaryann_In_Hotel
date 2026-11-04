import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiEdit2, FiTrash2, FiPlus, FiArrowLeft, FiHome, FiUsers, FiDollarSign, FiGrid, FiX, FiImage, FiUpload, FiCalendar } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminRoomManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [customAmenity, setCustomAmenity] = useState('');
  const [formData, setFormData] = useState({
    type: '',
    description: '',
    price: '',
    capacity: '',
    amenities: [],
    size: '',
    image: null,
    imageUrl: '',
    removeImage: false,
    gstEnabled: false,
    gstPercentage: 0,
    gstType: 'exclusive',
    extraAdultCharge: 0
  });

  

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
    loadRooms();
    loadBookings();
    
    // Auto-refresh bookings every 5 seconds to get latest approval status
    const interval = setInterval(() => {
      loadBookings();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  const loadRooms = async () => {
    try {
      const data = await adminAPI.getRooms();
      console.log('Loaded rooms:', data.data);
      setRooms(data.data || []);
      setLoading(false);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to load rooms', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const loadBookings = async () => {
    try {
      const data = await adminAPI.getBookings();
      setBookings(data.data || []);
    } catch (error) {
      console.error('Failed to load bookings:', error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : (name === 'price' || name === 'capacity' || name === 'gstPercentage' || name === 'extraAdultCharge' ? parseFloat(value) || 0 : value),
    });
  };

  const handleAmenitiesChange = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities) ? formData.amenities : [];
    setFormData({
      ...formData,
      amenities: currentAmenities.includes(amenity)
        ? currentAmenities.filter(a => a !== amenity)
        : [...currentAmenities, amenity],
    });
  };

  const handleAddCustomAmenity = () => {
    if (!customAmenity.trim()) {
      addNotification({ message: 'Please enter an amenity name', type: 'error' });
      return;
    }
    const currentAmenities = Array.isArray(formData.amenities) ? formData.amenities : [];
    if (currentAmenities.includes(customAmenity.trim())) {
      addNotification({ message: 'Amenity already exists', type: 'warning' });
      return;
    }
    setFormData({
      ...formData,
      amenities: [...currentAmenities, customAmenity.trim()]
    });
    setCustomAmenity('');
    addNotification({ message: 'Amenity added', type: 'success' });
  };

  const handleRemoveAmenity = (amenity) => {
    const currentAmenities = Array.isArray(formData.amenities) ? formData.amenities : [];
    setFormData({
      ...formData,
      amenities: currentAmenities.filter(a => a !== amenity)
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification({ message: 'Image size should be less than 5MB', type: 'error' });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);

      setFormData({ ...formData, image: file, removeImage: false });
    }
  };

  const handleRemoveImage = () => {
    if (window.confirm('Are you sure you want to remove this image?')) {
      setImagePreview(null);
      setFormData({ 
        ...formData, 
        image: null, 
        imageUrl: '', 
        removeImage: true 
      });
      addNotification({ 
        message: 'Image will be removed when you update the room', 
        type: 'success' 
      });
    }
  };

  const handleQuickRemoveImage = async (roomId) => {
    if (!window.confirm('Are you sure you want to remove this room\'s image?')) return;
    
    try {
      await adminAPI.removeRoomImage(roomId);
      addNotification({ 
        message: 'Room image removed successfully', 
        type: 'success' 
      });
      loadRooms(); // Reload to update the UI
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to remove image', 
        type: 'error' 
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submitData = new FormData();
      submitData.append('type', formData.type);
      submitData.append('price', formData.price);
      submitData.append('capacity', formData.capacity);
      submitData.append('size', formData.size);
      submitData.append('gstEnabled', formData.gstEnabled);
      submitData.append('gstPercentage', formData.gstPercentage);
      submitData.append('gstType', formData.gstType);
      submitData.append('amenities', JSON.stringify(formData.amenities));
  submitData.append('extraAdultCharge', formData.extraAdultCharge || 0);
      
      if (formData.image) {
        submitData.append('image', formData.image);
      }
      
      // Add removeImage flag for updates
      if (editingRoom && formData.removeImage) {
        submitData.append('removeImage', 'true');
      }

      if (editingRoom) {
        await adminAPI.updateRoom(editingRoom.id, submitData);
        addNotification({ 
          message: 'Room updated successfully', 
          type: 'success' 
        });
      } else {
        await adminAPI.addRoom(submitData);
        addNotification({ 
          message: 'Room added successfully', 
          type: 'success' 
        });
      }
      setShowForm(false);
      setEditingRoom(null);
  setFormData({ type: '', price: '', capacity: '', amenities: [], size: '', image: null, imageUrl: '', removeImage: false, gstEnabled: false, gstPercentage: 0, gstType: 'exclusive', extraAdultCharge: 0 });
  setImagePreview(null);
      loadRooms();
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to save room', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (room) => {
    setEditingRoom(room);
    setFormData({
      type: room.type || '',
      description: room.description || '',
      price: room.price || '',
      capacity: room.capacity || '',
      amenities: parseAmenities(room.amenities),
      size: room.size || '',
      image: null,
      imageUrl: room.imageUrl || '',
      removeImage: false,
      gstEnabled: room.gstEnabled || false,
      gstPercentage: room.gstPercentage || 0,
      gstType: room.gstType || 'exclusive',
      extraAdultCharge: room.extraAdultCharge || 0
    });
    setImagePreview(room.imageUrl || null);
    setShowForm(true);
    setShowDetailsModal(false);
  };

  const handleDelete = async (roomId) => {
    if (!window.confirm('Are you sure you want to delete this room?')) return;
    try {
      await adminAPI.deleteRoom(roomId);
      addNotification({ 
        message: 'Room deleted successfully', 
        type: 'success' 
      });
      loadRooms();
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to delete room', 
        type: 'error' 
      });
    }
  };

  const handleViewDetails = (room) => {
    setSelectedRoom(room);
    setShowDetailsModal(true);
  };

  const closeDetailsModal = () => {
    setShowDetailsModal(false);
    setSelectedRoom(null);
  };

  const amenityOptions = ['WiFi', 'AC', 'TV', 'Minibar', 'Safe', 'Balcony', 'Jacuzzi', 'Kitchenette'];

  // Calculate room statistics
  const getRoomStats = () => {
    const stats = {};

    // Initialize stats for each unique room type from database
    rooms.forEach(room => {
      if (!stats[room.type]) {
        stats[room.type] = { total: 0, booked: 0, available: 0, price: 0 };
      }
    });

    // Count total rooms by type (sum of availability column = total capacity)
    rooms.forEach(room => {
      if (stats[room.type]) {
        // availability column = total capacity of that room type
        stats[room.type].total += room.availability || 0;
        stats[room.type].price = room.pricePerNight || room.price;
      }
    });

    // Count booked rooms - only active bookings (not cancelled/checked-out)
    const activeBookings = bookings.filter(b => 
      b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked-in' || b.adminApprovalStatus === 'approved'
    );

    activeBookings.forEach(booking => {
      // Find the room for this booking to get its type
      const room = rooms.find(r => r.id === booking.roomId);
      if (room && stats[room.type]) {
        stats[room.type].booked += booking.numberOfRooms || 1;
      }
    });

    // Calculate available rooms (total - booked)
    Object.keys(stats).forEach(type => {
      stats[type].available = Math.max(0, stats[type].total - stats[type].booked);
    });

    return stats;
  };

  // Get active bookings for display
  const getActiveBookings = () => {
    return bookings.filter(b => 
      b.bookingStatus === 'confirmed' || b.bookingStatus === 'checked-in'
    );
  };

  const stats = getRoomStats();
  const activeBookings = getActiveBookings();
  const totalRooms = Object.values(stats).reduce((sum, s) => sum + s.total, 0);
  const totalBooked = Object.values(stats).reduce((sum, s) => sum + s.booked, 0);
  const totalAvailable = totalRooms - totalBooked;

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
              <h1 className="text-4xl font-bold text-white mb-3">Room Management</h1>
              <p className="text-slate-400">Manage hotel rooms and amenities</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  loadRooms();
                  loadBookings();
                  addNotification({ message: 'Room stats refreshed', type: 'success' });
                }}
                className="flex items-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-4 py-3 rounded-lg font-semibold transition transform hover:scale-105"
                title="Refresh room statistics"
              >
                <span className="w-4 h-4">⟳</span>
              </button>
              <button
                onClick={() => {
                setShowForm(!showForm);
                setEditingRoom(null);
                setFormData({ type: '', price: '', capacity: '', amenities: [], size: '', image: null, imageUrl: '', removeImage: false, gstEnabled: false, gstPercentage: 0, gstType: 'exclusive', extraAdultCharge: 0 });
                setImagePreview(null);
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
            >
              <FiPlus className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Room'}
            </button>
            </div>
          </div>
        </div>

        {/* Room Statistics Dashboard */}
        <div className="mb-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Total Overview */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-5 text-white shadow-lg">
            <div className="flex items-center justify-between mb-2">
              <FiHome className="w-8 h-8 opacity-80" />
              <span className="text-3xl font-bold">{totalRooms}</span>
            </div>
            <p className="text-sm font-semibold opacity-90">Total Rooms</p>
            <p className="text-xs opacity-75 mt-1">Aishwaryam Inn</p>
          </div>

          {/* Dynamic Room Type Stats */}
          {Object.entries(stats).map(([roomType, roomStats]) => (
            <div key={roomType} className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-xl p-5 border border-slate-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="text-white font-bold text-lg">{roomType}</p>
                  <p className="text-slate-400 text-xs">₹{roomStats.price}/night</p>
                </div>
                <span className="text-2xl font-bold text-white">{roomStats.total}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm bg-slate-800 bg-opacity-50 px-2 py-1 rounded">
                  <span className="text-green-300 font-semibold">✓ Available</span>
                  <span className="text-white font-bold">{roomStats.available}</span>
                </div>
                <div className="flex justify-between text-sm bg-slate-800 bg-opacity-50 px-2 py-1 rounded">
                  <span className="text-red-300 font-semibold">✗ Booked</span>
                  <span className="text-white font-bold">{roomStats.booked}</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-red-500 to-red-400 h-full transition-all duration-300"
                    style={{ width: roomStats.total > 0 ? `${(roomStats.booked / roomStats.total) * 100}%` : '0%' }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Active Bookings Summary */}
        {activeBookings.length > 0 && (
          <div className="mb-8 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl p-6 shadow-lg">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <FiCalendar className="w-6 h-6 text-white" />
                <h3 className="text-white font-bold text-xl">Active Bookings</h3>
              </div>
              <span className="bg-white text-orange-600 px-4 py-2 rounded-full font-bold text-lg">
                {activeBookings.length}
              </span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {activeBookings.slice(0, 6).map(booking => (
                <div key={booking.id} className="bg-white bg-opacity-20 backdrop-blur rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-white font-semibold">{booking.firstName} {booking.lastName}</p>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      booking.status === 'checked-in' ? 'bg-green-600' : 'bg-blue-600'
                    } text-white`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-white text-sm opacity-90">
                    Room: {booking.roomType} (#{booking.roomId})
                  </p>
                  <p className="text-white text-xs opacity-75 mt-1">
                    Booking #{booking.bookingNumber}
                  </p>
                </div>
              ))}
            </div>
            {activeBookings.length > 6 && (
              <p className="text-white text-sm mt-3 text-center opacity-75">
                + {activeBookings.length - 6} more bookings
              </p>
            )}
          </div>
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 mb-8 border border-slate-600 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingRoom ? '✏️ Edit Room' : '➕ Add New Room'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Type */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Room Type *
                  </label>
                  <input
                    type="text"
                    name="type"
                    value={formData.type}
                    onChange={handleInputChange}
                    placeholder="e.g., Deluxe Suite"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                {/* Room Content */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Room Content <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., Spacious room with modern amenities..."
                    rows="3"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Price */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Price per Night (₹) *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={formData.price || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 2500"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                {/* Capacity */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Capacity (Guests) *
                  </label>
                  <input
                    type="number"
                    name="capacity"
                    value={formData.capacity || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 2"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                {/* Extra Adult Charge */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Extra Adult Charge (₹)
                  </label>
                  <input
                    type="number"
                    name="extraAdultCharge"
                    value={formData.extraAdultCharge || 0}
                    onChange={handleInputChange}
                    placeholder="e.g., 300"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* Size */}
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Size (sq.m) <span className="text-slate-400 text-xs font-normal">(Optional)</span>
                  </label>
                  <input
                    type="number"
                    name="size"
                    value={formData.size || ''}
                    onChange={handleInputChange}
                    placeholder="e.g., 25"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                {/* GST Configuration */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-slate-200 mb-3">
                    🧾 GST Configuration
                  </label>
                  <div className="bg-slate-600 bg-opacity-30 rounded-lg p-4 border border-slate-500">
                    <div className="flex items-center gap-3 mb-4">
                      <input
                        type="checkbox"
                        id="gstEnabled"
                        name="gstEnabled"
                        checked={formData.gstEnabled}
                        onChange={handleInputChange}
                        className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <label htmlFor="gstEnabled" className="text-sm font-medium text-slate-200">
                        Enable GST for this room type
                      </label>
                    </div>

                    {formData.gstEnabled && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            GST Percentage
                          </label>
                          <div className="flex items-center gap-4">
                            <input
                              type="number"
                              name="gstPercentage"
                              min="0"
                              max="30"
                              step="0.01"
                              value={formData.gstPercentage}
                              onChange={handleInputChange}
                              className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                            <span className="text-2xl font-bold text-black min-w-[60px]">
                              {formData.gstPercentage}%
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">
                            GST rate applied to room charges
                          </p>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-slate-300 mb-2">
                            GST Type
                          </label>
                          <select
                            name="gstType"
                            value={formData.gstType}
                            onChange={handleInputChange}
                            className="w-full px-4 py-2 bg-slate-700 border border-slate-600 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          >
                            <option value="exclusive">Exclusive (GST added to price)</option>
                            <option value="inclusive">Inclusive (GST included in price)</option>
                          </select>
                          <p className="text-xs text-slate-400 mt-1">
                            How GST is calculated and displayed
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Room Image Upload */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  <FiImage className="inline mr-2" />
                  Room Photo
                </label>
                <div className="border-2 border-dashed border-slate-600 rounded-lg p-6 hover:border-blue-500 transition">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                  />
                  <p className="text-xs text-slate-400 mt-2">Max size: 5MB. Recommended: 800x600px. Formats: JPG, PNG, WEBP</p>
                  
                  {imagePreview && (
                    <div className="mt-4">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm text-slate-300">Preview:</p>
                        {editingRoom && formData.imageUrl && (
                          <button
                            type="button"
                            onClick={handleRemoveImage}
                            className="flex items-center gap-2 px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition"
                          >
                            <FiTrash2 className="w-4 h-4" />
                            Remove Image
                          </button>
                        )}
                      </div>
                      <img 
                        src={imagePreview} 
                        alt="Room preview" 
                        className="w-full max-w-md h-48 object-cover rounded-lg border-2 border-slate-600"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Amenities */}
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-3">
                  Amenities
                </label>
                
                {/* Selected Amenities */}
                {formData.amenities && formData.amenities.length > 0 && (
                  <div className="mb-4 p-3 bg-slate-600 bg-opacity-30 rounded-lg">
                    <p className="text-xs text-slate-400 mb-2">Selected:</p>
                    <div className="flex flex-wrap gap-2">
                      {formData.amenities.map((amenity, idx) => (
                        <span key={idx} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-1 rounded-full text-sm">
                          {amenity}
                          <button
                            type="button"
                            onClick={() => handleRemoveAmenity(amenity)}
                            className="ml-1 hover:bg-blue-700 rounded-full p-0.5"
                          >
                            <FiX className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Predefined Amenities */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {amenityOptions.map(amenity => (
                    <label key={amenity} className="flex items-center p-3 bg-slate-600 bg-opacity-30 hover:bg-opacity-50 rounded-lg cursor-pointer transition">
                      <input
                        type="checkbox"
                        checked={Array.isArray(formData.amenities) && formData.amenities.includes(amenity)}
                        onChange={() => handleAmenitiesChange(amenity)}
                        className="w-4 h-4 text-blue-600"
                      />
                      <span className="ml-2 text-sm text-slate-200">{amenity}</span>
                    </label>
                  ))}
                </div>

                {/* Add Custom Amenity */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={customAmenity}
                    onChange={(e) => setCustomAmenity(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCustomAmenity())}
                    placeholder="Add custom amenity..."
                    className="flex-1 px-4 py-2 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 text-sm"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition text-sm font-medium"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition font-medium transform hover:scale-105"
                >
                  {editingRoom ? 'Update Room' : 'Add Room'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-slate-600 hover:bg-slate-700 text-white px-6 py-3 rounded-lg transition font-medium"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Rooms Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rooms.map(room => (
            <div
              key={room.id}
              className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl overflow-hidden border border-slate-600 hover:border-slate-500 transition transform hover:scale-105 duration-300"
            >
              {/* Room Image */}
              {room.imageUrl ? (
                <div className="h-48 overflow-hidden">
                  <img 
                    src={room.imageUrl} 
                    alt={room.type} 
                    className="w-full h-full object-cover hover:scale-110 transition duration-300"
                    onError={(e) => {
                      console.error('Image failed to load for room:', room.id);
                      e.target.style.display = 'none';
                      e.target.parentElement.innerHTML = '<div class="h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center"><svg class="w-16 h-16 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg></div>';
                    }}
                  />
                </div>
              ) : (
                <div className="h-48 bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                  <FiImage className="w-16 h-16 text-white opacity-50" />
                </div>
              )}

              <div className="p-6">
                {/* Room Header */}
                <div className="flex justify-between items-start mb-4">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-3 rounded-xl">
                    <FiHome className="w-6 h-6 text-white" />
                  </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewDetails(room)}
                    className="p-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition transform hover:scale-110"
                    title="View Details"
                  >
                    <FiGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(room)}
                    className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition transform hover:scale-110"
                    title="Edit Room"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>
                  {room.imageUrl && (
                    <button
                      onClick={() => handleQuickRemoveImage(room.id)}
                      className="p-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition transform hover:scale-110"
                      title="Remove Image"
                    >
                      <FiImage className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    onClick={() => handleDelete(room.id)}
                    className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition transform hover:scale-110"
                    title="Delete Room"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Room Info */}
              <h3 className="text-xl font-bold text-white mb-4">{room.type}</h3>

              {/* Availability Status */}
              <div className="mb-4 p-3 rounded-lg bg-slate-800 border border-slate-600">
                {(() => {
                  const roomStats = stats[room.type] || { total: 0, available: 0, booked: 0 };
                  const currentlyAvailable = room.availability - roomStats.booked;
                  const isFullyBooked = currentlyAvailable <= 0;
                  
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-slate-300">Currently Available</span>
                        <div className="flex items-center gap-2">
                          <span className={`w-3 h-3 rounded-full ${
                            currentlyAvailable > 0 ? 'bg-green-500' : 'bg-red-500'
                          }`}></span>
                          <span className={`text-lg font-bold ${
                            currentlyAvailable > 0 ? 'text-green-400' : 'text-red-400'
                          }`}>
                            {currentlyAvailable > 0 ? `${currentlyAvailable} Available` : 'Fully Booked'}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs bg-slate-700 px-3 py-2 rounded mb-2">
                        <span className="text-slate-400">Quantity of Rooms: </span>
                        <span className="text-white font-semibold text-lg">{currentlyAvailable || 0} room{currentlyAvailable !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="text-xs bg-slate-700 px-3 py-2 rounded">
                        <div className="flex justify-between text-slate-300">
                          <span>Total Capacity: <span className="text-white font-semibold">{room.availability}</span></span>
                          <span>Booked: <span className="text-red-400 font-semibold">{roomStats.booked}</span></span>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-3">
                  <FiDollarSign className="w-5 h-5 text-green-400" />
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">₹{room.price}</span> per night
                  </span>
                </div>
                {room.extraAdultCharge > 0 && (
                  <div className="flex items-center gap-3">
                    <span className="text-yellow-300 text-sm">👤</span>
                    <span className="text-slate-300 text-sm">Extra adult: <span className="font-semibold text-white">₹{room.extraAdultCharge}</span> / person</span>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <FiUsers className="w-5 h-5 text-blue-400" />
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">{room.capacity}</span> guests
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <FiGrid className="w-5 h-5 text-purple-400" />
                  <span className="text-slate-300">
                    <span className="font-semibold text-white">{room.size || 'N/A'}</span> sq.m
                  </span>
                </div>
                {room.gstEnabled && (
                  <div className="flex items-center gap-3">
                    <span className="text-green-400 text-lg">🧾</span>
                    <span className="text-slate-300">
                      <span className={`font-semibold ${room.gstPercentage === 0 ? 'text-black' : 'text-white'}`}>GST {room.gstPercentage}%</span> ({room.gstType})
                    </span>
                  </div>
                )}
              </div>

              {/* Amenities */}
              {room.amenities && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Amenities:</p>
                  <div className="flex flex-wrap gap-2">
                    {parseAmenities(room.amenities).map((amenity, idx) => (
                      <span
                        key={`${amenity}-${idx}`}
                        className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-3 py-1 rounded-full"
                      >
                        {amenity}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              </div>
            </div>
          ))}
        </div>

        {rooms.length === 0 && !showForm && (
          <div className="text-center py-12">
            <FiHome className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No rooms found. Add your first room to get started.</p>
          </div>
        )}

        {/* Room Details Modal */}
        {showDetailsModal && selectedRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-slate-700">
              <div className="flex items-center justify-between p-6 border-b border-slate-700 sticky top-0 bg-slate-800">
                <h2 className="text-2xl font-bold text-white">{selectedRoom.type}</h2>
                <button onClick={closeDetailsModal} className="text-slate-400 hover:text-white text-3xl">
                  <FiX className="w-6 h-6" />
                </button>
              </div>
              <div className="p-6">
                {/* Room Image */}
                {selectedRoom.imageUrl && (
                  <div className="mb-6">
                    <img 
                      src={selectedRoom.imageUrl} 
                      alt={selectedRoom.type}
                      className="w-full h-64 object-cover rounded-lg border-2 border-slate-600"
                    />
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gradient-to-br from-blue-600 to-purple-600 p-4 rounded-lg">
                    <p className="text-slate-200 text-sm font-semibold mb-1">Room ID</p>
                    <p className="text-white font-bold text-xl">#{selectedRoom.id}</p>
                  </div>
                  <div className="bg-gradient-to-br from-green-600 to-emerald-600 p-4 rounded-lg">
                    <p className="text-slate-200 text-sm font-semibold mb-1">Capacity</p>
                    <p className="text-white font-bold text-xl">{selectedRoom.capacity} Guests</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-600 to-red-600 p-4 rounded-lg">
                    <p className="text-slate-200 text-sm font-semibold mb-1">Price per Night</p>
                    <p className="text-white font-bold text-xl">₹{selectedRoom.price}</p>
                  </div>
                  <div className="bg-gradient-to-br from-indigo-600 to-blue-600 p-4 rounded-lg">
                    <p className="text-slate-200 text-sm font-semibold mb-1">Size</p>
                    <p className="text-white font-bold text-xl">{selectedRoom.size || 'N/A'} sq.m</p>
                  </div>
                  <div className="bg-gradient-to-br from-teal-600 to-cyan-600 p-4 rounded-lg">
                    <p className="text-slate-200 text-sm font-semibold mb-1">GST Settings</p>
                    <p className={selectedRoom.gstPercentage === 0 ? 'text-black font-bold text-lg' : 'text-white font-bold text-lg'}>
                      {selectedRoom.gstEnabled ? `${selectedRoom.gstPercentage}% (${selectedRoom.gstType})` : 'GST Disabled'}
                    </p>
                  </div>
                </div>

                {selectedRoom.amenities && selectedRoom.amenities.length > 0 && (
                  <div className="mb-6">
                    <h4 className="font-bold text-white mb-3">✨ Amenities</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {selectedRoom.amenities.map((amenity, idx) => (
                        <div key={idx} className="flex items-center gap-2 bg-slate-700 text-slate-200 px-4 py-3 rounded-lg">
                          <span className="text-green-400">✓</span>
                          <span className="font-medium">{amenity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-6 p-4 bg-slate-700 rounded-lg border border-slate-600">
                  <h4 className="font-bold text-white mb-3">📋 Room Information</h4>
                  <ul className="text-sm text-slate-300 space-y-2">
                    <li><span className="text-blue-400">•</span> Room Type: <span className="font-semibold text-white">{selectedRoom.type}</span></li>
                    <li><span className="text-blue-400">•</span> Capacity: <span className="font-semibold text-white">{selectedRoom.capacity} guests</span></li>
                    <li><span className="text-blue-400">•</span> Size: <span className="font-semibold text-white">{selectedRoom.size || 'Not specified'} sq.m</span></li>
                    <li><span className="text-blue-400">•</span> Rate: <span className="font-semibold text-white">₹{selectedRoom.price}/night</span></li>
                    <li><span className="text-blue-400">•</span> GST: <span className={`font-semibold ${selectedRoom.gstPercentage === 0 ? 'text-black' : 'text-white'}`}>{selectedRoom.gstEnabled ? `${selectedRoom.gstPercentage}% (${selectedRoom.gstType})` : 'Disabled'}</span></li>
                    <li><span className="text-blue-400">•</span> Total Amenities: <span className="font-semibold text-white">{selectedRoom.amenities?.length || 0}</span></li>
                    {selectedRoom.extraAdultCharge !== undefined && (
                      <li><span className="text-blue-400">•</span> Extra Adult Charge: <span className="font-semibold text-white">₹{selectedRoom.extraAdultCharge}</span> / person</li>
                    )}
                  </ul>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => handleEdit(selectedRoom)}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-lg font-bold transition"
                  >
                    ✏️ Edit Room
                  </button>
                  <button
                    onClick={closeDetailsModal}
                    className="flex-1 bg-slate-600 hover:bg-slate-700 text-white py-3 rounded-lg font-bold transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}