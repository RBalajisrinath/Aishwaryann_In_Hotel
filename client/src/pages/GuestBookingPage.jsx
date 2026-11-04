import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { guestBookingAPI, hotelAPI } from '../api';
import { onEvent, offEvent } from '../socket';
import { useNotificationStore } from '../store';
import Notification from '../components/Notification';

export default function GuestBookingPage() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const addNotification = useNotificationStore((state) => state.addNotification);

  const [step, setStep] = useState(1); // 1: Email, 2: OTP, 3: Payment, 4: Booking Details
  const [loading, setLoading] = useState(false);
  const [room, setRoom] = useState(null);
  const [hotel, setHotel] = useState(null);
  const [paymentSettings, setPaymentSettings] = useState(null);

  // Step 1: Email
  const [email, setEmail] = useState('');
  const [otpSent, setOtpSent] = useState(false);

  // Step 2: OTP
  const [otp, setOtp] = useState('');
  const [sessionToken, setSessionToken] = useState('');

  // Step 3: Payment
  const [paymentType, setPaymentType] = useState('full'); // 'full' or 'partial'
  const [paymentProof, setPaymentProof] = useState(null);
  const [transactionId, setTransactionId] = useState('');
  const [selectedNumberOfRooms, setSelectedNumberOfRooms] = useState(1);
  // ID proof fields (personal details)
  const [proofType, setProofType] = useState('Aadhaar');
  const [idProofFile, setIdProofFile] = useState(null);

  // Step 4: Booking Details
  const [bookingData, setBookingData] = useState({
    name: '',
    phone: '',
    checkInDate: '',
    checkOutDate: '',
    numberOfGuests: 1,
    numberOfRooms: 1,
    specialRequests: ''
  });
  // Separate adult/children counters for clearer UI
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);

  // Keep bookingData.numberOfGuests in sync with adults + children
  useEffect(() => {
    setBookingData(prev => ({ ...prev, numberOfGuests: adults + children }));
  }, [adults, children]);

  useEffect(() => {
    loadRoomDetails();
    loadPaymentSettings();
    
    // Pre-fill dates from URL parameters
    const searchParams = new URLSearchParams(location.search);
    const checkIn = searchParams.get('checkIn');
    const checkOut = searchParams.get('checkOut');
    
    if (checkIn && checkOut) {
      setBookingData(prev => ({
        ...prev,
        checkInDate: checkIn,
        checkOutDate: checkOut
      }));
    }
    // initialize adults/children from bookingData
    setAdults(bookingData.numberOfGuests || 1);
    setChildren(0);
  }, [roomId, location.search]);

  // Listen for realtime payment settings updates and refresh local state
  useEffect(() => {
    const handlePaymentSettingsUpdated = (data) => {
      console.log('📡 Received paymentSettingsUpdated event:', data);
      try {
        if (!data) {
          console.warn('⚠️ No data in paymentSettingsUpdated event');
          return;
        }
        const { hotelId: updatedHotelId, settings } = data;
        if (settings) {
          // Update if this is for hotel 1 (currently hardcoded) or if it matches current hotel
          console.log(`✓ Updating payment settings from broadcast`);
          setPaymentSettings(settings);
          addNotification({ message: 'Payment settings updated', type: 'info' });
        }
      } catch (err) {
        console.error('Error in handlePaymentSettingsUpdated:', err);
      }
    };

    console.log('📋 Registering paymentSettingsUpdated socket listener');
    onEvent('paymentSettingsUpdated', handlePaymentSettingsUpdated);
    return () => {
      console.log('📋 Unregistering paymentSettingsUpdated socket listener');
      offEvent('paymentSettingsUpdated');
    };
  }, []);

  const loadRoomDetails = async () => {
    try {
      // Get all hotels with rooms
      const response = await hotelAPI.getAll();
      const hotels = response.data;

      // Find the room
      let foundRoom = null;
      let foundHotel = null;

      for (const hotel of hotels) {
        const room = hotel.rooms?.find(r => r.id === parseInt(roomId));
        if (room) {
          foundRoom = room;
          foundHotel = hotel;
          break;
        }
      }

      if (foundRoom && foundHotel) {
        setRoom(foundRoom);
        setHotel(foundHotel);
      } else {
        addNotification({ message: 'Room not found', type: 'error' });
        navigate('/browse');
      }
    } catch (error) {
      addNotification({ message: 'Failed to load room details', type: 'error' });
    }
  };

  const loadPaymentSettings = async () => {
    try {
      console.log('Loading payment settings...');
      const response = await hotelAPI.getPaymentSettings(1); // hotelId = 1
      console.log('Payment settings response:', response);
      
      if (response.data) {
        setPaymentSettings(response.data);
        console.log('Payment settings loaded:', response.data);
      } else {
        console.warn('No payment settings data in response, using defaults');
        setPaymentSettings({
          paymentPhoneNumber: '+91 9443224498',
          paymentUpiId: 'hotel@bharatpe',
          partialPaymentEnabled: true,
          partialPaymentPercentage: 50,
          gstEnabled: false,
          gstPercentage: 0,
          gstType: 'exclusive',
          termsAndConditions: ''
        });
      }
    } catch (error) {
      console.error('Failed to load payment settings:', error);
      console.error('Error details:', error.response);
      // Set defaults if API fails - always set something so page doesn't hang
      setPaymentSettings({
        paymentPhoneNumber: '+91 98427-72999',
        paymentUpiId: 'hotel@bharatpe',
        partialPaymentEnabled: true,
        partialPaymentPercentage: 50,
        gstEnabled: false,
        gstPercentage: 0,
        gstType: 'exclusive',
        termsAndConditions: ''
      });
    }
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      addNotification({ message: 'Please enter a valid email', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      console.log('Sending OTP to:', email);
      const response = await guestBookingAPI.sendOTP(email);
      console.log('OTP Response:', response);
      setOtpSent(true);
      setStep(2);
      addNotification({ message: 'OTP sent to your email! Check your inbox.', type: 'success' });
    } catch (error) {
      console.error('OTP Send Error:', error);
      console.error('Error response:', error.response);
      addNotification({ 
        message: error.response?.data?.message || error.message || 'Failed to send OTP. Please try again.', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();

    if (!otp || otp.length !== 6) {
      addNotification({ message: 'Please enter a valid 6-digit OTP', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const response = await guestBookingAPI.verifyOTP(email, otp);
      setSessionToken(response.data.sessionToken);
      
      // Ensure payment settings are loaded before moving to step 3
      if (!paymentSettings) {
        await loadPaymentSettings();
      }
      
      setStep(3);
      addNotification({ message: 'OTP verified! Please complete payment', type: 'success' });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Invalid OTP', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!bookingData.checkInDate || !bookingData.checkOutDate) {
      addNotification({ message: 'Please select check-in and check-out dates', type: 'error' });
      return;
    }

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      addNotification({ message: 'Check-in date cannot be in the past', type: 'error' });
      return;
    }

    if (checkOut <= checkIn) {
      addNotification({ message: 'Check-out must be after check-in', type: 'error' });
      return;
    }

    if (!paymentProof) {
      addNotification({ message: 'Please upload payment screenshot', type: 'error' });
      return;
    }

    if (!transactionId || transactionId.length < 5) {
      addNotification({ message: 'Please enter valid transaction ID', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Update booking data with selected number of rooms
      setBookingData(prev => ({
        ...prev,
        numberOfRooms: selectedNumberOfRooms
      }));

      // Move to booking details step
      setStep(4);
      addNotification({ message: 'Payment recorded! Please fill booking details', type: 'success' });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to process payment', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!bookingData.name || !bookingData.phone || !bookingData.checkInDate || !bookingData.checkOutDate) {
      addNotification({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    const checkIn = new Date(bookingData.checkInDate);
    const checkOut = new Date(bookingData.checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      addNotification({ message: 'Check-in date cannot be in the past', type: 'error' });
      return;
    }

    if (checkOut <= checkIn) {
      addNotification({ message: 'Check-out must be after check-in', type: 'error' });
      return;
    }

    // Submit final booking
    handleFinalBooking(e);
  };

  const handleFinalBooking = async (e) => {
    e.preventDefault();

    // Validate payment proof
    if (!paymentProof) {
      addNotification({ message: 'Please upload payment screenshot', type: 'error' });
      return;
    }

    if (!transactionId || transactionId.length < 5) {
      addNotification({ message: 'Please enter valid transaction ID', type: 'error' });
      return;
    }

    // ID proof is mandatory
    if (!proofType) {
      addNotification({ message: 'Please select ID proof type (Aadhaar / Passport / Driving License)', type: 'error' });
      return;
    }

    if (!idProofFile) {
      addNotification({ message: 'Please upload ID proof document (required)', type: 'error' });
      return;
    }

    try {
      setLoading(true);

      // Create FormData for file upload
      const formData = new FormData();
      formData.append('sessionToken', sessionToken);
      formData.append('email', email);
      formData.append('name', bookingData.name);
      formData.append('phone', bookingData.phone);
      formData.append('roomId', parseInt(roomId));
      formData.append('checkInDate', bookingData.checkInDate);
      formData.append('checkOutDate', bookingData.checkOutDate);
      formData.append('numberOfGuests', parseInt(bookingData.numberOfGuests));
      formData.append('numberOfAdults', parseInt(adults));
      formData.append('numberOfChildren', parseInt(children));
      formData.append('numberOfRooms', parseInt(bookingData.numberOfRooms));
      formData.append('numberOfNights', calculateNights()); // Send calculated nights to backend
      formData.append('specialRequests', bookingData.specialRequests);
      formData.append('paymentType', paymentType);
      formData.append('transactionId', transactionId);
      formData.append('paymentProof', paymentProof);
      // Add ID proof fields (mandatory)
      formData.append('proofType', proofType);
      formData.append('proofFile', idProofFile);

      const response = await guestBookingAPI.createBookingWithPayment(formData);

      // Navigate to success page with booking details
      navigate('/booking-success', { 
        state: { booking: response.data.booking } 
      });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to create booking', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateNights = () => {
    if (bookingData.checkInDate && bookingData.checkOutDate) {
      const checkIn = new Date(bookingData.checkInDate);
      const checkOut = new Date(bookingData.checkOutDate);
      const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
      return nights > 0 ? nights : 0;
    }
    return 0;
  };

  const calculateTotal = () => {
    const nights = calculateNights();
    // Use selectedNumberOfRooms in Step 3, bookingData.numberOfRooms in Step 4
    const numRooms = step === 3 ? selectedNumberOfRooms : bookingData.numberOfRooms;
    return room ? nights * room.pricePerNight * numRooms : 0;
  };

  const calculatePaymentAmount = () => {
    const total = calculateTotal();
    if (paymentType === 'full') {
      return total;
    } else {
      const percentage = paymentSettings?.partialPaymentPercentage || 50;
      return Math.round(total * percentage / 100);
    }
  };

  const calculatePaymentAmountForRooms = () => {
    const nights = calculateNights();
    const total = room ? nights * room.pricePerNight * selectedNumberOfRooms : 0;
    if (paymentType === 'full') {
      return total;
    } else {
      const percentage = paymentSettings?.partialPaymentPercentage || 50;
      return Math.round(total * percentage / 100);
    }
  };

  const calculateRemainingAmount = () => {
    const total = calculateTotal();
    const paid = calculatePaymentAmount();
    return total - paid;
  };

  const calculateGSTAmount = () => {
    // Check if room has GST settings, otherwise use global payment settings
    const gstEnabled = room?.gstEnabled !== undefined ? room.gstEnabled : paymentSettings?.gstEnabled;
    const gstPercentage = room?.gstPercentage !== undefined ? room.gstPercentage : paymentSettings?.gstPercentage;
    const gstType = room?.gstType !== undefined ? room.gstType : paymentSettings?.gstType;
    
    if (!gstEnabled) return 0;
    
    const subtotal = calculateTotal();
    const gstRate = gstPercentage || 0;
    
    if (gstType === 'inclusive') {
      // For inclusive GST: GST = (subtotal * gstRate) / (100 + gstRate)
      return Math.round((subtotal * gstRate) / (100 + gstRate));
    } else {
      // For exclusive GST: GST = subtotal * gstRate / 100
      return Math.round(subtotal * gstRate / 100);
    }
  };

  const calculateTotalWithGST = () => {
    const subtotal = calculateTotal();
    const gstAmount = calculateGSTAmount();
    
    // Check if room has GST settings, otherwise use global payment settings
    const gstType = room?.gstType !== undefined ? room.gstType : paymentSettings?.gstType;
    
    if (gstType === 'inclusive') {
      return subtotal; // GST already included in subtotal
    } else {
      return subtotal + gstAmount; // Add GST to subtotal
    }
  };

  const calculatePaymentAmountWithGST = () => {
    const total = calculateTotalWithGST();
    if (paymentType === 'full') {
      return total;
    } else {
      const percentage = paymentSettings?.partialPaymentPercentage || 50;
      return Math.round(total * percentage / 100);
    }
  };

  const calculateRemainingAmountWithGST = () => {
    const total = calculateTotalWithGST();
    const paid = calculatePaymentAmountWithGST();
    return total - paid;
  };

  if (!room || !hotel) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Book Your Stay</h1>
          <div className="flex items-center gap-4 text-gray-600">
            <span className="font-semibold text-blue-600">{hotel.name}</span>
            <span>•</span>
            <span>{room.type} Room</span>
            <span>•</span>
            <span className="text-green-600 font-semibold">₹{room.pricePerNight}/night</span>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className={`flex items-center ${step >= 1 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="ml-2 font-medium text-sm">Email</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 2 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 2 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="ml-2 font-medium text-sm">OTP</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 3 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 3 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 3 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                {step > 3 ? '✓' : '3'}
              </div>
              <span className="ml-2 font-medium text-sm">Payment & Dates</span>
            </div>
            <div className={`flex-1 h-1 mx-2 ${step >= 4 ? 'bg-blue-600' : 'bg-gray-200'}`}></div>
            <div className={`flex items-center ${step >= 4 ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 4 ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
                4
              </div>
              <span className="ml-2 font-medium text-sm">Personal Details</span>
            </div>
          </div>
        </div>

        {/* Step 1: Email */}
        {step === 1 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Enter Your Email</h2>
            <p className="text-gray-600 mb-6">We'll send you a one-time password to verify your identity.</p>
            <form onSubmit={handleSendOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address *
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
              >
                {loading ? 'Sending...' : 'Send OTP'}
              </button>
            </form>
          </div>
        )}

        {/* Step 2: OTP Verification */}
        {step === 2 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Verify Your Email</h2>
            <p className="text-gray-600 mb-6">
              We've sent a 6-digit OTP code to <strong>{email}</strong>. Please check your email and spam folder.
            </p>

            {/* Wrong Email Warning */}
            <div className="mb-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-yellow-700">
                    <strong>Didn't receive the code?</strong> Check your spam/promotions folder or use a different email address.
                  </p>
                </div>
              </div>
            </div>

            <form onSubmit={handleVerifyOTP}>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  OTP Code *
                </label>
                <input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="123456"
                  maxLength="6"
                  className="w-full px-4 py-3 text-center text-2xl tracking-widest border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                />
                <p className="text-sm text-gray-500 mt-2">⏱️ Valid for 5 minutes</p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setStep(1);
                    setOtp('');
                    setOtpSent(false);
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium flex items-center justify-center gap-2"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                  </svg>
                  Change Email
                </button>
                <button
                  type="submit"
                  disabled={loading || otp.length !== 6}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                >
                  {loading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </div>

              <div className="mt-4 text-center">
                <button
                  type="button"
                  onClick={handleSendOTP}
                  disabled={loading}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline"
                >
                  💬 Resend OTP to {email}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && !paymentSettings && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex flex-col items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600 mb-2">Loading payment details...</p>
                <p className="text-xs text-gray-500">If this takes too long, please refresh the page</p>
              </div>
              <button
                onClick={() => loadPaymentSettings()}
                className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Retry Loading
              </button>
            </div>
          </div>
        )}

        {step === 3 && paymentSettings && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Complete Payment</h2>
            <p className="text-gray-600 mb-6">Select dates and make payment to proceed with booking</p>

            {/* Date Selection */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📅</span> Select Your Stay Dates
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-in Date *
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkInDate}
                    onChange={(e) => setBookingData({ ...bookingData, checkInDate: e.target.value })}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Check-out Date *
                  </label>
                  <input
                    type="date"
                    value={bookingData.checkOutDate}
                    onChange={(e) => setBookingData({ ...bookingData, checkOutDate: e.target.value })}
                    min={bookingData.checkInDate || new Date().toISOString().split('T')[0]}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
              </div>
              {bookingData.checkInDate && bookingData.checkOutDate && calculateNights() > 0 && (
                <div className="mt-4 p-4 bg-white bg-opacity-60 rounded-lg border border-blue-300">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Stay Duration:</span>
                    <span className="font-bold text-blue-600">{calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Payment Instructions */}
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-2xl">📱</span> Payment Details
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-gray-700">
                <div className="flex items-center gap-3">
                  <span className="text-green-600 text-xl">☎️</span>
                  <div>
                    <p className="text-sm text-gray-500">Phone/UPI</p>
                    <p className="font-semibold text-lg">{paymentSettings.paymentPhoneNumber}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-purple-600 text-xl">💳</span>
                  <div>
                    <p className="text-sm text-gray-500">UPI ID</p>
                    <p className="font-semibold text-lg">{paymentSettings.paymentUpiId}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Terms and Conditions */}
            {paymentSettings.termsAndConditions && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                  <span>📋</span> Terms and Conditions
                </h4>
                <div className="text-sm text-gray-700 max-h-32 overflow-y-auto whitespace-pre-line">
                  {paymentSettings.termsAndConditions}
                </div>
              </div>
            )}

            {/* Room Quantity Selection */}
            <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-purple-900 mb-3 flex items-center gap-2">
                <span>🏨</span> Select Number of Rooms
              </h4>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  How many rooms do you need? *
                </label>
                <select
                  value={selectedNumberOfRooms}
                  onChange={(e) => setSelectedNumberOfRooms(parseInt(e.target.value))}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-600 focus:border-transparent"
                  required
                >
                  {Array.from({ length: room.availability || 1 }, (_, i) => i + 1).map(n => (
                    <option key={n} value={n}>
                      {n} Room{n > 1 ? 's' : ''} - ₹{room.pricePerNight * n} per night
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                  {room.availability ? `${room.availability} room${room.availability !== 1 ? 's' : ''} available` : 'Select dates to see availability'}
                </p>
              </div>
              <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-purple-200">
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Rate per room per night:</span>
                    <span className="font-semibold">₹{room.pricePerNight}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">× Number of rooms:</span>
                    <span className="font-semibold">× {selectedNumberOfRooms}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-purple-300">
                    <span className="text-gray-700 font-medium">= Total per night:</span>
                    <span className="font-bold text-purple-600 text-lg">₹{room.pricePerNight * selectedNumberOfRooms}</span>
                  </div>
                </div>
                <div className="mt-3 p-2 bg-purple-100 rounded text-xs text-purple-800">
                  <strong>Calculation:</strong> ₹{room.pricePerNight} × {selectedNumberOfRooms} room{selectedNumberOfRooms > 1 ? 's' : ''} = ₹{room.pricePerNight * selectedNumberOfRooms} per night<br/>
                  <strong>Example:</strong> For a 3-night stay, total would be ₹{room.pricePerNight * selectedNumberOfRooms} × 3 nights = ₹{room.pricePerNight * selectedNumberOfRooms * 3}
                </div>
              </div>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              {/* Room Rate Information */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                  <span>🏨</span> Room Rate Summary
                </h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Base rate per room per night:</span>
                    <span className="font-semibold">₹{room.pricePerNight}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Selected rooms:</span>
                    <span className="font-semibold">{selectedNumberOfRooms} room{selectedNumberOfRooms > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-blue-200">
                    <span className="text-gray-700 font-medium">Total per night:</span>
                    <span className="text-xl font-bold text-blue-600">₹{room.pricePerNight * selectedNumberOfRooms}</span>
                  </div>
                </div>
                <p className="text-xs text-blue-700 mt-3 bg-blue-100 p-2 rounded">
                  💡 <strong>How it works:</strong> ₹{room.pricePerNight} per room × {selectedNumberOfRooms} rooms = ₹{room.pricePerNight * selectedNumberOfRooms} per night.<br/>
                  Final amount = ₹{room.pricePerNight * selectedNumberOfRooms} × number of nights you stay.
                </p>
              </div>

              {/* Payment Type Selection */}
              {paymentSettings.partialPaymentEnabled && (
                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Payment Type *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentType === 'full' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentType"
                            value="full"
                            checked={paymentType === 'full'}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Full Payment</p>
                            <p className="text-sm text-gray-600">Pay 100% of total amount</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-green-600">₹{calculatePaymentAmountWithGST()}</p>
                          <p className="text-xs text-gray-500">for {calculateNights()} night{calculateNights() > 1 ? 's' : ''} stay</p>
                        </div>
                      </div>
                      <div className="ml-8 text-xs text-gray-500">
                        Complete payment in advance
                      </div>
                    </label>

                    <label className={`flex flex-col p-4 border-2 rounded-lg cursor-pointer transition ${
                      paymentType === 'partial' ? 'border-blue-600 bg-blue-50' : 'border-gray-300 hover:border-blue-400'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <input
                            type="radio"
                            name="paymentType"
                            value="partial"
                            checked={paymentType === 'partial'}
                            onChange={(e) => setPaymentType(e.target.value)}
                            className="w-5 h-5 text-blue-600"
                          />
                          <div>
                            <p className="font-semibold text-gray-900">Partial Payment</p>
                            <p className="text-sm text-gray-600">Pay {paymentSettings.partialPaymentPercentage}% now, rest at hotel</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">₹{calculatePaymentAmountWithGST()}</p>
                          <p className="text-xs text-gray-500">for {calculateNights()} night{calculateNights() > 1 ? 's' : ''} stay</p>
                        </div>
                      </div>
                      <div className="ml-8 text-xs text-gray-500">
                        Pay {paymentSettings.partialPaymentPercentage}% advance, rest {100 - paymentSettings.partialPaymentPercentage}% at hotel check-in
                      </div>
                    </label>
                  </div>
                </div>
              )}

              {/* Amount Summary with Full Calculation */}
              {bookingData.checkInDate && bookingData.checkOutDate && calculateNights() > 0 && (
                <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-400 rounded-lg p-5 mb-6">
                  <div className="flex items-start gap-3">
                    <span className="text-3xl">💰</span>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-lg font-bold text-gray-900 mb-1">
                            {paymentType === 'full' ? 'Full Payment Required' : `${paymentSettings.partialPaymentPercentage}% Advance Payment Required`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {paymentType === 'full' 
                              ? 'Pay complete amount for your stay now' 
                              : `Pay ${paymentSettings.partialPaymentPercentage}% advance now, remaining ${100 - paymentSettings.partialPaymentPercentage}% at check-in`}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-3xl font-bold text-orange-600">
                            ₹{calculatePaymentAmountWithGST()}
                          </p>
                          <p className="text-sm text-gray-600">for {calculateNights()} night{calculateNights() > 1 ? 's' : ''} stay</p>
                        </div>
                      </div>
                      
                      {/* Full Calculation Breakdown */}
                      <div className="bg-white bg-opacity-60 rounded-lg p-4 border border-orange-200 mb-3">
                        <h4 className="font-semibold text-gray-900 mb-3">📊 Complete Calculation Breakdown</h4>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Room Rate per Night (per room):</span>
                            <span className="font-semibold">₹{room.pricePerNight}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Number of Rooms:</span>
                            <span className="font-semibold">× {selectedNumberOfRooms}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Total per Night:</span>
                            <span className="font-semibold">₹{room.pricePerNight * selectedNumberOfRooms}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-gray-700">Stay Duration:</span>
                            <span className="font-semibold">{calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                          </div>
                          <div className="flex justify-between items-center pb-2 border-b border-orange-100">
                            <span className="text-gray-700">Subtotal (Room Charges):</span>
                            <span className="font-semibold text-lg">₹{calculateTotal()}</span>
                          </div>
                          <div className="flex justify-between items-center pt-2 pb-2 bg-yellow-50 px-2 rounded">
                            <span className="text-gray-700 font-medium">
                              GST ({paymentSettings?.gstPercentage || 0}% {paymentSettings?.gstType === 'exclusive' ? '- Added' : '- Included'}):
                            </span>
                            <span className="font-bold text-orange-600 text-lg">₹{calculateGSTAmount()}</span>
                          </div>
                          <div className="border-t border-orange-200 pt-2 mt-2">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-gray-700 font-bold text-lg">Total Amount:</span>
                              <span className="font-bold text-orange-600 text-xl">₹{calculateTotalWithGST()}</span>
                            </div>
                            {paymentType === 'partial' && (
                              <>
                                <div className="flex justify-between items-center mb-2 text-xs mt-2">
                                  <span className="text-gray-700">Pay now ({paymentSettings.partialPaymentPercentage}%):</span>
                                  <span className="font-bold text-orange-600">₹{calculatePaymentAmountWithGST()}</span>
                                </div>
                                <div className="flex justify-between items-center text-xs">
                                  <span className="text-gray-700">Pay at check-in ({100 - paymentSettings.partialPaymentPercentage}%):</span>
                                  <span className="font-bold text-blue-600">₹{calculateRemainingAmountWithGST()}</span>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                        
                        {/* Step-by-step calculation */}
                        <div className="mt-3 p-3 bg-orange-100 rounded text-xs text-orange-800">
                          <strong>Calculation:</strong><br/>
                          ₹{room.pricePerNight} × {selectedNumberOfRooms} room{selectedNumberOfRooms > 1 ? 's' : ''} = ₹{room.pricePerNight * selectedNumberOfRooms} per night<br/>
                          ₹{room.pricePerNight * selectedNumberOfRooms} × {calculateNights()} night{calculateNights() > 1 ? 's' : ''} = ₹{calculateTotal()} subtotal<br/>
                          GST ({paymentSettings?.gstPercentage || 0}% {paymentSettings?.gstType === 'exclusive' ? 'exclusive' : 'inclusive'}): ₹{calculateGSTAmount()}<br/>
                          <strong>Total: ₹{calculateTotal()} {(paymentSettings?.gstPercentage || 0) > 0 && paymentSettings?.gstType === 'exclusive' ? '+ ₹' + calculateGSTAmount() + ' = ' : paymentSettings?.gstType === 'inclusive' ? '(GST included) = ' : ''}₹{calculateTotalWithGST()}</strong><br/>
                          {paymentType === 'partial' && (
                            <>
                              ₹{calculateTotalWithGST()} × {paymentSettings.partialPaymentPercentage}% = ₹{calculatePaymentAmountWithGST()} (pay now)<br/>
                              ₹{calculateTotalWithGST()} × {100 - paymentSettings.partialPaymentPercentage}% = ₹{calculateRemainingAmountWithGST()} (pay at check-in)
                            </>
                          )}
                        </div>
                      </div>
                      
                      {paymentType === 'partial' && (
                        <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-orange-200">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Total Amount for Stay:</span>
                            <span className="font-semibold">₹{calculateTotalWithGST()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-700">Pay now ({paymentSettings.partialPaymentPercentage}% of total):</span>
                            <span className="font-semibold text-orange-600">₹{calculateTotalWithGST()} × {paymentSettings.partialPaymentPercentage}% = ₹{calculatePaymentAmountWithGST()}</span>
                          </div>
                          <div className="flex justify-between text-sm mt-1">
                            <span className="text-gray-700">Pay at hotel ({100 - paymentSettings.partialPaymentPercentage}% of total):</span>
                            <span className="font-semibold text-blue-600">₹{calculateTotalWithGST()} × {100 - paymentSettings.partialPaymentPercentage}% = ₹{calculateRemainingAmountWithGST()}</span>
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-gray-600 mt-3">
                        ℹ️ <strong>Important:</strong> This is your exact total amount based on your selected dates. Make payment accordingly.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Transaction ID */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Transaction ID / Reference Number *
                </label>
                <input
                  type="text"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  placeholder="Enter UPI transaction ID or reference number"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  required
                  minLength="5"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Example: 123456789012, UPI/ABC/123456
                </p>
              </div>

              {/* Upload Payment Screenshot */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Payment Screenshot *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                  <input
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(e) => setPaymentProof(e.target.files[0])}
                    className="hidden"
                    id="payment-proof"
                  />
                  <label htmlFor="payment-proof" className="cursor-pointer">
                    {paymentProof ? (
                      <div className="text-green-600">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <p className="font-semibold">{paymentProof.name}</p>
                        <p className="text-sm text-gray-600">Click to change</p>
                      </div>
                    ) : (
                      <div className="text-gray-500">
                        <svg className="w-12 h-12 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <p className="font-semibold">Click to upload payment screenshot</p>
                        <p className="text-sm">PNG, JPG or PDF (max 5MB)</p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Important Note */}
              <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-orange-800 mb-2 flex items-center gap-2">
                  <span>⚠️</span> Important Payment Information
                </h4>
                <ul className="text-sm text-orange-700 space-y-1 ml-6 list-disc">
                  <li>Make payment to the above UPI ID/Phone number</li>
                  <li><strong>Pay the exact amount shown in the calculation above</strong></li>
                  <li>Take a screenshot of successful transaction</li>
                  <li>Upload the screenshot and enter transaction ID</li>
                  <li>Next step: Enter your personal details to complete booking</li>
                  <li>Admin will verify payment and approve booking within 2-4 hours</li>
                </ul>
              </div>

              {/* Buttons */}
              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !paymentProof || !transactionId || !bookingData.checkInDate || !bookingData.checkOutDate || calculateNights() <= 0}
                  className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? 'Processing...' : 'Continue to Personal Details'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Step 4: Booking Details */}
        {step === 4 && (
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Complete Your Booking</h2>
            
            {/* Booking Summary */}
            <div className="bg-blue-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="font-semibold text-blue-900 mb-4 flex items-center gap-2">
                <span>📋</span> Booking Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Number of Rooms:</span>
                  <span className="font-semibold text-blue-900">{bookingData.numberOfRooms}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Room Rate (per night):</span>
                  <span className="font-semibold text-blue-900">₹{room.pricePerNight}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-700">Total Rooms Rate:</span>
                  <span className="font-semibold text-blue-900">₹{room.pricePerNight * bookingData.numberOfRooms} per night (₹{room.pricePerNight} × {bookingData.numberOfRooms} rooms)</span>
                </div>
                <div className="border-t border-blue-200 pt-3">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Check-in Date:</span>
                    <span className="font-semibold text-blue-900">{new Date(bookingData.checkInDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Check-out Date:</span>
                    <span className="font-semibold text-blue-900">{new Date(bookingData.checkOutDate).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-gray-700">Total Nights:</span>
                    <span className="font-semibold text-blue-900">{calculateNights()} night{calculateNights() > 1 ? 's' : ''}</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-700">Subtotal:</span>
                    <span className="font-semibold text-blue-900">₹{calculateTotal()}</span>
                  </div>
                  {paymentSettings?.gstEnabled && (
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-gray-700">GST ({paymentSettings.gstPercentage}% {paymentSettings.gstType}):</span>
                      <span className="font-semibold text-blue-900">₹{calculateGSTAmount()}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700 font-medium">Total Booking Amount:</span>
                    <span className="font-bold text-green-600 text-lg">₹{calculateTotalWithGST()}</span>
                  </div>
                  <div className="flex justify-between items-center mt-2 pt-2 border-t border-blue-200">
                    <span className="text-gray-700 font-medium">Payment Type Selected:</span>
                    <span className="font-bold text-blue-600 capitalize">{paymentType} Payment</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">Amount Paid Now:</span>
                    <span className="font-bold text-orange-600">₹{calculatePaymentAmountWithGST()}</span>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Remaining Amount (at check-in):</span>
                      <span className="font-bold text-blue-600">₹{calculateRemainingAmountWithGST()}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Payment Status */}
            <div className="bg-green-50 border-2 border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                <span>✅</span> Payment Submitted
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm mb-3">
                <div>
                  <p className="text-gray-600">Transaction ID:</p>
                  <p className="font-semibold text-gray-900">{transactionId}</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Type:</p>
                  <p className="font-semibold text-gray-900 capitalize">{paymentType} Payment</p>
                </div>
                <div>
                  <p className="text-gray-600">Payment Proof:</p>
                  <p className="font-semibold text-green-700 flex items-center gap-1">
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {paymentProof?.name || 'Uploaded'}
                  </p>
                </div>
              </div>
              <div className="bg-white bg-opacity-60 rounded-lg p-3 border border-green-300">
                <p className="text-xs font-semibold text-gray-700 mb-2">Payment Summary:</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Booking Amount:</span>
                    <span className="font-bold text-gray-900">₹{calculateTotalWithGST()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount Paid Now:</span>
                    <span className="font-bold text-green-700">₹{calculatePaymentAmountWithGST()}</span>
                  </div>
                  {paymentType === 'partial' && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Remaining Amount (at check-in):</span>
                      <span className="font-bold text-blue-600">₹{calculateRemainingAmountWithGST()}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-green-200">
                    <span className="text-gray-600 font-medium">Payment Type:</span>
                    <span className="font-bold text-gray-900 capitalize">{paymentType} Payment</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200">
                <p className="text-xs text-green-700">
                  ℹ️ Your payment will be verified by admin. You'll receive confirmation once approved.
                </p>
              </div>
            </div>

            <form onSubmit={handleBookingSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Guest Name *
                  </label>
                  <input
                    type="text"
                    value={bookingData.name}
                    onChange={(e) => setBookingData({ ...bookingData, name: e.target.value })}
                    placeholder="John Doe"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    value={bookingData.phone}
                    onChange={(e) => setBookingData({ ...bookingData, phone: e.target.value })}
                    placeholder="1234567890"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">ID Proof Type *</label>
                  <select
                    value={proofType}
                    onChange={(e) => setProofType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                    required
                  >
                    <option value="">-- Select ID Proof Type --</option>
                    <option value="Aadhaar">Aadhaar</option>
                    <option value="Passport">Passport</option>
                    <option value="Driving License">Driving License</option>
                    <option value="Voter ID">Voter ID</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Upload ID Proof *</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <input
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={(e) => setIdProofFile(e.target.files[0])}
                      className="hidden"
                      id="id-proof"
                    />
                    <label htmlFor="id-proof" className="cursor-pointer">
                      {idProofFile ? (
                        <div className="text-green-600">
                          <p className="font-semibold">{idProofFile.name}</p>
                          <p className="text-sm text-gray-600">Click to change</p>
                        </div>
                      ) : (
                        <div className="text-gray-500">
                          <p className="font-semibold">Click to upload ID proof (Aadhaar / Passport / DL)</p>
                          <p className="text-sm">PNG, JPG or PDF (max 5MB)</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Number of Guests *
                  </label>
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 md:gap-6">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium whitespace-nowrap">Adults</div>
                      <div className="flex items-center border-2 border-gray-400 rounded bg-white">
                        <button 
                          type="button" 
                          onClick={() => {
                            console.log('👆 Adults MINUS clicked');
                            setAdults(prev => Math.max(1, prev - 1));
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-red-100 active:bg-red-200 transition font-bold text-lg text-red-600 cursor-pointer border-r border-gray-300"
                          title="Decrease adults"
                        >
                          −
                        </button>
                        <div className="w-12 h-10 flex items-center justify-center border-l border-r border-gray-300 font-bold text-lg text-gray-900">
                          {adults}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setAdults(prevAdults => {
                              const newAdults = prevAdults + 1;
                              console.log('👆 Adults PLUS clicked - current adults:', prevAdults, 'new adults would be:', newAdults);
                              console.log('✓ Adults increased from', prevAdults, 'to', newAdults);
                              return newAdults;
                            });
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-green-100 active:bg-green-200 transition font-bold text-lg text-green-600 cursor-pointer border-l border-gray-300"
                          title="Increase adults"
                        >
                          +
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium whitespace-nowrap">Children</div>
                      <div className="flex items-center border-2 border-gray-400 rounded bg-white">
                        <button 
                          type="button" 
                          onClick={() => {
                            console.log('👆 Children MINUS clicked');
                            setChildren(prev => Math.max(0, prev - 1));
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-red-100 active:bg-red-200 transition font-bold text-lg text-red-600 cursor-pointer border-r border-gray-300"
                          title="Decrease children"
                        >
                          −
                        </button>
                        <div className="w-12 h-10 flex items-center justify-center border-l border-r border-gray-300 font-bold text-lg text-gray-900">
                          {children}
                        </div>
                        <button 
                          type="button" 
                          onClick={() => {
                            setChildren(prevChildren => {
                              const newChildren = prevChildren + 1;
                              console.log('👆 Children PLUS clicked - adults:', adults, 'current children:', prevChildren, 'new children would be:', newChildren);
                              console.log('✓ Children increased from', prevChildren, 'to', newChildren);
                              return newChildren;
                            });
                          }}
                          className="w-10 h-10 flex items-center justify-center hover:bg-green-100 active:bg-green-200 transition font-bold text-lg text-green-600 cursor-pointer border-l border-gray-300"
                          title="Increase children"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {/* Total guests and room capacity removed per request */}
                  </p>

                </div>
              </div>

              {/* Extra Adult Charges Info */}
              <div className="mb-6 p-4 bg-orange-50 rounded-lg border-2 border-orange-300">
                <h4 className="font-bold text-gray-800 mb-2">💰 Extra Charges</h4>
                <p className="text-sm text-gray-700">
                  <span className="text-orange-600">•</span> Extra Adult Per Price: <span className="font-semibold text-orange-600">₹300</span>
                </p>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Special Requests & Requirements
                </label>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                  <p className="text-xs text-blue-800 font-medium mb-1">💡 Examples:</p>
                  <p className="text-xs text-blue-700">
                    • High floor preference • Late check-in/out • Extra bedding • Accessibility needs • Birthday celebration setup • Dietary requirements
                  </p>
                </div>
                <textarea
                  value={bookingData.specialRequests}
                  onChange={(e) => setBookingData({ ...bookingData, specialRequests: e.target.value })}
                  placeholder="Please let us know about any special requirements, preferences, or celebrations..."
                  rows="4"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">
                  We'll do our best to accommodate your requests
                </p>
              </div>

              <div className="flex gap-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <span>📝</span>
                      Book Now
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <Notification />
    </div>
  );
}
