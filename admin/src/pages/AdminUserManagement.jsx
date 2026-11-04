import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiArrowLeft, FiEdit2, FiTrash2, FiUsers, FiX, FiPlus } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminUserManagement() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    try {
      const data = await adminAPI.getUsers();
      setUsers(data.data || []);
      setLoading(false);
    } catch (error) {
      addNotification({ message: 'Failed to load users', type: 'error' });
      setLoading(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      await adminAPI.deleteUser(userId);
      addNotification({ message: 'User deleted successfully', type: 'success' });
      loadUsers();
    } catch (error) {
      addNotification({ message: 'Failed to delete user', type: 'error' });
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
      
      <div className="max-w-7xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <div className="mt-4">
            <h1 className="text-4xl font-bold text-white mb-2">User Management</h1>
            <p className="text-slate-400">Total Users: <span className="font-semibold text-blue-400">{users.length}</span></p>
          </div>
        </div>

        {/* Users Table */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl border border-slate-600 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-800 bg-opacity-50">
                <tr className="border-b border-slate-600">
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Email</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Name</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Phone</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-200">Role</th>
                  <th className="px-6 py-4 text-center text-sm font-semibold text-slate-200">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user, idx) => (
                  <tr key={user.id} className="border-b border-slate-600 hover:bg-slate-600 bg-opacity-20 transition">
                    <td className="px-6 py-4 text-sm text-slate-300">{user.email}</td>
                    <td className="px-6 py-4 text-sm text-white font-semibold">{user.name || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm text-slate-300">{user.phone || 'N/A'}</td>
                    <td className="px-6 py-4 text-sm">
                      <span className="bg-blue-600 bg-opacity-30 text-blue-300 px-3 py-1 rounded-full text-xs font-semibold">
                        {user.role || 'guest'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-2">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="p-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          
          {users.length === 0 && (
            <div className="text-center py-12">
              <FiUsers className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No users found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}