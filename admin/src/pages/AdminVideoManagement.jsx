import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import { FiTrash2, FiEdit2, FiPlus, FiArrowUp, FiArrowDown } from 'react-icons/fi';
import Notification from '../components/Notification';

export default function AdminVideoManagement() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [notification, setNotification] = useState(null);
  const [uploading, setUploading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    displayOrder: 0,
    videoFile: null
  });

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getVideos();
      setVideos(response.data || []);
    } catch (error) {
      showNotification('Error fetching videos', 'error');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 100 * 1024 * 1024) {
        showNotification('Video file too large (max 100MB)', 'error');
        return;
      }
      setFormData(prev => ({
        ...prev,
        videoFile: file
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      showNotification('Please enter a title', 'error');
      return;
    }

    if (!editingId && !formData.videoFile) {
      showNotification('Please select a video file', 'error');
      return;
    }

    try {
      setUploading(true);

      if (editingId) {
        // Update existing video (without file change)
        const updateData = {
          title: formData.title,
          description: formData.description,
          displayOrder: parseInt(formData.displayOrder) || 0
        };
        await adminAPI.updateVideo(editingId, updateData);
        showNotification('Video updated successfully', 'success');
        setEditingId(null);
      } else {
        // Create new video with upload
        const formDataToSend = new FormData();
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('displayOrder', parseInt(formData.displayOrder) || 0);
        formDataToSend.append('video', formData.videoFile);

        await adminAPI.createVideo(formDataToSend);
        showNotification('Video uploaded successfully', 'success');
      }

      setFormData({
        title: '',
        description: '',
        displayOrder: 0,
        videoFile: null
      });
      setShowForm(false);
      await fetchVideos();
    } catch (error) {
      showNotification(error.response?.data?.message || 'Error saving video', 'error');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const handleEdit = (video) => {
    setEditingId(video.id);
    setFormData({
      title: video.title,
      description: video.description,
      displayOrder: video.displayOrder,
      videoFile: null
    });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this video?')) return;

    try {
      await adminAPI.deleteVideo(id);
      showNotification('Video deleted successfully', 'success');
      await fetchVideos();
    } catch (error) {
      showNotification('Error deleting video', 'error');
      console.error(error);
    }
  };

  const handleReorderUp = async (index) => {
    if (index === 0) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index - 1]] = [newVideos[index - 1], newVideos[index]];
    
    const reorderData = newVideos.map((v, i) => ({
      id: v.id,
      displayOrder: i
    }));

    try {
      await adminAPI.reorderVideos(reorderData);
      setVideos(newVideos);
      showNotification('Video order updated', 'success');
    } catch (error) {
      showNotification('Error reordering videos', 'error');
    }
  };

  const handleReorderDown = async (index) => {
    if (index === videos.length - 1) return;
    const newVideos = [...videos];
    [newVideos[index], newVideos[index + 1]] = [newVideos[index + 1], newVideos[index]];
    
    const reorderData = newVideos.map((v, i) => ({
      id: v.id,
      displayOrder: i
    }));

    try {
      await adminAPI.reorderVideos(reorderData);
      setVideos(newVideos);
      showNotification('Video order updated', 'success');
    } catch (error) {
      showNotification('Error reordering videos', 'error');
    }
  };

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800">Homepage Videos</h1>
          {!showForm && (
            <button
              onClick={() => {
                setEditingId(null);
                setFormData({
                  title: '',
                  description: '',
                  displayOrder: 0,
                  videoFile: null
                });
                setShowForm(true);
              }}
              className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
            >
              <FiPlus /> Add Video
            </button>
          )}
        </div>

        {notification && (
          <Notification message={notification.message} type={notification.type} />
        )}

        {/* Form */}
        {showForm && (
          <div className="bg-white rounded-lg shadow-md p-8 mb-8">
            <h2 className="text-2xl font-bold mb-6">
              {editingId ? 'Edit Video' : 'Add New Video'}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Video Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g., Hotel Tour"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    name="displayOrder"
                    value={formData.displayOrder}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-semibold mb-2">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Video description..."
                  rows="4"
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {!editingId && (
                <div>
                  <label className="block text-gray-700 font-semibold mb-2">
                    Video File * (MP4, WebM, Ogg - Max 100MB)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/ogg"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border rounded-lg"
                  />
                  {formData.videoFile && (
                    <p className="text-sm text-green-600 mt-2">
                      ✓ Selected: {formData.videoFile.name}
                    </p>
                  )}
                </div>
              )}

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {uploading ? 'Processing...' : editingId ? 'Update Video' : 'Upload Video'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-gray-400 text-white px-6 py-3 rounded-lg hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Videos List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          </div>
        ) : videos.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center text-gray-600">
            <p className="text-lg">No videos yet. Add your first video to get started!</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left font-semibold">Order</th>
                    <th className="px-6 py-3 text-left font-semibold">Title</th>
                    <th className="px-6 py-3 text-left font-semibold">Description</th>
                    <th className="px-6 py-3 text-left font-semibold">File</th>
                    <th className="px-6 py-3 text-left font-semibold">Status</th>
                    <th className="px-6 py-3 text-left font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {videos.map((video, index) => (
                    <tr key={video.id} className="border-t hover:bg-gray-50">
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleReorderUp(index)}
                            disabled={index === 0}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                            title="Move Up"
                          >
                            <FiArrowUp />
                          </button>
                          <button
                            onClick={() => handleReorderDown(index)}
                            disabled={index === videos.length - 1}
                            className="p-2 hover:bg-gray-200 rounded disabled:opacity-50"
                            title="Move Down"
                          >
                            <FiArrowDown />
                          </button>
                        </div>
                      </td>
                      <td className="px-6 py-3 font-semibold">{video.title}</td>
                      <td className="px-6 py-3 text-sm text-gray-600">
                        {video.description?.substring(0, 50)}...
                      </td>
                      <td className="px-6 py-3 text-sm">
                        <a
                          href={video.videoUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          View Video
                        </a>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                          video.isActive ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
                        }`}>
                          {video.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEdit(video)}
                            className="p-2 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition"
                            title="Edit"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(video.id)}
                            className="p-2 bg-red-100 text-red-600 rounded hover:bg-red-200 transition"
                            title="Delete"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <p className="text-sm text-blue-800">
            💡 <strong>Tip:</strong> Videos are displayed on the homepage in the order specified.
            Use the up/down arrows to reorder them. Active videos will be shown to guests.
          </p>
        </div>
      </div>
    </div>
  );
}
