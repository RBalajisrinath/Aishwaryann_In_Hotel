import React, { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import Notification from '../components/Notification';
import { useNotificationStore } from '../store';
import BackButton from '../components/BackButton';
import { FiSave, FiX } from 'react-icons/fi';

export default function AdminPoliciesManagement() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [loading, setLoading] = useState(false);
  const [policy, setPolicy] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    checkInTime: '',
    checkOutTime: '',
    idRequirement: '',
    cancellationPolicy: '',
    additionalInfo: ''
  });

  useEffect(() => {
    fetchPolicy();
  }, []);

  const fetchPolicy = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getHotelPolicies(1);
      // Get the first policy (regular days)
      if (response.data.policies && response.data.policies.length > 0) {
        const singlePolicy = response.data.policies[0];
        setPolicy(singlePolicy);
        setFormData({
          checkInTime: singlePolicy.checkInTime,
          checkOutTime: singlePolicy.checkOutTime,
          idRequirement: singlePolicy.idRequirement_text || '',
          cancellationPolicy: singlePolicy.cancellationPolicy,
          additionalInfo: singlePolicy.additionalInfo || ''
        });
      }
    } catch (error) {
      addNotification({
        message: error.response?.data?.message || 'Failed to load policies',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      await adminAPI.updateHotelPolicy(1, 'regular', formData);
      addNotification({
        message: 'Policy updated successfully!',
        type: 'success'
      });
      setIsEditing(false);
      fetchPolicy();
    } catch (error) {
      addNotification({
        message: error.response?.data?.message || 'Failed to update policy',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <BackButton />
        
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Hotel Policies</h1>
          <p className="text-gray-600">
            Configure check-in/check-out times and hotel policies
          </p>
        </div>

        {loading && !isEditing ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading policies...</p>
          </div>
        ) : policy ? (
          <>
            {/* Policy Display Card */}
            {!isEditing && (
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6 bg-blue-50 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900">Hotel Policies</h2>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition font-medium"
                    >
                      Edit Policy
                    </button>
                  </div>
                </div>

                <div className="p-8 space-y-6">
                  {/* Timing */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Check-in Time</p>
                      <p className="font-bold text-2xl text-gray-900">{formData.checkInTime}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-600 mb-2">Check-out Time</p>
                      <p className="font-bold text-2xl text-gray-900">{formData.checkOutTime}</p>
                    </div>
                  </div>

                  {/* Policies */}
                  <div className="space-y-4 border-t pt-6">
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-2">ID Requirement</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.idRequirement}</p>
                    </div>
                    <div>
                      <p className="text-sm font-bold text-gray-900 mb-2">Cancellation Policy</p>
                      <p className="text-gray-700 whitespace-pre-wrap">{formData.cancellationPolicy}</p>
                    </div>
                    {formData.additionalInfo && (
                      <div>
                        <p className="text-sm font-bold text-gray-900 mb-2">Additional Information</p>
                        <p className="text-gray-700 whitespace-pre-wrap">{formData.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Edit Form */}
            {isEditing && (
              <div className="bg-white rounded-lg shadow-md p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Edit Hotel Policies</h2>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-gray-500 hover:text-gray-700 transition"
                  >
                    <FiX className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-6">
                  {/* Check-in/Check-out Times */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-in Time *
                      </label>
                      <input
                        type="text"
                        value={formData.checkInTime}
                        onChange={(e) => setFormData({ ...formData, checkInTime: e.target.value })}
                        placeholder="e.g., 12:00 PM"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Check-out Time *
                      </label>
                      <input
                        type="text"
                        value={formData.checkOutTime}
                        onChange={(e) => setFormData({ ...formData, checkOutTime: e.target.value })}
                        placeholder="e.g., 11:00 AM"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* ID Requirement */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ID Requirement *
                    </label>
                    <textarea
                      value={formData.idRequirement}
                      onChange={(e) => setFormData({ ...formData, idRequirement: e.target.value })}
                      rows="3"
                      placeholder="Please carry a valid government-issued photo ID"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {/* Cancellation Policy */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cancellation Policy *
                    </label>
                    <textarea
                      value={formData.cancellationPolicy}
                      onChange={(e) => setFormData({ ...formData, cancellationPolicy: e.target.value })}
                      rows="3"
                      placeholder="Free cancellation up to 48 hours before check-in"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {/* Additional Info */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Additional Information
                    </label>
                    <textarea
                      value={formData.additionalInfo}
                      onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
                      rows="3"
                      placeholder="Any additional policies or information"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    />
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-4 pt-6 border-t">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <FiSave className="w-5 h-5" />
                      {loading ? 'Saving...' : 'Save Policy'}
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex-1 bg-gray-300 text-gray-700 px-6 py-3 rounded-lg hover:bg-gray-400 transition font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12 bg-white rounded-lg">
            <p className="text-gray-600">No policies found</p>
          </div>
        )}
      </div>
    </div>
  );
}
