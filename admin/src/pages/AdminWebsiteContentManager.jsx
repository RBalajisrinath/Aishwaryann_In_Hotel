import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiSave, FiUpload, FiTrash2, FiPlus, FiEdit2, FiX, FiVideo } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API_BASE_URL = '/api';

export default function AdminWebsiteContentManager() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('hero');
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState(null);

  // Hero Section State
  const [heroData, setHeroData] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [uploadingVideo, setUploadingVideo] = useState(false);

  // Features State
  const [features, setFeatures] = useState([]);
  const [editingFeature, setEditingFeature] = useState(null);

  // Contact Info State
  const [contactInfo, setContactInfo] = useState(null);

  // FAQs State
  const [faqs, setFaqs] = useState([]);
  const [editingFAQ, setEditingFAQ] = useState(null);

  // CTA State
  const [ctaData, setCTAData] = useState({});

  useEffect(() => {
    loadContent();
  }, [activeTab]);

  const loadContent = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      if (activeTab === 'hero') {
        const { data } = await axios.get(`${API_BASE_URL}/site-content/hero`);
        setHeroData(data.data);
      } else if (activeTab === 'features') {
        const { data } = await axios.get(`${API_BASE_URL}/site-content/features`);
        setFeatures(data.data);
      } else if (activeTab === 'contact') {
        const { data } = await axios.get(`${API_BASE_URL}/site-content/contact`);
        setContactInfo(data.data);
      } else if (activeTab === 'faqs') {
        const { data } = await axios.get(`${API_BASE_URL}/site-content/faqs`);
        setFaqs(data.data);
      }
    } catch (error) {
      console.error('Error loading content:', error);
      showNotification('Failed to load content', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // ==================== HERO SECTION ====================

  const handleUpdateHero = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_BASE_URL}/site-content/hero`, heroData, config);
      showNotification('Hero section updated successfully');
    } catch (error) {
      console.error('Error updating hero:', error);
      showNotification('Failed to update hero section', 'error');
    }
  };

  const handleVideoUpload = async () => {
    if (!videoFile) {
      showNotification('Please select a video file', 'error');
      return;
    }

    setUploadingVideo(true);
    try {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('video', videoFile);

      await axios.post(`${API_BASE_URL}/site-content/hero/video`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      showNotification('Video uploaded successfully');
      setVideoFile(null);
      loadContent();
    } catch (error) {
      console.error('Error uploading video:', error);
      showNotification(error.response?.data?.message || 'Failed to upload video', 'error');
    } finally {
      setUploadingVideo(false);
    }
  };

  const handleDeleteVideo = async () => {
    if (!confirm('Are you sure you want to delete the background video?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_BASE_URL}/site-content/hero/video`, config);
      showNotification('Video deleted successfully');
      loadContent();
    } catch (error) {
      console.error('Error deleting video:', error);
      showNotification('Failed to delete video', 'error');
    }
  };

  // ==================== FEATURES ====================

  const handleUpdateFeature = async (featureId, updates) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_BASE_URL}/site-content/features/${featureId}`, updates, config);
      showNotification('Feature updated successfully');
      setEditingFeature(null);
      loadContent();
    } catch (error) {
      console.error('Error updating feature:', error);
      showNotification('Failed to update feature', 'error');
    }
  };

  // ==================== CONTACT INFO ====================

  const handleUpdateContact = async () => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_BASE_URL}/site-content/contact`, contactInfo, config);
      showNotification('Contact info updated successfully');
    } catch (error) {
      console.error('Error updating contact:', error);
      showNotification('Failed to update contact information', 'error');
    }
  };

  // ==================== FAQs ====================

  const handleCreateFAQ = async (faqData) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.post(`${API_BASE_URL}/site-content/faqs`, faqData, config);
      showNotification('FAQ added successfully');
      setEditingFAQ(null);
      loadContent();
    } catch (error) {
      console.error('Error creating FAQ:', error);
      showNotification('Failed to create FAQ', 'error');
    }
  };

  const handleUpdateFAQ = async (faqId, updates) => {
    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.put(`${API_BASE_URL}/site-content/faqs/${faqId}`, updates, config);
      showNotification('FAQ updated successfully');
      setEditingFAQ(null);
      loadContent();
    } catch (error) {
      console.error('Error updating FAQ:', error);
      showNotification('Failed to update FAQ', 'error');
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;

    try {
      const token = localStorage.getItem('adminToken');
      const config = { headers: { Authorization: `Bearer ${token}` } };

      await axios.delete(`${API_BASE_URL}/site-content/faqs/${faqId}`, config);
      showNotification('FAQ deleted successfully');
      loadContent();
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      showNotification('Failed to delete FAQ', 'error');
    }
  };

  // ==================== RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg ${
          notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
        } text-white`}>
          {notification.message}
        </div>
      )}

      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <button
          onClick={() => navigate('/admin/dashboard')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <FiArrowLeft className="w-5 h-5 mr-2" />
          Back to Dashboard
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Website Content Manager</h1>
        <p className="text-gray-600 mt-2">Manage all website content from one place</p>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex space-x-2 border-b">
          {[
            { id: 'hero', label: 'Hero Section' },
            { id: 'features', label: 'Features' },
            { id: 'contact', label: 'Contact Info' },
            { id: 'faqs', label: 'FAQs' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* HERO SECTION TAB */}
            {activeTab === 'hero' && heroData && (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Hero Section Settings</h2>

                {/* Background Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">
                    Background Type
                  </label>
                  <div className="flex space-x-4">
                    {['slider', 'video'].map(type => (
                      <label key={type} className="flex items-center text-gray-700 cursor-pointer">
                        <input
                          type="radio"
                          value={type}
                          checked={heroData.backgroundType === type}
                          onChange={(e) => setHeroData({ ...heroData, backgroundType: e.target.value })}
                          className="mr-2 cursor-pointer"
                        />
                        <span className="capitalize">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Video Section */}
                {heroData.backgroundType === 'video' && (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold flex items-center">
                        <FiVideo className="w-5 h-5 mr-2" />
                        Background Video
                      </h3>
                      {heroData.backgroundVideoUrl && (
                        <button
                          onClick={handleDeleteVideo}
                          className="flex items-center px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <FiTrash2 className="w-4 h-4 mr-2" />
                          Delete Video
                        </button>
                      )}
                    </div>

                    {heroData.backgroundVideoUrl ? (
                      <div className="space-y-4">
                        <video
                          src={heroData.backgroundVideoUrl}
                          controls
                          loop
                          className="w-full max-w-2xl rounded-lg"
                        />
                        <p className="text-sm text-gray-600">
                          Current video: {heroData.backgroundVideoUrl}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <input
                          type="file"
                          accept="video/mp4,video/webm,video/ogg"
                          onChange={(e) => setVideoFile(e.target.files[0])}
                          className="block w-full text-sm text-gray-500
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-semibold
                            file:bg-blue-50 file:text-blue-700
                            hover:file:bg-blue-100"
                        />
                        <button
                          onClick={handleVideoUpload}
                          disabled={!videoFile || uploadingVideo}
                          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <FiUpload className="w-4 h-4 mr-2" />
                          {uploadingVideo ? 'Uploading...' : 'Upload Video'}
                        </button>
                        <p className="text-sm text-gray-500">
                          Supported formats: MP4, WebM, OGG. Max size: 100MB
                        </p>
                      </div>
                    )}

                    {/* Video Settings */}
                    <div className="mt-4 space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={heroData.backgroundVideoLoop}
                          onChange={(e) => setHeroData({ ...heroData, backgroundVideoLoop: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Loop video infinitely</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={heroData.backgroundVideoEnabled}
                          onChange={(e) => setHeroData({ ...heroData, backgroundVideoEnabled: e.target.checked })}
                          className="mr-2"
                        />
                        <span className="text-sm text-gray-700">Enable background video</span>
                      </label>
                    </div>
                  </div>
                )}

                {/* Text Content */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Main Title
                    </label>
                    <input
                      type="text"
                      value={heroData.title}
                      onChange={(e) => setHeroData({ ...heroData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subtitle
                    </label>
                    <textarea
                      value={heroData.subtitle}
                      onChange={(e) => setHeroData({ ...heroData, subtitle: e.target.value })}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Button Text
                      </label>
                      <input
                        type="text"
                        value={heroData.primaryButtonText}
                        onChange={(e) => setHeroData({ ...heroData, primaryButtonText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Primary Button Link
                      </label>
                      <input
                        type="text"
                        value={heroData.primaryButtonLink}
                        onChange={(e) => setHeroData({ ...heroData, primaryButtonLink: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Button Text
                      </label>
                      <input
                        type="text"
                        value={heroData.secondaryButtonText}
                        onChange={(e) => setHeroData({ ...heroData, secondaryButtonText: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Secondary Button Link
                      </label>
                      <input
                        type="text"
                        value={heroData.secondaryButtonLink}
                        onChange={(e) => setHeroData({ ...heroData, secondaryButtonLink: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Overlay Opacity (0-100)
                    </label>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={heroData.overlayOpacity}
                      onChange={(e) => setHeroData({ ...heroData, overlayOpacity: parseInt(e.target.value) })}
                      className="w-full"
                    />
                    <span className="text-sm text-gray-600">{heroData.overlayOpacity}%</span>
                  </div>
                </div>

                <button
                  onClick={handleUpdateHero}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiSave className="w-5 h-5 mr-2" />
                  Save Hero Section
                </button>
              </div>
            )}

            {/* FEATURES TAB */}
            {activeTab === 'features' && (
              <div className="space-y-4">
                {features.map(feature => (
                  <div key={feature.id} className="bg-white rounded-lg shadow p-6">
                    {editingFeature === feature.id ? (
                      <div className="space-y-4">
                        <input
                          type="text"
                          value={feature.title}
                          onChange={(e) => {
                            const updated = features.map(f =>
                              f.id === feature.id ? { ...f, title: e.target.value } : f
                            );
                            setFeatures(updated);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Title"
                        />
                        <textarea
                          value={feature.description}
                          onChange={(e) => {
                            const updated = features.map(f =>
                              f.id === feature.id ? { ...f, description: e.target.value } : f
                            );
                            setFeatures(updated);
                          }}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                          placeholder="Description"
                          rows="3"
                        />
                        <input
                          type="text"
                          value={feature.icon}
                          onChange={(e) => {
                            const updated = features.map(f =>
                              f.id === feature.id ? { ...f, icon: e.target.value } : f
                            );
                            setFeatures(updated);
                          }}
                          className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl"
                          placeholder="🏨"
                        />
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleUpdateFeature(feature.id, feature)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => {
                              setEditingFeature(null);
                              loadContent();
                            }}
                            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-4">
                          <span className="text-4xl">{feature.icon}</span>
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">{feature.title}</h3>
                            <p className="text-gray-600 mt-1">{feature.description}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => setEditingFeature(feature.id)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* CONTACT INFO TAB */}
            {activeTab === 'contact' && contactInfo && (
              <div className="bg-white rounded-lg shadow p-6 space-y-6">
                <h2 className="text-xl font-bold text-gray-900">Contact Information</h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <input
                      type="text"
                      value={contactInfo.phone}
                      onChange={(e) => setContactInfo({ ...contactInfo, phone: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={contactInfo.email}
                      onChange={(e) => setContactInfo({ ...contactInfo, email: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Physical Address
                    </label>
                    <textarea
                      value={contactInfo.address}
                      onChange={(e) => setContactInfo({ ...contactInfo, address: e.target.value })}
                      rows="2"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>



                <button
                  onClick={handleUpdateContact}
                  className="flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <FiSave className="w-5 h-5 mr-2" />
                  Save Contact Information
                </button>
              </div>
            )}

            {/* FAQs TAB */}
            {activeTab === 'faqs' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-bold text-gray-900">Frequently Asked Questions</h2>
                  <button
                    onClick={() => setEditingFAQ({ id: 'new', question: '', answer: '', category: 'general', displayOrder: faqs.length + 1 })}
                    className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    <FiPlus className="w-4 h-4 mr-2" />
                    Add FAQ
                  </button>
                </div>

                {editingFAQ && (
                  <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {editingFAQ.id === 'new' ? 'Create New FAQ' : 'Edit FAQ'}
                    </h3>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question
                      </label>
                      <input
                        type="text"
                        value={editingFAQ.question}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, question: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter the question"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Answer
                      </label>
                      <textarea
                        value={editingFAQ.answer}
                        onChange={(e) => setEditingFAQ({ ...editingFAQ, answer: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        placeholder="Enter the answer"
                        rows="4"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Category
                        </label>
                        <select
                          value={editingFAQ.category}
                          onChange={(e) => setEditingFAQ({ ...editingFAQ, category: e.target.value })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        >
                          <option value="general">General</option>
                          <option value="booking">Booking</option>
                          <option value="policy">Policy</option>
                          <option value="payment">Payment</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Display Order
                        </label>
                        <input
                          type="number"
                          value={editingFAQ.displayOrder}
                          onChange={(e) => setEditingFAQ({ ...editingFAQ, displayOrder: parseInt(e.target.value) })}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                        />
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          if (editingFAQ.id === 'new') {
                            handleCreateFAQ(editingFAQ);
                          } else {
                            handleUpdateFAQ(editingFAQ.id, editingFAQ);
                          }
                        }}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingFAQ.id === 'new' ? 'Create' : 'Save'}
                      </button>
                      <button
                        onClick={() => setEditingFAQ(null)}
                        className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {faqs.map(faq => (
                  <div key={faq.id} className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-800 rounded">
                            {faq.category}
                          </span>
                          <span className="text-sm text-gray-500">Order: {faq.displayOrder}</span>
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">{faq.question}</h3>
                        <p className="text-gray-600">{faq.answer}</p>
                      </div>
                      <div className="flex space-x-2 ml-4">
                        <button
                          onClick={() => setEditingFAQ(faq)}
                          className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteFAQ(faq.id)}
                          className="px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
