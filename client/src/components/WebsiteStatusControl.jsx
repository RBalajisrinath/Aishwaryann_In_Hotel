import React, { useState, useEffect } from 'react';
import { adminAPI } from '../api';
import { useNotificationStore } from '../store';

export default function WebsiteStatusControl() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const addNotification = useNotificationStore((state) => state.addNotification);

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getWebsiteStatus();
      setStatus(response.data);
    } catch (error) {
      addNotification('Failed to fetch website status', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseWebsite = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.closeWebsite(message || 'Website is under maintenance');
      setStatus(response.data.status);
      setMessage('');
      addNotification('Website closed successfully', 'success');
    } catch (error) {
      addNotification('Failed to close website', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenWebsite = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.openWebsite();
      setStatus(response.data.status);
      addNotification('Website opened successfully', 'success');
    } catch (error) {
      addNotification('Failed to open website', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleWebsite = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.toggleWebsite(message || 'Website is under maintenance');
      setStatus(response.data.status);
      setMessage('');
      addNotification(
        `Website ${response.data.status.isOpen ? 'opened' : 'closed'} successfully`,
        'success'
      );
    } catch (error) {
      addNotification('Failed to toggle website status', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!status) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Website Status Control</h2>
        <p className="text-gray-600">Manage website availability for users</p>
      </div>

      {/* Current Status */}
      <div className="mb-6">
        <div
          className={`inline-flex items-center px-4 py-2 rounded-full ${
            status.isOpen
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
          }`}
        >
          <div
            className={`w-3 h-3 rounded-full mr-2 ${
              status.isOpen ? 'bg-green-600' : 'bg-red-600'
            }`}
          ></div>
          <span className="font-semibold">
            {status.isOpen ? 'Website is OPEN' : 'Website is CLOSED'}
          </span>
        </div>

        {status.maintenanceMessage && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-sm text-yellow-800">
              <span className="font-semibold">Maintenance Message:</span> {status.maintenanceMessage}
            </p>
          </div>
        )}

        {status.closedAt && (
          <div className="mt-4 text-sm text-gray-600">
            <p>Closed at: {new Date(status.closedAt).toLocaleString()}</p>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maintenance Message (optional)
          </label>
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter custom maintenance message..."
            rows="3"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        <div className="flex gap-3 flex-wrap">
          {status.isOpen ? (
            <>
              <button
                onClick={handleCloseWebsite}
                disabled={loading}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Closing...' : 'Close Website'}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleOpenWebsite}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {loading ? 'Opening...' : 'Open Website'}
              </button>
            </>
          )}

          <button
            onClick={handleToggleWebsite}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
          >
            {loading ? 'Toggling...' : 'Toggle Status'}
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-900 mb-2">How It Works</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• When closed, users see a maintenance page</li>
          <li>• Admins can always access the website</li>
          <li>• Authentication still works for all users</li>
          <li>• Only affects hotel, booking, and bill endpoints</li>
        </ul>
      </div>
    </div>
  );
}
