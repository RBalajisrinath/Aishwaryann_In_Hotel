import React, { useState } from 'react';
import { guestBookingAPI, hotelAPI } from '../api';
import { useNotificationStore } from '../store';
import Notification from '../components/Notification';
import { jsPDF } from 'jspdf';

export default function MyBookingsPage() {
  const addNotification = useNotificationStore((state) => state.addNotification);
  const [uniqueId, setUniqueId] = useState('');
  const [loading, setLoading] = useState(false);
  const [guest, setGuest] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [showForgotId, setShowForgotId] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [policies, setPolicies] = useState(null);

  const handleRetrieveBookings = async (e) => {
    e.preventDefault();

    if (!uniqueId || uniqueId.length < 10) {
      addNotification({ message: 'Please enter a valid unique ID', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      const cleanId = uniqueId.replace(/-/g, '').toUpperCase();
      const response = await guestBookingAPI.retrieveBookings(cleanId);
      
      setGuest(response.data.guest);
      setBookings(response.data.bookings);
      addNotification({ message: 'Bookings retrieved successfully!', type: 'success' });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to retrieve bookings', 
        type: 'error' 
      });
      setGuest(null);
      setBookings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotId = async (e) => {
    e.preventDefault();

    if (!forgotEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(forgotEmail)) {
      addNotification({ message: 'Please enter a valid email', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await guestBookingAPI.forgotId(forgotEmail);
      addNotification({ 
        message: 'If this email has bookings, your unique ID has been sent!', 
        type: 'success' 
      });
      setShowForgotId(false);
      setForgotEmail('');
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to send unique ID', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  const formatUniqueId = (id) => {
    if (!id) return '';
    return `${id.slice(0, 2)}-${id.slice(2, 6)}-${id.slice(6, 10)}-${id.slice(10)}`;
  };

  const getStatusColor = (status) => {
    const colors = {
      confirmed: 'bg-green-100 text-green-800',
      pending: 'bg-yellow-100 text-yellow-800',
      cancelled: 'bg-red-100 text-red-800',
      completed: 'bg-blue-100 text-blue-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const viewBookingDetails = async (booking) => {
    setSelectedBooking(booking);
    setShowDetailModal(true);
    
    // Fetch policies for the booking's hotel
    try {
      const response = await hotelAPI.getPolicies(booking.hotelId || 1);
      const regularPolicy = response.data.find(p => p.policyType === 'regular') || response.data[0];
      setPolicies(regularPolicy);
    } catch (error) {
      console.error('Error fetching policies:', error);
      // Set default policy if fetch fails
      setPolicies({
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        idRequirement: 'Please carry a valid government-issued photo ID',
        voucherRequirement: 'Show this voucher/confirmation at check-in',
        earlyCheckIn: 'Early check-in subject to availability',
        cancellationPolicy: 'Contact hotel for cancellation policy'
      });
    }
  };

  const downloadBookingPDF = async (booking) => {
    try {
      // Fetch hotel policies first
      const response = await hotelAPI.getPolicies(booking.hotelId || 1);
      const regularPolicy = response.data.find(p => p.policyType === 'regular') || response.data[0];
      
      // Create new PDF document (A4 size)
      const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper function to add text
    const addText = (text, x, y, options = {}) => {
      const { maxWidth = contentWidth, fontSize = 10, align = 'left', fontStyle = 'normal' } = options;
      doc.setFontSize(fontSize);
      doc.setFont('helvetica', fontStyle);
      
      if (align === 'center') {
        doc.text(text, pageWidth / 2, y, { align: 'center', maxWidth });
      } else {
        doc.text(text, x, y, { maxWidth });
      }
      
      return doc.getTextDimensions(text, { maxWidth }).h;
    };

    // Header with Logo Area (Blue background)
    doc.setFillColor(37, 99, 235);
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    doc.setTextColor(255, 255, 255);
    addText('AISHWARYAM INN', pageWidth / 2, yPos + 5, { fontSize: 24, fontStyle: 'bold', align: 'center' });
    addText('Yercaud, Tamil Nadu', pageWidth / 2, yPos + 15, { fontSize: 12, align: 'center' });
    
    // Voucher Title
    doc.setFillColor(255, 193, 7);
    doc.rect(margin, yPos + 22, contentWidth, 12, 'F');
    doc.setTextColor(0, 0, 0);
    addText('BOOKING VOUCHER', pageWidth / 2, yPos + 30, { fontSize: 16, fontStyle: 'bold', align: 'center' });
    
    yPos = 60;
    doc.setTextColor(0, 0, 0);

    // Important Notice Box
    doc.setFillColor(254, 243, 199);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(1);
    doc.rect(margin, yPos, contentWidth, 15, 'FD');
    doc.setTextColor(146, 64, 14);
    addText('** SHOW THIS VOUCHER AT CHECK-IN **', pageWidth / 2, yPos + 10, { fontSize: 12, fontStyle: 'bold', align: 'center' });
    
    yPos += 25;
    doc.setTextColor(0, 0, 0);

    // Booking Reference Section
    doc.setFillColor(240, 240, 240);
    doc.rect(margin, yPos, contentWidth, 25, 'F');
    doc.setDrawColor(200, 200, 200);
    doc.rect(margin, yPos, contentWidth, 25, 'S');
    
    yPos += 7;
    addText('Booking Reference', margin + 5, yPos, { fontSize: 11, fontStyle: 'bold' });
    yPos += 6;
    addText(`Confirmation Number: ${booking.confirmationNumber}`, margin + 5, yPos, { fontSize: 10 });
    yPos += 5;
    addText(`Booking ID: #${booking.id}`, margin + 5, yPos, { fontSize: 10 });
    yPos += 5;
    addText(`Unique ID: ${formatUniqueId(guest.uniqueId)}`, margin + 5, yPos, { fontSize: 10 });
    
    yPos += 12;

    // Guest Details Section
    addText('Guest Details', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 8;
    addText(`Name: ${guest.name || 'Guest'}`, margin + 5, yPos);
    yPos += 6;
    addText(`Email: ${guest.email || 'N/A'}`, margin + 5, yPos);
    yPos += 6;
    addText(`Phone: ${guest.phone || 'N/A'}`, margin + 5, yPos);
    
    yPos += 12;

    // Booking Details Section
    addText('Booking Details', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 8;
    addText(`Hotel: ${booking.hotelName}`, margin + 5, yPos);
    yPos += 6;
    addText(`Room Type: ${booking.roomType}`, margin + 5, yPos);
    yPos += 6;
    addText(`Number of Rooms: ${booking.numberOfRooms}`, margin + 5, yPos);
    yPos += 6;
    addText(`Number of Guests: ${booking.numberOfGuests}`, margin + 5, yPos);
    yPos += 10;

    const checkInStr = new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const checkOutStr = new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
    });
    const nights = Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24));

      addText(`Check-in: ${checkInStr} at ${regularPolicy.checkInTime}`, margin + 5, yPos);
      yPos += 6;
      addText(`Check-out: ${checkOutStr} at ${regularPolicy.checkOutTime}`, margin + 5, yPos);
    yPos += 6;
    addText(`Total Nights: ${nights}`, margin + 5, yPos);
    yPos += 8;
    
    // Total Amount (Highlighted)
    doc.setFillColor(219, 234, 254);
    doc.rect(margin, yPos - 3, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    addText(`Total Amount: Rs.${booking.totalPrice}`, margin + 5, yPos + 4, { fontSize: 12, fontStyle: 'bold' });
    
    yPos += 15;

    // Special Requests (if any)
    if (booking.specialRequests) {
      addText('Special Requests:', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
      yPos += 6;
      const requestHeight = addText(booking.specialRequests, margin + 5, yPos, { fontSize: 9 });
      yPos += requestHeight + 8;
    }

      // Important Information Section
      addText('Important Information', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
      doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
      yPos += 8;
      
      const importantPoints = [
        regularPolicy.idRequirement,
        regularPolicy.voucherRequirement,
        `Check-in time: ${regularPolicy.checkInTime} | Check-out time: ${regularPolicy.checkOutTime}`,
        regularPolicy.earlyCheckIn,
        regularPolicy.cancellationPolicy
      ];

      // Add additional info if exists (for holiday policies)
      if (regularPolicy.additionalInfo) {
        importantPoints.push(regularPolicy.additionalInfo);
      }

      doc.setFontSize(9);
      importantPoints.forEach(point => {
        const textHeight = addText(`• ${point}`, margin + 5, yPos, { fontSize: 9 });
        yPos += textHeight + 2;
      });

    yPos += 8;

    // Contact Information Section
    addText('Contact Information', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 8;
    addText('Aishwaryam Inn', margin + 5, yPos, { fontSize: 10 });
    yPos += 5;
    addText('No. 1, Suguna Vilas 1st Cross, Near Petrol Bunk', margin + 5, yPos, { fontSize: 9 });
    yPos += 5;
    addText('Nagalur Main Road, Yercaud - 636 602, Tamil Nadu', margin + 5, yPos, { fontSize: 9 });
    yPos += 5;
    addText('Phone: +91 9443224498', margin + 5, yPos, { fontSize: 9 });
    yPos += 12;
    addText('Email: aishwaryaminn@gmail.com', margin + 5, yPos, { fontSize: 9 });

    // Footer
    yPos = pageHeight - 30;
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, yPos, pageWidth - margin, yPos);
    yPos += 6;
    doc.setTextColor(100, 100, 100);
    addText('Thank you for choosing Aishwaryam Inn!', pageWidth / 2, yPos, { fontSize: 10, align: 'center', fontStyle: 'italic' });
    yPos += 6;
    addText('We look forward to welcoming you.', pageWidth / 2, yPos, { fontSize: 9, align: 'center', fontStyle: 'italic' });
    yPos += 8;
    doc.setFontSize(8);
    addText(`Generated on: ${new Date().toLocaleString('en-IN')}`, pageWidth / 2, yPos, { fontSize: 8, align: 'center' });

      // Save the PDF
      doc.save(`Booking-Voucher-${booking.confirmationNumber}.pdf`);
      addNotification({ message: 'PDF downloaded successfully!', type: 'success' });
    } catch (error) {
      console.error('Error generating PDF:', error);
      addNotification({ 
        message: 'Failed to generate PDF. Please try again.', 
        type: 'error' 
      });
    }
  };

  const sendBookingEmail = async (booking) => {
    try {
      setLoading(true);
      // Call API to send booking details via email
      // You'll need to create this endpoint
      await guestBookingAPI.sendBookingEmail(booking.id, guest.email);
      addNotification({ message: 'Booking details sent to your email!', type: 'success' });
    } catch (error) {
      addNotification({ 
        message: error.response?.data?.message || 'Failed to send email', 
        type: 'error' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">My Bookings</h1>
          <p className="text-gray-600">Enter your unique booking ID to view all your reservations</p>
        </div>

        {/* Search Form */}
        <div className="bg-white rounded-lg shadow-xl p-8 mb-8">
          <form onSubmit={handleRetrieveBookings}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Enter Your Unique Booking ID
              </label>
              <input
                type="text"
                value={uniqueId}
                onChange={(e) => setUniqueId(e.target.value.toUpperCase())}
                placeholder="HB-5K9M-2X7P-4Q or HB5K9M2X7P4Q"
                className="w-full px-4 py-3 text-lg font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                maxLength="15"
              />
              <p className="text-sm text-gray-500 mt-2">
                Format: HB-XXXX-XXXX-XX (you can enter with or without dashes)
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400 mb-4"
            >
              {loading ? 'Retrieving...' : 'View My Bookings'}
            </button>

            <button
              type="button"
              onClick={() => setShowForgotId(!showForgotId)}
              className="w-full text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Forgot your Unique ID? Click here
            </button>
          </form>

          {/* Forgot ID Form */}
          {showForgotId && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-semibold text-gray-900 mb-4">Retrieve Your Unique ID</h3>
              <form onSubmit={handleForgotId}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Enter Your Email Address
                  </label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-600 focus:border-transparent"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowForgotId(false)}
                    className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-lg hover:bg-gray-300 transition font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition font-medium disabled:bg-gray-400"
                  >
                    {loading ? 'Sending...' : 'Send ID to Email'}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {/* Guest Info & Bookings */}
        {guest && (
          <>
            {/* Guest Info */}
            <div className="bg-white rounded-lg shadow-xl p-6 mb-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{guest.name}</h2>
                  <p className="text-gray-600">{guest.email}</p>
                  <p className="text-sm text-gray-500">ID: {formatUniqueId(guest.uniqueId)}</p>
                </div>
              </div>
            </div>

            {/* Bookings List */}
            <div className="mb-6">
              <h3 className="text-2xl font-bold text-gray-900 mb-4">
                Your Bookings ({bookings.length})
              </h3>

              {bookings.length === 0 ? (
                <div className="bg-white rounded-lg shadow-xl p-12 text-center">
                  <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <h4 className="text-xl font-semibold text-gray-700 mb-2">No bookings found</h4>
                  <p className="text-gray-500">You haven't made any bookings yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {bookings.map((booking) => (
                    <div key={booking.id} className="bg-white rounded-lg shadow-xl overflow-hidden hover:shadow-2xl transition">
                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="text-xl font-bold text-gray-900 mb-1">{booking.hotelName}</h4>
                            <p className="text-gray-600">{booking.city}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(booking.status)}`}>
                            {booking.status}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-gray-600">Room Type</p>
                            <p className="font-semibold text-gray-900 capitalize">{booking.roomType}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Rooms</p>
                            <p className="font-semibold text-gray-900">{booking.numberOfRooms} Room{booking.numberOfRooms > 1 ? 's' : ''}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Check-in</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(booking.checkInDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Check-out</p>
                            <p className="font-semibold text-gray-900">
                              {new Date(booking.checkOutDate).toLocaleDateString()}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Guests</p>
                            <p className="font-semibold text-gray-900">{booking.numberOfGuests}</p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Total</p>
                            <p className="font-bold text-green-600">₹{booking.totalPrice}</p>
                          </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                          <div className="text-sm text-gray-600">
                            <span className="font-medium">Confirmation:</span> {booking.confirmationNumber}
                          </div>
                          <button 
                            onClick={() => viewBookingDetails(booking)}
                            className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                          >
                            View Details →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {/* Info Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            How to find your Unique Booking ID?
          </h4>
          <ul className="text-sm text-gray-700 space-y-1">
            <li>• Check the confirmation email sent after booking</li>
            <li>• It's displayed on the booking success page</li>
            <li>• Format: HB followed by 10 alphanumeric characters</li>
            <li>• Click "Forgot ID?" to receive it via email</li>
          </ul>
        </div>
      </div>

      {/* Booking Details Modal */}
      {showDetailModal && selectedBooking && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6 rounded-t-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">Booking Details</h2>
                  <p className="text-blue-100">Confirmation: {selectedBooking.confirmationNumber}</p>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6">
              {/* Status Badge */}
              <div className="flex justify-center">
                <span className={`px-6 py-2 rounded-full text-lg font-semibold ${getStatusColor(selectedBooking.status)}`}>
                  {selectedBooking.status ? selectedBooking.status.toUpperCase() : 'PENDING'}
                </span>
              </div>

              {/* Guest Information */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Guest Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-semibold text-gray-900">{guest.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-semibold text-gray-900">{guest.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Phone</p>
                    <p className="font-semibold text-gray-900">{guest.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Unique ID</p>
                    <p className="font-mono font-semibold text-gray-900">{formatUniqueId(guest.uniqueId)}</p>
                  </div>
                </div>
              </div>

              {/* Booking Information */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Booking Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Hotel</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.hotelName}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Location</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.city}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room Type</p>
                    <p className="font-semibold text-gray-900 capitalize">{selectedBooking.roomType}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Rooms</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.numberOfRooms}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Number of Guests</p>
                    <p className="font-semibold text-gray-900">{selectedBooking.numberOfGuests}</p>
                  </div>
                </div>
              </div>

              {/* Date Information */}
              <div className="bg-green-50 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-3 text-gray-900">Stay Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <p className="text-sm text-gray-600">Check-in</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.checkInDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-green-600">12:00 PM onwards</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Check-out</p>
                    <p className="font-semibold text-gray-900">
                      {new Date(selectedBooking.checkOutDate).toLocaleDateString('en-IN', { 
                        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-green-600">11:00 AM</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Nights</p>
                    <p className="font-semibold text-gray-900">
                      {Math.ceil((new Date(selectedBooking.checkOutDate) - new Date(selectedBooking.checkInDate)) / (1000 * 60 * 60 * 24))} nights
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="font-bold text-2xl text-green-600">₹{selectedBooking.totalPrice}</p>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h3 className="font-bold text-lg mb-2 text-gray-900">Special Requests</h3>
                  <p className="text-gray-700">{selectedBooking.specialRequests}</p>
                </div>
              )}

              {/* Important Information */}
              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-bold text-lg mb-2 text-gray-900 flex items-center gap-2">
                  <svg className="w-5 h-5 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  Important Information
                </h3>
                {policies ? (
                  <ul className="text-sm text-gray-700 space-y-1">
                    {policies.idRequirement_text && <li>• {policies.idRequirement_text}</li>}
                    <li>• Check-in: {policies.checkInTime || '2:00 PM'} | Check-out: {policies.checkOutTime || '10:00 AM'}</li>
                    {policies.cancellationPolicy && <li>• {policies.cancellationPolicy}</li>}
                    {policies.additionalInfo && (
                      <li className="font-semibold text-red-600">• {policies.additionalInfo}</li>
                    )}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-600">Loading policies...</p>
                )}
              </div>

              {/* Contact Information */}
              <div className="bg-gray-100 p-4 rounded-lg">
                <h3 className="font-bold text-lg mb-2 text-gray-900">Contact Hotel</h3>
                <div className="space-y-1 text-sm text-gray-700">
                  <p>📍 No. 1, Suguna Vilas 1st Cross, Near Petrol Bunk</p>
                  <p className="ml-4">Nagalur Main Road, Yercaud - 636 602</p>
                  <p>📞 +91 9443224498</p>
                  <p>📧 aishwaryaminn@gmail.com</p>
                </div>
              </div>
            </div>

            {/* Modal Footer - Action Buttons */}
            <div className="bg-gray-50 p-6 rounded-b-lg border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <button
                  onClick={() => downloadBookingPDF(selectedBooking)}
                  className="flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download PDF
                </button>
                <button
                  onClick={() => sendBookingEmail(selectedBooking)}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition font-medium disabled:bg-gray-400"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  Send Email
                </button>
                <button
                  onClick={() => window.print()}
                  className="flex items-center justify-center gap-2 bg-gray-600 text-white px-4 py-3 rounded-lg hover:bg-gray-700 transition font-medium"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                  </svg>
                  Print
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Notification />
    </div>
  );
}
