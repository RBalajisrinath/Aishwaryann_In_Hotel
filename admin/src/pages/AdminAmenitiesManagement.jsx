import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { 
  FiPlus, 
  FiEdit2, 
  FiTrash2, 
  FiArrowLeft, 
  FiGrid, 
  FiX,
  FiTag,
  FiInfo,
  FiSave,
  FiSearch
} from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminAmenitiesManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [amenities, setAmenities] = useState([]);
  const [groupedAmenities, setGroupedAmenities] = useState({});
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAmenity, setEditingAmenity] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    icon: '',
    description: '',
  });

  const categories = [
    { id: 'connectivity', name: 'Connectivity', color: 'from-blue-600 to-blue-700', icon: '📶' },
    { id: 'comfort', name: 'Comfort', color: 'from-green-600 to-green-700', icon: '🛋️' },
    { id: 'entertainment', name: 'Entertainment', color: 'from-purple-600 to-purple-700', icon: '🎬' },
    { id: 'refreshments', name: 'Refreshments', color: 'from-orange-600 to-orange-700', icon: '🍷' },
    { id: 'security', name: 'Security', color: 'from-red-600 to-red-700', icon: '🔒' },
    { id: 'space', name: 'Space', color: 'from-indigo-600 to-indigo-700', icon: '🏠' },
    { id: 'luxury', name: 'Luxury', color: 'from-yellow-600 to-yellow-700', icon: '✨' },
    { id: 'convenience', name: 'Convenience', color: 'from-teal-600 to-teal-700', icon: '🛎️' },
    { id: 'service', name: 'Service', color: 'from-pink-600 to-pink-700', icon: '🤝' },
    { id: 'transport', name: 'Transport', color: 'from-gray-600 to-gray-700', icon: '🚗' },
    { id: 'dining', name: 'Dining', color: 'from-amber-600 to-amber-700', icon: '🍽️' },
    { id: 'location', name: 'Location', color: 'from-emerald-600 to-emerald-700', icon: '📍' },
    { id: 'general', name: 'General', color: 'from-slate-600 to-slate-700', icon: '⭐' }
  ];

  useEffect(() => {
    loadAmenities();
  }, []);

  const loadAmenities = async () => {
    try {
      const response = await adminAPI.getAmenities();
      const amenitiesData = response.data?.data || response.data || [];
      setAmenities(amenitiesData);
      
      // Group amenities by category
      const grouped = amenitiesData.reduce((acc, amenity) => {
        const category = amenity.category || 'general';
        if (!acc[category]) {
          acc[category] = [];
        }
        acc[category].push(amenity);
        return acc;
      }, {});
      
      setGroupedAmenities(grouped);
      setLoading(false);
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to load amenities', 
        type: 'error' 
      });
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingAmenity) {
        await adminAPI.updateAmenity(editingAmenity.id, formData);
        addNotification({ 
          message: 'Amenity updated successfully', 
          type: 'success' 
        });
      } else {
        await adminAPI.createAmenity(formData);
        addNotification({ 
          message: 'Amenity created successfully', 
          type: 'success' 
        });
      }
      
      setShowForm(false);
      setEditingAmenity(null);
      setFormData({ name: '', category: '', icon: '', description: '' });
      loadAmenities();
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to save amenity', 
        type: 'error' 
      });
    }
  };

  const handleEdit = (amenity) => {
    setEditingAmenity(amenity);
    setFormData({
      name: amenity.name || '',
      category: amenity.category || '',
      icon: amenity.icon || '',
      description: amenity.description || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (amenityId) => {
    if (!window.confirm('Are you sure you want to delete this amenity?')) return;
    
    try {
      await adminAPI.deleteAmenity(amenityId);
      addNotification({ 
        message: 'Amenity deleted successfully', 
        type: 'success' 
      });
      loadAmenities();
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to delete amenity', 
        type: 'error' 
      });
    }
  };

  const getCategoryInfo = (categoryId) => {
    return categories.find(cat => cat.id === categoryId) || categories.find(cat => cat.id === 'general');
  };

  const filteredAmenities = amenities.filter(amenity => {
    const matchesSearch = amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         amenity.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || amenity.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

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
              <h1 className="text-4xl font-bold text-white mb-3">Amenities Management</h1>
              <p className="text-slate-400">Manage hotel amenities and features</p>
            </div>
            <button
              onClick={() => {
                setShowForm(!showForm);
                setEditingAmenity(null);
                setFormData({ name: '', category: '', icon: '', description: '' });
              }}
              className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105"
            >
              <FiPlus className="w-5 h-5" />
              {showForm ? 'Cancel' : 'Add Amenity'}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Amenities</p>
                <p className="text-3xl font-bold">{amenities.length}</p>
              </div>
              <FiGrid className="w-8 h-8 text-blue-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Categories</p>
                <p className="text-3xl font-bold">{Object.keys(groupedAmenities).length}</p>
              </div>
              <FiTag className="w-8 h-8 text-purple-200" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">Room Amenities</p>
                <p className="text-3xl font-bold">
                  {amenities.filter(a => ['comfort', 'entertainment', 'connectivity', 'luxury'].includes(a.category)).length}
                </p>
              </div>
              <span className="text-2xl">🏠</span>
            </div>
          </div>
          <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-100 text-sm font-medium">Hotel Services</p>
                <p className="text-3xl font-bold">
                  {amenities.filter(a => ['service', 'transport', 'dining', 'convenience'].includes(a.category)).length}
                </p>
              </div>
              <span className="text-2xl">🏨</span>
            </div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-6 mb-8 border border-slate-600">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search amenities..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Categories</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.icon} {category.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 mb-8 border border-slate-600 shadow-xl">
            <h2 className="text-2xl font-bold text-white mb-6">
              {editingAmenity ? '✏️ Edit Amenity' : '➕ Add New Amenity'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Amenity Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="e.g., WiFi, Air Conditioning"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Category *
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                    required
                  >
                    <option value="">Select Category</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.icon} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Icon/Emoji
                  </label>
                  <input
                    type="text"
                    name="icon"
                    value={formData.icon}
                    onChange={handleInputChange}
                    placeholder="📶 ❄️ 📺"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Brief description of the amenity"
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition font-medium transform hover:scale-105 flex items-center justify-center gap-2"
                >
                  <FiSave className="w-5 h-5" />
                  {editingAmenity ? 'Update Amenity' : 'Create Amenity'}
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

        {/* Amenities Grid by Category */}
        {Object.keys(groupedAmenities).map(categoryId => {
          const categoryInfo = getCategoryInfo(categoryId);
          const categoryAmenities = groupedAmenities[categoryId];
          
          // Filter amenities for this category
          const filteredCategoryAmenities = categoryAmenities.filter(amenity => {
            const matchesSearch = amenity.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                 amenity.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = selectedCategory === 'all' || amenity.category === selectedCategory;
            return matchesSearch && matchesCategory;
          });

          if (filteredCategoryAmenities.length === 0) return null;

          return (
            <div key={categoryId} className="mb-8">
              <div className={`bg-gradient-to-r ${categoryInfo.color} rounded-xl p-4 mb-4`}>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <span className="text-2xl">{categoryInfo.icon}</span>
                  {categoryInfo.name}
                  <span className="text-sm bg-white bg-opacity-20 px-3 py-1 rounded-full">
                    {filteredCategoryAmenities.length}
                  </span>
                </h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCategoryAmenities.map(amenity => (
                  <div
                    key={amenity.id}
                    className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-xl p-6 border border-slate-600 hover:border-slate-500 transition transform hover:scale-105 duration-300"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{amenity.icon || '⭐'}</span>
                        <h4 className="text-lg font-bold text-white">{amenity.name}</h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(amenity)}
                          className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition transform hover:scale-110"
                          title="Edit Amenity"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(amenity.id)}
                          className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition transform hover:scale-110"
                          title="Delete Amenity"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    
                    {amenity.description && (
                      <p className="text-slate-300 text-sm mb-3">{amenity.description}</p>
                    )}
                    
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium bg-gradient-to-r ${categoryInfo.color} text-white`}>
                        {categoryInfo.name}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}

        {filteredAmenities.length === 0 && !showForm && (
          <div className="text-center py-12">
            <FiGrid className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">
              {searchTerm || selectedCategory !== 'all' ? 'No amenities match your search' : 'No amenities found. Add your first amenity to get started.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}