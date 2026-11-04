import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore, useNotificationStore } from '../store';
import { adminAPI } from '../utils/api';
import { FiArrowLeft, FiGlobe, FiToggleRight } from 'react-icons/fi';
import BackButton from '../components/BackButton';

export default function AdminWebsiteStatus() {
  const navigate = useNavigate();
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [status, setStatus] = useState({ isOpen: true, maintenanceMessage: '' });

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      const data = await adminAPI.getStatus();
      setStatus(data.data || { isOpen: true, maintenanceMessage: '' });
    } catch (error) {
      addNotification({ message: 'Failed to load website status', type: 'error' });
    }
  };

  const handleToggle = async () => {
    try {
      await adminAPI.updateStatus({ isOpen: !status.isOpen });
      setStatus({...status, isOpen: !status.isOpen});
      addNotification({ message: `Website ${!status.isOpen ? 'opened' : 'closed'} successfully`, type: 'success' });
    } catch (error) {
      addNotification({ message: 'Failed to update status', type: 'error' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 opacity-10 pointer-events-none" />
      
      <div className="max-w-4xl mx-auto px-4 py-8 relative z-10">
        {/* Header */}
        <div className="mb-8">
          <BackButton />
          <h1 className="text-4xl font-bold text-white mt-4">Website Status</h1>
        </div>

        {/* Status Card */}
        <div className="bg-slate-700 bg-opacity-50 backdrop-blur rounded-2xl p-8 border border-slate-600">
          <div className="flex items-center justify-between mb-8 pb-8 border-b border-slate-600">
            <div className="flex items-center gap-4">
              <div className={`p-4 rounded-xl ${status.isOpen ? 'bg-green-600' : 'bg-red-600'} bg-opacity-20`}>
                <FiGlobe className={`w-8 h-8 ${status.isOpen ? 'text-green-400' : 'text-red-400'}`} />
              </div>
              <div>
                <p className="text-slate-400 text-sm">Current Status</p>
                <p className={`text-2xl font-bold ${status.isOpen ? 'text-green-400' : 'text-red-400'}`}>
                  {status.isOpen ? 'Online' : 'Under Maintenance'}
                </p>
              </div>
            </div>
            <button
              onClick={handleToggle}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition transform hover:scale-105 ${
                status.isOpen
                  ? 'bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800'
                  : 'bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800'
              } text-white`}
            >
              <FiToggleRight className="w-5 h-5" />
              {status.isOpen ? 'Go Offline' : 'Go Online'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-200 mb-2">Maintenance Message</label>
            <textarea
              value={status.maintenanceMessage || ''}
              onChange={(e) => setStatus({...status, maintenanceMessage: e.target.value})}
              placeholder="Enter maintenance message"
              className="w-full px-4 py-3 bg-slate-600 bg-opacity-50 border border-slate-500 text-white placeholder-slate-400 rounded-lg focus:ring-2 focus:ring-blue-500 transition h-32 resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
