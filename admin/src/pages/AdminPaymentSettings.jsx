import { useState, useEffect } from 'react';
import { adminAPI } from '../utils/api';
import BackButton from '../components/BackButton';
import { useNotificationStore } from '../store';

function AdminPaymentSettings() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [settings, setSettings] = useState({
    paymentPhoneNumber: '',
    paymentUpiId: '',
    partialPaymentEnabled: true,
    partialPaymentPercentage: 50,
    gstEnabled: true,
    gstPercentage: 12,
    gstType: 'exclusive',
    termsAndConditions: ''
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPaymentSettings(1); // hotelId = 1
      if (response.data) {
        setSettings({
          paymentPhoneNumber: response.data.paymentPhoneNumber || '',
          paymentUpiId: response.data.paymentUpiId || '',
          partialPaymentEnabled: response.data.partialPaymentEnabled !== undefined ? response.data.partialPaymentEnabled : true,
          partialPaymentPercentage: response.data.partialPaymentPercentage !== undefined ? response.data.partialPaymentPercentage : 50,
          gstEnabled: response.data.gstEnabled !== undefined ? response.data.gstEnabled : true,
          gstPercentage: response.data.gstPercentage !== undefined ? response.data.gstPercentage : 12,
          gstType: response.data.gstType || 'exclusive',
          termsAndConditions: response.data.termsAndConditions || ''
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      addNotification({
        type: 'error',
        message: 'Failed to load payment settings'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!settings.paymentPhoneNumber || !settings.paymentUpiId) {
      addNotification({
        type: 'error',
        message: 'Phone number and UPI ID are required'
      });
      return;
    }

    try {
      setSaving(true);
      console.log('Saving payment settings:', settings);
      const response = await adminAPI.updatePaymentSettings(1, settings);
      console.log('Save response:', response);
      addNotification({
        type: 'success',
        message: 'Payment settings updated successfully!'
      });
      
      // Update local state from response so admin sees the changes immediately
      if (response.data && response.data.settings) {
        setSettings({
          paymentPhoneNumber: response.data.settings.paymentPhoneNumber || '',
          paymentUpiId: response.data.settings.paymentUpiId || '',
          partialPaymentEnabled: response.data.settings.partialPaymentEnabled !== undefined ? response.data.settings.partialPaymentEnabled : true,
          partialPaymentPercentage: response.data.settings.partialPaymentPercentage !== undefined ? response.data.settings.partialPaymentPercentage : 50,
          gstEnabled: response.data.settings.gstEnabled !== undefined ? response.data.settings.gstEnabled : true,
          gstPercentage: response.data.settings.gstPercentage !== undefined ? response.data.settings.gstPercentage : 12,
          gstType: response.data.settings.gstType || 'exclusive',
          termsAndConditions: response.data.settings.termsAndConditions || ''
        });
      }
    } catch (error) {
      console.error('Error saving settings:', error);
      console.error('Error response:', error.response);
      addNotification({
        type: 'error',
        message: error.response?.data?.message || 'Failed to save settings'
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="text-lg text-gray-600">Loading...</div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        <BackButton />
        
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Payment Settings</h1>
          <p className="text-gray-600 mt-1">
            Configure payment details displayed to guests during booking
          </p>
        </div>

        <form onSubmit={handleSave} className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Payment Details Section */}
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>💳</span> Payment Details
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Phone Number *
                </label>
                <input
                  type="text"
                  value={settings.paymentPhoneNumber}
                  onChange={(e) => setSettings({ ...settings, paymentPhoneNumber: e.target.value })}
                  placeholder="+91 98427-72999"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Phone number where guests will send payment
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  UPI ID *
                </label>
                <input
                  type="text"
                  value={settings.paymentUpiId}
                  onChange={(e) => setSettings({ ...settings, paymentUpiId: e.target.value })}
                  placeholder="hotel@bharatpe"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  UPI ID for payment collection
                </p>
              </div>
            </div>
          </div>

          {/* Partial Payment Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📊</span> Partial Payment Options
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="partialEnabled"
                  checked={settings.partialPaymentEnabled}
                  onChange={(e) => setSettings({ ...settings, partialPaymentEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="partialEnabled" className="text-sm font-medium text-gray-700">
                  Enable Partial Payment Option
                </label>
              </div>

              {settings.partialPaymentEnabled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Partial Payment Percentage
                  </label>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      min="10"
                      max="90"
                      step="5"
                      value={settings.partialPaymentPercentage}
                      onChange={(e) => setSettings({ ...settings, partialPaymentPercentage: parseInt(e.target.value) })}
                      className="flex-1"
                    />
                    <span className="text-2xl font-bold text-blue-600 min-w-[80px]">
                      {settings.partialPaymentPercentage}%
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Guests can pay this percentage as advance, remaining at check-in
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* GST Configuration Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>🧾</span> GST Configuration
            </h2>
            
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="gstEnabled"
                  checked={settings.gstEnabled}
                  onChange={(e) => setSettings({ ...settings, gstEnabled: e.target.checked })}
                  className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                />
                <label htmlFor="gstEnabled" className="text-sm font-medium text-gray-700">
                  Enable GST Calculation
                </label>
              </div>

              {settings.gstEnabled && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Percentage
                    </label>
                    <div className="flex items-center gap-4">
                      <input
                        type="number"
                        min="0"
                        max="30"
                        step="0.01"
                        value={settings.gstPercentage}
                        onChange={(e) => setSettings({ ...settings, gstPercentage: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <span className="text-2xl font-bold text-black min-w-[60px]">
                        {settings.gstPercentage}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      GST rate to be applied on room charges
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      GST Type
                    </label>
                    <select
                      value={settings.gstType}
                      onChange={(e) => setSettings({ ...settings, gstType: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="exclusive">Exclusive (GST added to price)</option>
                      <option value="inclusive">Inclusive (GST included in price)</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      How GST is calculated and displayed
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>📋</span> Terms and Conditions
            </h2>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Terms (displayed to guests)
              </label>
              <textarea
                value={settings.termsAndConditions}
                onChange={(e) => setSettings({ ...settings, termsAndConditions: e.target.value })}
                rows="8"
                placeholder="Enter payment terms and conditions that will be shown to guests..."
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
              />
              <p className="text-xs text-gray-500 mt-1">
                These terms will be displayed before payment submission
              </p>
            </div>
          </div>

          {/* Preview Section */}
          <div className="border-t pt-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <span>👁️</span> Guest View Preview
            </h2>
            
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span> Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-xl">☎️</span>
                  <div>
                    <p className="text-sm text-gray-500">Phone/UPI</p>
                    <p className="font-semibold text-lg">{settings.paymentPhoneNumber || 'Not set'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 text-xl">💳</span>
                  <div>
                    <p className="text-sm text-gray-500">UPI ID</p>
                    <p className="font-semibold text-lg">{settings.paymentUpiId || 'Not set'}</p>
                  </div>
                </div>
              </div>
              
              {settings.partialPaymentEnabled && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600">
                    <strong>Partial Payment:</strong> Enabled ({settings.partialPaymentPercentage}% advance)
                  </p>
                </div>
              )}

              {settings.gstEnabled && (
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-sm text-gray-600">
                    <strong>GST:</strong> {settings.gstPercentage}% ({settings.gstType})
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <button
              type="button"
              onClick={() => window.history.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:bg-gray-400 flex items-center gap-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Saving...
                </>
              ) : (
                <>
                  <span>💾</span>
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AdminPaymentSettings;
