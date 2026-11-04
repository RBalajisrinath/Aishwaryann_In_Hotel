import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { jsPDF } from 'jspdf';
import { hotelAPI } from '../api';

export default function BookingSuccessPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const booking = location.state?.booking;
  const [policies, setPolicies] = useState(null);

  useEffect(() => {
    // Fetch hotel policies when component mounts
    const fetchPolicies = async () => {
      try {
        const response = await hotelAPI.getPolicies(booking?.hotelId || 1);
        // Use regular policy by default
        const regularPolicy = response.data.find(p => p.policyType === 'regular') || response.data[0];
        setPolicies(regularPolicy);
      } catch (error) {
        console.error('Error fetching policies:', error);
        // Set default policy if fetch fails
        setPolicies({
          checkInTime: '12:00 PM',
          checkOutTime: '11:00 AM',
          idRequirement: 'Please carry a valid government-issued photo ID',
          voucherRequirement: 'Present this voucher at check-in',
          earlyCheckIn: 'Early check-in subject to availability',
          cancellationPolicy: 'Cancellation policy: Please contact hotel'
        });
      }
    };
    
    if (booking) {
      fetchPolicies();
    }
  }, [booking]);

  if (!booking) {
    navigate('/');
    return null;
  }

  const formatUniqueId = (id) => {
    return `${id.slice(0, 2)}-${id.slice(2, 6)}-${id.slice(6, 10)}-${id.slice(10)}`;
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Unique ID copied to clipboard!');
  };

  const downloadVoucher = () => {
    if (!policies) {
      alert('Loading hotel policies... Please try again in a moment.');
      return;
    }

    // Create new PDF document (A4 size)
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    const contentWidth = pageWidth - (2 * margin);
    let yPos = 20;

    // Helper function to add text with auto-wrap
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
    doc.setFillColor(37, 99, 235); // Blue color
    doc.rect(0, 0, pageWidth, 50, 'F');
    
    // Hotel Name
    doc.setTextColor(255, 255, 255); // White text
    addText('AISHWARYAM INN', pageWidth / 2, yPos + 5, { fontSize: 24, fontStyle: 'bold', align: 'center' });
    addText('Yercaud, Tamil Nadu', pageWidth / 2, yPos + 15, { fontSize: 12, align: 'center' });
    
    // Voucher Title
    doc.setFillColor(255, 193, 7); // Yellow/Gold
    doc.rect(margin, yPos + 22, contentWidth, 12, 'F');
    doc.setTextColor(0, 0, 0);
    addText('BOOKING VOUCHER', pageWidth / 2, yPos + 30, { fontSize: 16, fontStyle: 'bold', align: 'center' });
    
    yPos = 60;
    doc.setTextColor(0, 0, 0);

    // Important Notice Box
    doc.setFillColor(254, 243, 199); // Light yellow
    doc.setDrawColor(245, 158, 11); // Orange border
    doc.setLineWidth(1);
    doc.rect(margin, yPos, contentWidth, 15, 'FD');
    doc.setTextColor(146, 64, 14); // Dark orange text
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
    addText(`Booking ID: #${booking.bookingId}`, margin + 5, yPos, { fontSize: 10 });
    yPos += 5;
    addText(`Unique ID: ${formatUniqueId(booking.uniqueId)}`, margin + 5, yPos, { fontSize: 10 });
    
    yPos += 12;

    // Guest Details Section
    addText('Guest Details', margin, yPos, { fontSize: 12, fontStyle: 'bold' });
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 8;
    addText(`Name: ${booking.guestName || 'Guest'}`, margin + 5, yPos);
    yPos += 6;
    addText(`Email: ${booking.email || 'N/A'}`, margin + 5, yPos);
    yPos += 6;
    addText(`Phone: ${booking.phone || 'N/A'}`, margin + 5, yPos);
    
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

    addText(`Check-in: ${checkInStr} at ${policies.checkInTime}`, margin + 5, yPos);
    yPos += 6;
    addText(`Check-out: ${checkOutStr} at ${policies.checkOutTime}`, margin + 5, yPos);
    yPos += 6;
    addText(`Total Nights: ${nights}`, margin + 5, yPos);
    yPos += 8;
    
    // Total Amount (Highlighted)
    doc.setFillColor(219, 234, 254); // Light blue
    doc.rect(margin, yPos - 3, contentWidth, 10, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    addText(`Total Amount: ₹${booking.totalPrice}`, margin + 5, yPos + 4, { fontSize: 12, fontStyle: 'bold' });
    
    yPos += 15;

    // Payment Information Section
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    addText('Payment Details', margin, yPos, { fontSize: 11, fontStyle: 'bold' });
    doc.line(margin, yPos + 2, pageWidth - margin, yPos + 2);
    yPos += 8;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    addText(`Payment Type: ${booking.paymentType === 'full' ? 'Full Payment' : 'Partial Payment'}`, margin + 5, yPos);
    yPos += 6;
    
    if (booking.gstAmount > 0) {
      addText(`GST Amount: ₹${booking.gstAmount}`, margin + 5, yPos);
      yPos += 6;
    }
    
    doc.setFont('helvetica', 'bold');
    addText(`Amount Paid: ₹${booking.amountPaid}`, margin + 5, yPos);
    yPos += 6;
    
    if (booking.paymentType === 'partial' && booking.remainingAmount > 0) {
      doc.setTextColor(255, 102, 0); // Orange color for remaining amount
      addText(`Balance Due at Hotel: ₹${booking.remainingAmount}`, margin + 5, yPos);
      doc.setTextColor(0, 0, 0); // Reset to black
      yPos += 6;
    }
    
    addText(`Transaction ID: ${booking.transactionId || 'N/A'}`, margin + 5, yPos);
    yPos += 6;
    
    doc.setTextColor(200, 100, 0); // Orange
    addText('Status: Pending Admin Approval', margin + 5, yPos, { fontStyle: 'bold' });
    doc.setTextColor(0, 0, 0);
    
    yPos += 12;

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
      policies.idRequirement,
      policies.voucherRequirement,
      `Check-in time: ${policies.checkInTime} | Check-out time: ${policies.checkOutTime}`,
      policies.earlyCheckIn,
      policies.cancellationPolicy
    ];

    // Add additional info if exists (for holiday policies)
    if (policies.additionalInfo) {
      importantPoints.push(policies.additionalInfo);
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
  };

  const printVoucher = () => {
    const printWindow = window.open('', '', 'width=800,height=600');
    printWindow.document.write(`
      <html>
        <head>
          <title>Booking Voucher - ${booking.confirmationNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
            .header { text-align: center; border-bottom: 3px solid #2563eb; padding-bottom: 20px; margin-bottom: 20px; }
            .header h1 { color: #2563eb; margin: 0; font-size: 28px; }
            .header p { color: #666; margin: 5px 0; }
            .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 8px; }
            .section h2 { color: #2563eb; margin: 0 0 15px 0; font-size: 18px; border-bottom: 2px solid #e5e7eb; padding-bottom: 8px; }
            .row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px 0; }
            .label { font-weight: bold; color: #374151; }
            .value { color: #1f2937; }
            .highlight { background-color: #fef3c7; padding: 15px; border-left: 4px solid #f59e0b; margin: 20px 0; }
            .important { background-color: #dbeafe; padding: 15px; border-left: 4px solid #2563eb; margin: 20px 0; }
            .important ul { margin: 10px 0; padding-left: 20px; }
            .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; color: #666; }
            @media print { .no-print { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>AISHWARYAM INN</h1>
            <p>Yercaud, Tamil Nadu</p>
            <p style="font-size: 20px; color: #059669; font-weight: bold; margin-top: 10px;">BOOKING VOUCHER</p>
          </div>

          <div class="highlight">
            <p style="text-align: center; font-size: 16px; font-weight: bold; margin: 0;">
              ** SHOW THIS AT CHECK-IN **
            </p>
          </div>

          <div class="section">
            <h2>Booking Reference</h2>
            <div class="row">
              <span class="label">Confirmation Number:</span>
              <span class="value" style="font-size: 18px; font-weight: bold; color: #2563eb;">${booking.confirmationNumber}</span>
            </div>
            <div class="row">
              <span class="label">Booking ID:</span>
              <span class="value">#${booking.bookingId}</span>
            </div>
            <div class="row">
              <span class="label">Unique ID:</span>
              <span class="value">${formatUniqueId(booking.uniqueId)}</span>
            </div>
          </div>

          <div class="section">
            <h2>Guest Information</h2>
            <div class="row">
              <span class="label">Name:</span>
              <span class="value">${booking.guestName || 'Guest'}</span>
            </div>
            ${booking.email ? `<div class="row"><span class="label">Email:</span><span class="value">${booking.email}</span></div>` : ''}
            ${booking.phone ? `<div class="row"><span class="label">Phone:</span><span class="value">${booking.phone}</span></div>` : ''}
          </div>

          <div class="section">
            <h2>Reservation Details</h2>
            <div class="row">
              <span class="label">Hotel:</span>
              <span class="value">${booking.hotelName}</span>
            </div>
            <div class="row">
              <span class="label">Room Type:</span>
              <span class="value">${booking.roomType}</span>
            </div>
            <div class="row">
              <span class="label">Number of Rooms:</span>
              <span class="value">${booking.numberOfRooms}</span>
            </div>
            <div class="row">
              <span class="label">Number of Guests:</span>
              <span class="value">${booking.numberOfGuests}</span>
            </div>
            <div class="row">
              <span class="label">Check-in:</span>
              <span class="value">${new Date(booking.checkInDate).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at ${policies.checkInTime}</span>
            </div>
            <div class="row">
              <span class="label">Check-out:</span>
              <span class="value">${new Date(booking.checkOutDate).toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })} at ${policies.checkOutTime}</span>
            </div>
            <div class="row">
              <span class="label">Total Nights:</span>
              <span class="value">${Math.ceil((new Date(booking.checkOutDate) - new Date(booking.checkInDate)) / (1000 * 60 * 60 * 24))}</span>
            </div>
            <div class="row" style="border-top: 2px solid #e5e7eb; padding-top: 15px; margin-top: 15px;">
              <span class="label" style="font-size: 18px;">Total Amount:</span>
              <span class="value" style="font-size: 20px; font-weight: bold; color: #059669;">₹${booking.totalPrice}</span>
            </div>
            ${booking.gstAmount > 0 ? `<div class="row"><span class="label">GST Amount:</span><span class="value">₹${booking.gstAmount}</span></div>` : ''}
            ${booking.specialRequests ? `<div class="row"><span class="label">Special Requests:</span><span class="value">${booking.specialRequests}</span></div>` : ''}
          </div>

          <div class="important">
            <h3 style="margin: 0 0 10px 0; color: #2563eb;">Important Information</h3>
            <ul style="margin: 0; line-height: 1.8;">
              <li>${policies.idRequirement}</li>
              <li>${policies.voucherRequirement}</li>
              <li>Standard check-in time: ${policies.checkInTime} | Check-out time: ${policies.checkOutTime}</li>
              <li>${policies.earlyCheckIn}</li>
              <li>${policies.cancellationPolicy}</li>
              ${policies.additionalInfo ? `<li style="font-weight: bold; color: #dc2626;">${policies.additionalInfo}</li>` : ''}
            </ul>
          </div>

          <div class="section">
            <h2>Contact Information</h2>
            <div class="row">
              <span class="label">Phone:</span>
              <span class="value">+91 XXXX XXXXXX</span>
            </div>
            <div class="row">
              <span class="label">Email:</span>
              <span class="value">aishwaryaminn@gmail.com</span>
            </div>
          </div>

          <div class="footer">
            <p><strong>Thank you for choosing Aishwaryam Inn!</strong></p>
            <p>We look forward to welcoming you and making your stay memorable.</p>
            <p style="margin-top: 15px; font-size: 12px;">
              Booking Date: ${new Date().toLocaleDateString('en-IN', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </p>
          </div>

          <button class="no-print" onclick="window.print()" style="position: fixed; bottom: 20px; right: 20px; background: #2563eb; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            Print Voucher
          </button>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-100 flex items-center justify-center py-12 px-4">
      <div className="max-w-2xl w-full">
        {/* Success Animation */}
        <div className="text-center mb-8">
          <div className="inline-block">
            <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-4 animate-bounce">
              <svg className="w-12 h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
              </svg>
            </div>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Booking Confirmed!</h1>
          <p className="text-gray-600 text-lg">Your reservation has been successfully created</p>
        </div>

        {/* Booking Details Card */}
        <div className="bg-white rounded-lg shadow-xl overflow-hidden mb-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white p-6">
            <h2 className="text-2xl font-bold mb-2">{booking.hotelName}</h2>
            <div className="flex items-center gap-2 text-blue-100">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
              </svg>
              <span>{booking.roomType} Room</span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <p className="text-sm text-gray-600 mb-1">Confirmation Number</p>
                <p className="font-semibold text-gray-900">{booking.confirmationNumber}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Booking ID</p>
                <p className="font-semibold text-gray-900">#{booking.bookingId}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-in</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.checkInDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Check-out</p>
                <p className="font-semibold text-gray-900">
                  {new Date(booking.checkOutDate).toLocaleDateString('en-US', { 
                    weekday: 'short', 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Rooms</p>
                <p className="font-semibold text-gray-900">{booking.numberOfRooms} Room{booking.numberOfRooms > 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Guests</p>
                <p className="font-semibold text-gray-900">{booking.numberOfGuests} Guest{booking.numberOfGuests > 1 ? 's' : ''}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600 mb-1">Total Amount</p>
                <p className="font-bold text-green-600 text-xl">₹{booking.totalPrice}</p>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-lg p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
                Payment Information
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-600">Payment Type:</span>
                  <span className="font-semibold text-gray-900">
                    {booking.paymentType === 'full' ? 'Full Payment' : 'Partial Payment'}
                  </span>
                </div>
                {booking.gstAmount > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                    <span className="text-gray-600">GST Amount:</span>
                    <span className="font-semibold text-gray-900">₹{booking.gstAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                  <span className="text-gray-600">Total Amount:</span>
                  <span className="font-bold text-green-600 text-lg">₹{booking.totalPrice}</span>
                </div>
                {booking.paymentType === 'partial' && booking.remainingAmount > 0 && (
                  <div className="flex justify-between items-center pb-3 border-b border-blue-200">
                    <span className="text-gray-600">Balance Due at Hotel:</span>
                    <span className="font-bold text-orange-600 text-lg">₹{booking.remainingAmount}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-yellow-100 text-yellow-800">
                    Pending Admin Approval
                  </span>
                </div>
              </div>
            </div>

            {/* Unique ID - Most Important */}
            <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-orange-300 rounded-lg p-6 mb-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="bg-orange-500 rounded-full p-2 flex-shrink-0">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-900 mb-1">📋 Your Unique Booking ID</h3>
                  <p className="text-sm text-gray-700 mb-3">
                    <strong>IMPORTANT:</strong> Save this ID! You'll need it to view or manage your bookings anytime.
                  </p>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-white border-2 border-orange-400 rounded-lg p-4 text-center">
                      <p className="text-3xl font-mono font-bold text-blue-600 tracking-wider">
                        {formatUniqueId(booking.uniqueId)}
                      </p>
                    </div>
                    <button
                      onClick={() => copyToClipboard(booking.uniqueId)}
                      className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-3 rounded-lg transition flex items-center gap-2"
                      title="Copy to clipboard"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Important Information */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Check-in Information
              </h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• Check-in time: 12:00 PM</li>
                <li>• Check-out time: 11:00 AM</li>
                <li>• Please carry a valid government ID</li>
                <li>• Early check-in subject to availability</li>
                <li>• Confirmation email has been sent to your email</li>
              </ul>
            </div>

            {/* Download/Print Voucher Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={downloadVoucher}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-4 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Download Voucher
              </button>
              <button
                onClick={printVoucher}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2 shadow-lg"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                </svg>
                Print Voucher
              </button>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => navigate('/my-bookings')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            View My Bookings
          </button>
          <button
            onClick={() => navigate('/browse')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Browse More Rooms
          </button>
          <button
            onClick={() => navigate('/')}
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition font-medium flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Go to Home
          </button>
        </div>

        {/* Email Reminder */}
        <div className="mt-6 text-center text-gray-600">
          <p className="text-sm">
            📧 A confirmation email with all details has been sent to your email address.
          </p>
        </div>
      </div>
    </div>
  );
}
