import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiArrowLeft, FiSave, FiEye, FiEyeOff } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminProfileUpdate() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showPasswords, setShowPasswords] = useState({ current: false, new: false, confirm: false });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '',
        email: user.email || '',
        phone: user.phone || '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    }
  }, [user]);

  const validateForm = () => {
    if (!formData.name.trim()) {
      addNotification({ message: 'Name is required', type: 'error' });
      return false;
    }

    if (!formData.email.trim()) {
      addNotification({ message: 'Email is required', type: 'error' });
      return false;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      addNotification({ message: 'Please enter a valid email address', type: 'error' });
      return false;
    }

    if (!formData.phone.trim()) {
      addNotification({ message: 'Phone is required', type: 'error' });
      return false;
    }

    if (formData.newPassword) {
      if (!formData.currentPassword) {
        addNotification({ message: 'Current password required to change password', type: 'error' });
        return false;
      }

      if (formData.newPassword.length < 6) {
        addNotification({ message: 'New password must be at least 6 characters', type: 'error' });
        return false;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        addNotification({ message: 'Passwords do not match', type: 'error' });
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.phone
      };

      if (formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await adminAPI.updateProfile(updateData);
      addNotification({ message: 'Profile updated successfully', type: 'success' });

      // Update the user state in the auth store
      const updatedUser = {
        ...user,
        firstName: formData.name.split(' ')[0],
        lastName: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email,
        phone: formData.phone
      };
      setUser(updatedUser);

      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setShowPasswordForm(false);
    } catch (error) {
      addNotification({
        message: error.response?.data?.message || 'Failed to update profile',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <h1 className="text-4xl font-bold text-white mt-4">Profile Update</h1>
        </div>

        {/* Profile Form */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-slate-600">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info Section */}
            <div className="pb-6 border-b border-slate-600">
              <h2 className="text-xl font-semibold text-white mb-4">Basic Information</h2>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">Name</label>
                <div className="relative">
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="Your name"
                    required
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">Email</label>
                <div className="relative">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="your@email.com"
                    required
                  />
                </div>
                <p className="text-xs text-slate-400 mt-1">Changing your email will update your login credentials</p>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-200 mb-2">Phone</label>
                <div className="relative">
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                    placeholder="+91 XXXXX XXXXX"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Password Change Section */}
            <div>
              <button
                type="button"
                onClick={() => setShowPasswordForm(!showPasswordForm)}
                className="flex items-center gap-2 text-blue-400 hover:text-blue-300 font-semibold transition"
              >
                {showPasswordForm ? 'Hide Password Change' : 'Change Password'}
              </button>

              {showPasswordForm && (
                <div className="mt-4 pt-4 border-t border-slate-600 space-y-4">
                  <p className="text-sm text-slate-300">
                    To change your password, enter your current password and the new password you wish to use.
                  </p>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Current Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.current ? 'text' : 'password'}
                        value={formData.currentPassword}
                        onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                        className="w-full px-4 pr-12 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Enter your current password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, current: !showPasswords.current })}
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPasswords.current ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.new ? 'text' : 'password'}
                        value={formData.newPassword}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        className="w-full px-4 pr-12 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Enter new password (min 6 characters)"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, new: !showPasswords.new })}
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPasswords.new ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-200 mb-2">Confirm New Password</label>
                    <div className="relative">
                      <input
                        type={showPasswords.confirm ? 'text' : 'password'}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="w-full px-4 pr-12 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswords({ ...showPasswords, confirm: !showPasswords.confirm })}
                        className="absolute right-4 top-3 text-slate-400 hover:text-slate-200"
                      >
                        {showPasswords.confirm ? <FiEyeOff className="w-5 h-5" /> : <FiEye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  {formData.newPassword && (
                    <div className="mt-3 p-3 bg-slate-600 bg-opacity-50 rounded-lg border border-slate-500">
                      <p className="text-sm text-slate-200">
                        <span className={formData.newPassword.length >= 6 ? 'text-green-400' : 'text-yellow-400'}>
                          ✓ Password length: {formData.newPassword.length}/6
                        </span>
                      </p>
                      <p className="text-sm text-slate-200 mt-1">
                        <span className={formData.newPassword === formData.confirmPassword && formData.confirmPassword ? 'text-green-400' : 'text-slate-400'}>
                          ✓ Passwords match
                        </span>
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-slate-600 disabled:to-slate-600 text-white px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 disabled:scale-100 flex items-center justify-center gap-2"
            >
              <FiSave className="w-5 h-5" />
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
