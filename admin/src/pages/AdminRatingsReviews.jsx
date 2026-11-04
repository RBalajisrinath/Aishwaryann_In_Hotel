import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiArrowLeft, FiStar, FiTrash2 } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminRatingsReviews() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [ratings, setRatings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRatings();
  }, []);

  const loadRatings = async () => {
    try {
      const data = await adminAPI.getRatings();
      setRatings(data.data || []);
      setLoading(false);
    } catch (error) {
      addNotification({ message: 'Failed to load ratings', type: 'error' });
      setLoading(false);
    }
  };

  const handleDeleteRating = async (id) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await adminAPI.deleteRating(id);
      addNotification({ message: 'Review deleted successfully', type: 'success' });
      loadRatings();
    } catch (error) {
      addNotification({ message: 'Failed to delete review', type: 'error' });
    }
  };

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
      
      <div className="max-w-5xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-4xl font-bold text-white mb-2">Ratings & Reviews</h1>
            <p className="text-slate-400">Total Reviews: <span className="font-semibold text-blue-400">{ratings.length}</span></p>
          </div>
        </div>

        {/* Reviews List */}
        <div className="space-y-4">
          {ratings.map((rating) => (
            <div key={rating.id} className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-6 border border-slate-600 hover:border-slate-500 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-white font-semibold text-lg">{rating.guestName || 'Anonymous'}</p>
                  <p className="text-slate-400 text-sm">Room: {rating.roomType || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <FiStar
                      key={i}
                      className={`w-5 h-5 ${i < rating.rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-500'}`}
                    />
                  ))}
                </div>
              </div>

              <p className="text-slate-300 mb-4">{rating.comment || 'No comment provided'}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-600">
                <p className="text-xs text-slate-500">{new Date(rating.createdAt).toLocaleDateString()}</p>
                <button
                  onClick={() => handleDeleteRating(rating.id)}
                  className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                >
                  <FiTrash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {ratings.length === 0 && (
          <div className="text-center py-12">
            <FiStar className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No reviews yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
