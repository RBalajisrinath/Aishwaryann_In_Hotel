import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiArrowLeft, FiImage, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminGalleryManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [gallery, setGallery] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [selectedSection, setSelectedSection] = useState('all');
  const [uploadData, setUploadData] = useState({
    section: 'home',
    image: null
  });

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      const data = await adminAPI.getGallery();
      setGallery(data.data || []);
      setLoading(false);
    } catch (error) {
      addNotification({ message: 'Failed to load gallery', type: 'error' });
      setLoading(false);
    }
  };

  const handleDeleteImage = async (id) => {
    if (!window.confirm('Delete this image?')) return;
    try {
      await adminAPI.deleteGallery(id);
      addNotification({ message: 'Image deleted successfully', type: 'success' });
      loadGallery();
    } catch (error) {
      addNotification({ message: 'Failed to delete image', type: 'error' });
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        addNotification({ message: 'Image size should be less than 5MB', type: 'error' });
        return;
      }
      setUploadData({ ...uploadData, image: file });
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    
    if (!uploadData.image) {
      addNotification({ message: 'Please select an image', type: 'error' });
      return;
    }

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', uploadData.image);
      formData.append('title', uploadData.image.name); // Use filename as title
      formData.append('description', '');
      formData.append('year', new Date().getFullYear());
      formData.append('section', uploadData.section);

      await adminAPI.uploadGallery(formData);
      addNotification({ message: 'Image uploaded successfully!', type: 'success' });
      setShowUploadModal(false);
      setUploadData({ section: 'home', image: null });
      loadGallery();
    } catch (error) {
      addNotification({ message: 'Failed to upload image', type: 'error' });
    } finally {
      setUploading(false);
    }
  };

  // Group images by section
  const sections = {
    home: gallery.filter(img => img.section === 'home' || !img.section),
    rooms: gallery.filter(img => img.section === 'rooms'),
    amenities: gallery.filter(img => img.section === 'amenities'),
    dining: gallery.filter(img => img.section === 'dining'),
    events: gallery.filter(img => img.section === 'events'),
    exterior: gallery.filter(img => img.section === 'exterior')
  };

  const sectionNames = {
    all: 'All Images',
    home: 'Home Page',
    rooms: 'Rooms',
    amenities: 'Amenities',
    dining: 'Dining',
    events: 'Events',
    exterior: 'Exterior'
  };

  const displayedGallery = selectedSection === 'all' ? gallery : sections[selectedSection] || [];

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
          <div className="flex items-center justify-between mt-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Gallery Management</h1>
              <p className="text-slate-400">Manage hotel gallery images by section</p>
            </div>
            <button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center gap-2"
              onClick={() => setShowUploadModal(true)}
            >
              <FiPlus className="w-5 h-5" />
              Upload Image
            </button>
          </div>
        </div>

        {/* Section Filter Tabs */}
        <div className="mb-8 bg-slate-700 bg-opacity-50 backdrop-blur rounded-xl p-2 border border-slate-600">
          <div className="flex flex-wrap gap-2">
            {Object.keys(sectionNames).map((section) => (
              <button
                key={section}
                onClick={() => setSelectedSection(section)}
                className={`px-6 py-3 rounded-lg font-semibold transition ${
                  selectedSection === section
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {sectionNames[section]}
                <span className="ml-2 text-xs opacity-75">
                  ({section === 'all' ? gallery.length : (sections[section]?.length || 0)})
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Current Section Header */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-white">
            {sectionNames[selectedSection]}
          </h2>
          <p className="text-slate-400">
            {displayedGallery.length} {displayedGallery.length === 1 ? 'image' : 'images'}
          </p>
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGallery.map((image) => (
            <div key={image.id} className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl border border-slate-600 overflow-hidden group hover:border-slate-500 transition transform hover:scale-105 duration-300">
              <div className="relative bg-gradient-to-br from-slate-600 to-slate-800 h-56 flex items-center justify-center overflow-hidden">
                {image.imageUrl ? (
                  <img 
                    src={image.imageUrl} 
                    alt={image.title} 
                    className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                  />
                ) : (
                  <FiImage className="w-12 h-12 text-slate-500" />
                )}
                {/* Section Badge */}
                <div className="absolute top-3 right-3 bg-blue-600 text-white text-xs px-3 py-1 rounded-full font-semibold">
                  {sectionNames[image.section] || 'Home Page'}
                </div>
              </div>
              <div className="p-5">
                <div className="mb-3">
                  <p className="text-white font-bold text-lg mb-1">{image.title || 'Image'}</p>
                  <div className="flex items-center gap-2 text-slate-400 text-sm">
                    {image.year && (
                      <span className="bg-slate-600 px-2 py-1 rounded">Year: {image.year}</span>
                    )}
                    <span className="bg-slate-600 px-2 py-1 rounded">
                      {sectionNames[image.section] || 'Home'}
                    </span>
                  </div>
                </div>
                {image.description && (
                  <p className="text-slate-300 text-sm mb-4 line-clamp-2">{image.description}</p>
                )}
                <button
                  onClick={() => handleDeleteImage(image.id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition flex items-center justify-center gap-2 font-semibold"
                >
                  <FiTrash2 className="w-4 h-4" />
                  Delete Image
                </button>
              </div>
            </div>
          ))}
        </div>

        {displayedGallery.length === 0 && (
          <div className="text-center py-16 bg-slate-700 bg-opacity-30 backdrop-blur rounded-2xl border border-slate-600">
            <FiImage className="w-20 h-20 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-300 text-lg font-semibold mb-2">
              No images in {sectionNames[selectedSection]}
            </p>
            <p className="text-slate-400 mb-6">Upload your first image to this section!</p>
            <button 
              onClick={() => setShowUploadModal(true)}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-semibold inline-flex items-center gap-2"
            >
              <FiPlus className="w-5 h-5" />
              Upload Image
            </button>
          </div>
        )}

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700">
              <h2 className="text-2xl font-bold text-white mb-6">Upload Image</h2>
              
              <form onSubmit={handleUpload} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">Section *</label>
                  <select
                    value={uploadData.section}
                    onChange={(e) => setUploadData({ ...uploadData, section: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  >
                    <option value="home">🏠 Home Page</option>
                    <option value="rooms">🛏️ Rooms</option>
                    <option value="amenities">✨ Amenities</option>
                    <option value="dining">🍽️ Dining</option>
                    <option value="events">🎉 Events</option>
                    <option value="exterior">🏨 Exterior</option>
                  </select>
                  <p className="text-xs text-slate-400 mt-1">Choose which page section to display this image</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-200 mb-2">
                    <FiImage className="inline mr-2" />
                    Image File *
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-4 hover:border-blue-500 transition">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageChange}
                      className="w-full px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                    <p className="text-xs text-slate-400 mt-2">Max size: 5MB. Recommended: 1920x1080px. Formats: JPG, PNG, WEBP</p>
                    {uploadData.image && (
                      <div className="mt-3 p-3 bg-green-600 bg-opacity-20 border border-green-600 rounded-lg">
                        <p className="text-sm text-green-400 font-semibold">✓ Selected: {uploadData.image.name}</p>
                        <p className="text-xs text-green-300">{(uploadData.image.size / 1024 / 1024).toFixed(2)} MB</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowUploadModal(false);
                      setUploadData({ title: '', description: '', year: new Date().getFullYear(), section: 'home', image: null });
                    }}
                    className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={uploading}
                    className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-lg transition disabled:opacity-50 font-semibold"
                  >
                    {uploading ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                        Uploading...
                      </span>
                    ) : (
                      'Upload Image'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
