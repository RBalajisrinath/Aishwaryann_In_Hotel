import { v4 as uuidv4 } from 'uuid';
import { GuestProfile, GuestOTP, GuestBookingSession, Booking, Room, Hotel } from '../models/index.js';
import { 
  generateOTP, 
  generateUniqueGuestId, 
  generateSessionToken,
  getOTPExpiryTime,
  getSessionExpiryTime,
  isValidEmail,
  isValidOTP,
  isValidUniqueId
} from '../utils/otp.js';
import { sendOTPEmail, sendUniqueIdEmail, sendGuestBookingConfirmation, sendAdminNotificationEmail } from '../utils/email.js';
import { executeQuery } from '../config/database.js';
import { config } from '../config/config.js';

// Rate limiting: Max 3 OTPs per email per 5 minutes
const OTP_RATE_LIMIT = 3;
const OTP_RATE_LIMIT_WINDOW = 5; // minutes

/**
 * Send OTP to guest email for booking
 */
export const sendBookingOTP = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Check rate limiting
    const recentOTPCount = await GuestOTP.countRecentOTPs(email, OTP_RATE_LIMIT_WINDOW);
    if (recentOTPCount >= OTP_RATE_LIMIT) {
      return res.status(429).json({ 
        message: 'Too many OTP requests. Please try again after 5 minutes.' 
      });
    }

    // Generate OTP
    const otp = generateOTP();
    const expiresAt = getOTPExpiryTime();

    // Save OTP to database
    await GuestOTP.create({
      email: email.toLowerCase(),
      otp,
      purpose: 'booking',
      expiresAt
    });

    // Send OTP email
    try {
      await sendOTPEmail(email, otp, 'booking');
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    res.json({
      success: true,
      message: 'OTP sent to your email',
      expiresIn: 300 // 5 minutes in seconds
    });
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({ message: 'Failed to send OTP' });
  }
};

/**
 * Verify OTP and create booking session
 */
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;

    // Validate inputs
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    if (!otp || !isValidOTP(otp)) {
      return res.status(400).json({ message: 'Valid 6-digit OTP is required' });
    }

    // Find valid OTP
    const otpRecord = await GuestOTP.findValidOTP(email.toLowerCase(), otp, 'booking');
    
    if (!otpRecord) {
      return res.status(401).json({ 
        message: 'Invalid or expired OTP. Please request a new one.' 
      });
    }

    // Generate session token
    const sessionToken = generateSessionToken();
    const expiresAt = getSessionExpiryTime();

    // Create booking session
    await GuestBookingSession.create({
      email: email.toLowerCase(),
      sessionToken,
      expiresAt
    });

    res.json({
      success: true,
      message: 'OTP verified successfully',
      sessionToken,
      expiresIn: 3600
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({ message: 'Failed to verify OTP' });
  }
};

/**
 * Create booking with verified session
 */
export const createGuestBooking = async (req, res) => {
  try {
    const { 
      sessionToken, 
      name, 
      phone,
      roomId, 
      checkInDate, 
      checkOutDate, 
      numberOfGuests,
      numberOfRooms,
      specialRequests 
    } = req.body;

    // Validate session token
    if (!sessionToken) {
      return res.status(401).json({ message: 'Session token required' });
    }

    const session = await GuestBookingSession.findValidSession(sessionToken);
    if (!session) {
      return res.status(401).json({ 
        message: 'Invalid or expired session. Please verify OTP again.' 
      });
    }

    // Validate required fields
    if (!name || !phone || !roomId || !checkInDate || !checkOutDate || !numberOfGuests || !numberOfRooms) {
      return res.status(400).json({ message: 'All fields are required' });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Check if email already has a booking for the same dates
    const existingBookingQuery = `
      SELECT b.*, gp.email 
      FROM bookings b
      JOIN guest_profiles gp ON b.guestUniqueId = gp.uniqueId
      WHERE gp.email = ?
      AND b.status NOT IN ('cancelled', 'rejected')
      AND (
        (b.checkInDate <= ? AND b.checkOutDate > ?)
        OR (b.checkInDate < ? AND b.checkOutDate >= ?)
        OR (b.checkInDate >= ? AND b.checkOutDate <= ?)
      )
    `;
    
    const existingBookings = await executeQuery(existingBookingQuery, [
      session.email,
      checkInDate, checkInDate,
      checkOutDate, checkOutDate,
      checkInDate, checkOutDate
    ]);

    if (existingBookings.length > 0) {
      return res.status(400).json({ 
        message: 'You already have a booking for these dates. Please choose different dates or cancel your existing booking first.',
        existingBooking: {
          confirmationNumber: existingBookings[0].confirmationNumber,
          checkInDate: existingBookings[0].checkInDate,
          checkOutDate: existingBookings[0].checkOutDate
        }
      });
    }

    // Get room and hotel details
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hotel = await Hotel.getById(room.hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check room availability
    const checkAvailabilityQuery = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE roomId = ? 
      AND bookingStatus NOT IN ('cancelled', 'checked_out')
      AND (
        (checkInDate <= ? AND checkOutDate > ?)
        OR (checkInDate < ? AND checkOutDate >= ?)
        OR (checkInDate >= ? AND checkOutDate <= ?)
      )
    `;
    
    const availabilityResult = await executeQuery(checkAvailabilityQuery, [
      roomId,
      checkInDate, checkInDate,
      checkOutDate, checkOutDate,
      checkInDate, checkOutDate
    ]);

    const bookedRooms = availabilityResult[0].count;
    if (bookedRooms + numberOfRooms > room.availability) {
      return res.status(400).json({ 
        message: 'Not enough rooms available for selected dates' 
      });
    }

    // Calculate total price (base amount)
    const nights = Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePrice = room.pricePerNight * nights * numberOfRooms;
  // Extra adult charges (per extra person per night)
  const extraAdultCharge = parseFloat(room.extraAdultCharge || 0);
  const extraGuests = Math.max(0, (numberOfGuests || 0) - (numberOfRooms * (room.capacity || 1)));
  const extraChargeTotal = extraAdultCharge * extraGuests * nights;
  const priceWithExtras = basePrice + extraChargeTotal;

    // Get payment settings for GST calculation
    const paymentSettings = await executeQuery(
      'SELECT * FROM payment_settings WHERE hotelId = ?',
      [room.hotelId]
    );

    // Apply GST calculation (same logic as frontend)
    // Note: gstEnabled can be 0 or 1 from database, so check truthiness properly
    const gstEnabled = room.gstEnabled ? true : (paymentSettings[0]?.gstEnabled ? true : false);
    const gstPercentage = room.gstPercentage !== undefined && room.gstPercentage > 0 ? room.gstPercentage : paymentSettings[0]?.gstPercentage;
    const gstType = room.gstType !== undefined ? room.gstType : paymentSettings[0]?.gstType;

    let totalPrice, gstAmount;
    if (gstEnabled) {
      if (gstType === 'inclusive') {
        // GST already included in price
        totalPrice = priceWithExtras;
        gstAmount = Math.round((priceWithExtras * (gstPercentage || 0)) / (100 + (gstPercentage || 0)));
      } else {
        // GST added to price
        gstAmount = Math.round(priceWithExtras * (gstPercentage || 0) / 100);
        totalPrice = priceWithExtras + gstAmount;
      }
    } else {
      totalPrice = priceWithExtras;
      gstAmount = 0;
    }

    // Find or create guest profile
    let guest = await GuestProfile.findByEmail(session.email);
    
    if (!guest) {
      // Create new guest profile with unique ID
      const uniqueId = generateUniqueGuestId();
      
      await GuestProfile.create({
        uniqueId,
        email: session.email,
        name,
        phone
      });

      guest = await GuestProfile.findByEmail(session.email);
    } else {
      // Update guest info if needed
      await GuestProfile.update(guest.uniqueId, { name, phone });
      guest = await GuestProfile.findByEmail(session.email);
    }

    // Generate booking identifiers
    const uuid = uuidv4(); // Generate UUID
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`; // Generate booking number
    const confirmationNumber = `CONF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Calculate number of nights
    const checkInDateObj = new Date(checkInDate);
    const checkOutDateObj = new Date(checkOutDate);
    const numberOfNights = Math.ceil((checkOutDateObj - checkInDateObj) / (1000 * 60 * 60 * 24));

    // Extract proof fields if uploaded
    const proofType = req.body.proofType || null;
    // req.file may be present when uploadGuestProofs.single('proofFile') was used
    let proofFile = null;
    if (req.file && req.file.fieldname === 'proofFile') proofFile = req.file.filename;

    // Create booking
    const bookingQuery = `
      INSERT INTO bookings (
        uuid, bookingNumber, guestUniqueId, roomId, hotelId, 
        checkInDate, checkOutDate, numberOfGuests, numberOfRooms, numberOfNights,
        totalPrice, gstAmount, gstPercentage, gstType, specialRequests, confirmationNumber, proofType, proofFile, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'confirmed')
    `;

    const bookingResult = await executeQuery(bookingQuery, [
      uuid,
      bookingNumber,
      guest.uniqueId,
      roomId,
      room.hotelId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      numberOfRooms, // Use the actual numberOfRooms from request
      numberOfNights,
      totalPrice,
      gstAmount,
      gstPercentage,
      gstType,
      specialRequests || null,
      confirmationNumber,
      proofType,
      proofFile
    ]);

    // Mark OTP and session as used
    const otpRecord = await GuestOTP.findValidOTP(session.email, '', 'booking');
    if (otpRecord) {
      await GuestOTP.markAsUsed(otpRecord.id);
    }
    await GuestBookingSession.markAsUsed(sessionToken);

    // Send confirmation email
    try {
      await sendGuestBookingConfirmation(session.email, {
        uniqueId: guest.uniqueId,
        confirmationNumber,
        guestName: name,
        hotelName: hotel.name,
        roomType: room.type,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        guests: numberOfGuests,
        totalPrice
      });
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      // Continue even if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking confirmed successfully!',
      booking: {
        bookingId: bookingResult.insertId,
        confirmationNumber,
        uniqueId: guest.uniqueId,
        email: session.email,
        guestName: name,
        phone: phone,
        hotelName: hotel.name,
        roomType: room.type,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        numberOfRooms,
        totalPrice,
        gstAmount,
        specialRequests: specialRequests || null
      }
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    console.error('Error stack:', error.stack);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      sqlMessage: error.sqlMessage
    });
    res.status(500).json({ 
      message: 'Failed to create booking. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Retrieve bookings using unique ID
 */
export const retrieveBookings = async (req, res) => {
  try {
    const { uniqueId } = req.body;

    // Validate unique ID
    if (!uniqueId || !isValidUniqueId(uniqueId)) {
      return res.status(400).json({ message: 'Valid unique ID is required' });
    }

    // Find guest profile
    const guest = await GuestProfile.findByUniqueId(uniqueId.toUpperCase());
    if (!guest) {
      return res.status(404).json({ 
        message: 'No bookings found for this ID. Please check and try again.' 
      });
    }

    // Get all bookings for this guest
    const bookingsQuery = `
      SELECT 
        b.*,
        r.type as roomType,
        r.pricePerNight,
        r.capacity,
        h.name as hotelName,
        h.city,
        h.address,
        h.phone as hotelPhone
      FROM bookings b
      JOIN rooms r ON b.roomId = r.id
      JOIN hotels h ON r.hotelId = h.id
      WHERE b.guestUniqueId = ?
      ORDER BY b.createdAt DESC
    `;

    const bookings = await executeQuery(bookingsQuery, [guest.uniqueId]);

    res.json({
      success: true,
      guest: {
        uniqueId: guest.uniqueId,
        email: guest.email,
        name: guest.name,
        phone: guest.phone
      },
      bookings
    });
  } catch (error) {
    console.error('Error retrieving bookings:', error);
    res.status(500).json({ message: 'Failed to retrieve bookings' });
  }
};

/**
 * Send unique ID to guest email (Forgot ID)
 */
export const sendForgotId = async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email || !isValidEmail(email)) {
      return res.status(400).json({ message: 'Valid email is required' });
    }

    // Find guest profile
    const guest = await GuestProfile.findByEmail(email.toLowerCase());
    if (!guest) {
      // Don't reveal if email exists for security
      return res.json({
        success: true,
        message: 'If this email has bookings, your unique ID has been sent.'
      });
    }

    // Send unique ID email
    try {
      await sendUniqueIdEmail(email, guest.uniqueId, guest.name);
    } catch (emailError) {
      console.error('Email sending failed:', emailError);
      return res.status(500).json({ message: 'Failed to send email' });
    }

    res.json({
      success: true,
      message: 'Your unique ID has been sent to your email.'
    });
  } catch (error) {
    console.error('Error sending forgot ID:', error);
    res.status(500).json({ message: 'Failed to process request' });
  }
};

/**
 * Create booking with payment proof (new manual payment workflow)
 */
export const createBookingWithPayment = async (req, res) => {
  try {
    const { 
      sessionToken, 
      email,
      name, 
      phone,
      roomId, 
      checkInDate, 
      checkOutDate, 
      numberOfGuests,
      numberOfAdults,
      numberOfChildren,
      numberOfRooms,
      numberOfNights,
      specialRequests,
      paymentType,
      transactionId,
      proofType
    } = req.body;

    // Validate session token
    if (!sessionToken) {
      return res.status(401).json({ message: 'Session token required' });
    }

    const session = await GuestBookingSession.findValidSession(sessionToken);
    if (!session) {
      return res.status(401).json({ 
        message: 'Invalid or expired session. Please verify OTP again.' 
      });
    }

    // Validate required fields
    if (!name || !phone || !roomId || !checkInDate || !checkOutDate || !numberOfGuests || !numberOfRooms) {
      return res.status(400).json({ message: 'All booking fields are required' });
    }

    if (!paymentType || !transactionId) {
      return res.status(400).json({ message: 'Payment details are required' });
    }

    // files may be provided via uploadGuestProofs.fields
    const paymentFile = (req.files && req.files['paymentProof'] && req.files['paymentProof'][0]) ? req.files['paymentProof'][0].filename : (req.file && req.file.fieldname === 'paymentProof' ? req.file.filename : null);
    const idProofFile = (req.files && req.files['proofFile'] && req.files['proofFile'][0]) ? req.files['proofFile'][0].filename : null;

    if (!paymentFile) {
      return res.status(400).json({ message: 'Payment proof screenshot is required' });
    }

    // ID proof is mandatory
    if (!idProofFile) {
      return res.status(400).json({ message: 'ID proof document is required (Aadhaar / Passport / Driving License)' });
    }

    if (!proofType) {
      return res.status(400).json({ message: 'ID proof type is required' });
    }

    // Validate dates
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (checkIn < today) {
      return res.status(400).json({ message: 'Check-in date cannot be in the past' });
    }

    if (checkOut <= checkIn) {
      return res.status(400).json({ message: 'Check-out date must be after check-in date' });
    }

    // Get room and hotel details
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    const hotel = await Hotel.getById(room.hotelId);
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Check room availability
    const checkAvailabilityQuery = `
      SELECT COUNT(*) as count FROM bookings 
      WHERE roomId = ? 
      AND bookingStatus NOT IN ('cancelled', 'checked_out')
      AND (
        (checkInDate <= ? AND checkOutDate > ?)
        OR (checkInDate < ? AND checkOutDate >= ?)
        OR (checkInDate >= ? AND checkOutDate <= ?)
      )
    `;
    
    const availabilityResult = await executeQuery(checkAvailabilityQuery, [
      roomId,
      checkInDate, checkInDate,
      checkOutDate, checkOutDate,
      checkInDate, checkOutDate
    ]);

    const bookedRooms = availabilityResult[0].count;
    if (bookedRooms + numberOfRooms > room.availability) {
      return res.status(400).json({ 
        message: 'Not enough rooms available for selected dates' 
      });
    }

    // Calculate total price (base amount)
    // Use numberOfNights passed from frontend to avoid timezone issues
    const nights = numberOfNights ? parseInt(numberOfNights) : Math.ceil((checkOut - checkIn) / (1000 * 60 * 60 * 24));
    const basePrice = room.pricePerNight * nights * numberOfRooms;

    // Get payment settings
    const paymentSettings = await executeQuery(
      'SELECT * FROM payment_settings WHERE hotelId = ?',
      [room.hotelId]
    );
    
    const partialPercentage = paymentSettings[0]?.partialPaymentPercentage || 50;

    // Apply GST calculation (same logic as frontend)
    // Note: gstEnabled can be 0 or 1 from database, so check truthiness properly
    const gstEnabled = room.gstEnabled ? true : (paymentSettings[0]?.gstEnabled ? true : false);
    const gstPercentage = room.gstPercentage !== undefined && room.gstPercentage > 0 ? room.gstPercentage : paymentSettings[0]?.gstPercentage;
    const gstType = room.gstType !== undefined ? room.gstType : paymentSettings[0]?.gstType;

    // Extra adult charges (per extra person per night)
    const extraAdultCharge = parseFloat(room.extraAdultCharge || 0);
    const extraGuests = Math.max(0, (numberOfGuests || 0) - (numberOfRooms * (room.capacity || 1)));
    const extraChargeTotal = extraAdultCharge * extraGuests * nights;
    const priceWithExtras = basePrice + extraChargeTotal;

    let totalPrice, gstAmount;
    if (gstEnabled) {
      if (gstType === 'inclusive') {
        // GST already included in price
        totalPrice = priceWithExtras;
        gstAmount = Math.round((priceWithExtras * (gstPercentage || 0)) / (100 + (gstPercentage || 0)));
      } else {
        // GST added to price
        gstAmount = Math.round(priceWithExtras * (gstPercentage || 0) / 100);
        totalPrice = priceWithExtras + gstAmount;
      }
    } else {
      totalPrice = priceWithExtras;
      gstAmount = 0;
    }

    // Calculate amounts based on payment type
    let amountPaid, remainingAmount;
    if (paymentType === 'full') {
      amountPaid = totalPrice;
      remainingAmount = 0;
    } else {
      amountPaid = Math.round(totalPrice * partialPercentage / 100);
      remainingAmount = totalPrice - amountPaid;
    }

    // Find or create guest profile
    let guest = await GuestProfile.findByEmail(session.email);
    
    if (!guest) {
      const uniqueId = generateUniqueGuestId();
      await GuestProfile.create({
        uniqueId,
        email: session.email,
        name,
        phone
      });
      guest = await GuestProfile.findByEmail(session.email);
    } else {
      await GuestProfile.update(guest.uniqueId, { name, phone });
      guest = await GuestProfile.findByEmail(session.email);
    }

    // Generate booking identifiers
    const uuid = uuidv4();
    const bookingNumber = `BK${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const confirmationNumber = `CONF${Date.now()}${Math.floor(Math.random() * 1000)}`;

    // Create booking with payment info - status 'pending' until admin approves

    const bookingQuery = `
      INSERT INTO bookings (
        bookingId, guestUniqueId, roomId, hotelId, 
        checkInDate, checkOutDate, numberOfGuests, numberOfAdults, numberOfChildren, numberOfRooms, numberOfNights,
        totalPrice, gstAmount, gstPercentage, gstType, specialRequests, bookingStatus,
        paymentType, paymentAmountRequired, remainingAmount, paymentProof, paymentProofType, idProof,
        transactionId, paymentStatus, adminApprovalStatus
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    // Calculate/ensure numberOfGuests = numberOfAdults + numberOfChildren
    const calculatedNumberOfGuests = (parseInt(numberOfAdults) || 1) + (parseInt(numberOfChildren) || 0);

    const bookingResult = await executeQuery(bookingQuery, [
      confirmationNumber,
      guest.uniqueId,
      roomId,
      room.hotelId,
      checkInDate,
      checkOutDate,
      calculatedNumberOfGuests, // Use calculated total
      numberOfAdults || 1,
      numberOfChildren || 0,
      numberOfRooms, // Use the actual numberOfRooms from request
      nights,
      totalPrice,
      gstAmount,
      gstPercentage,
      gstType,
      specialRequests || null,
      'confirmed', // Status confirmed for guest booking
      paymentType,
      amountPaid,
      remainingAmount,
      paymentFile,
      proofType,
      idProofFile,
      transactionId,
      'pending', // Payment status pending until verification
      'pending' // Admin approval status pending
    ]);

    // Mark OTP and session as used
    const otpRecord = await GuestOTP.findValidOTP(session.email, '', 'booking');
    if (otpRecord) {
      await GuestOTP.markAsUsed(otpRecord.id);
    }
    await GuestBookingSession.markAsUsed(sessionToken);

    // Send email notification to admin about new booking pending approval
    try {
      const adminEmail = process.env.ADMIN_EMAIL || '';
      const paymentSettings = await executeQuery(
        'SELECT * FROM payment_settings WHERE hotelId = ?',
        [room.hotelId]
      );
      
      await sendAdminNotificationEmail(adminEmail, 
        'New Booking Pending Approval', 
        `A new booking has been submitted and is waiting for your approval.`, 
        {
          'Booking Number': confirmationNumber,
          'Guest Name': name,
          'Guest Email': session.email,
          'Guest Phone': phone,
          'Hotel': hotel.name,
          'Room Type': room.type,
          'Check-in': new Date(checkInDate).toLocaleDateString(),
          'Check-out': new Date(checkOutDate).toLocaleDateString(),
          'Number of Guests': numberOfGuests,
          'Number of Rooms': numberOfRooms,
          'Number of Nights': nights,
          'Total Amount': `₹${totalPrice}`,
          'Payment Type': paymentType === 'full' ? 'Full Payment' : 'Partial Payment',
          'Amount Paid': `₹${amountPaid}`,
          'Remaining Balance': `₹${remainingAmount}`,
          'Transaction ID': transactionId,
          'Payment Method': paymentSettings[0]?.enablePartialPayment ? 
            `UPI: ${paymentSettings[0]?.upiId} / Phone: ${paymentSettings[0]?.phoneNumber}` : 
            'UPI',
          'Status': 'Pending Admin Approval'
        }
      );
    } catch (emailError) {
      // Email notification failed but booking was created successfully
      // Don't fail the booking if email fails
    }

    res.status(201).json({
      success: true,
      message: 'Booking submitted successfully! Waiting for admin approval.',
      booking: {
        bookingId: bookingResult.insertId,
        confirmationNumber,
        uniqueId: guest.uniqueId,
        email: session.email,
        guestName: name,
        phone: phone,
        hotelName: hotel.name,
        roomType: room.type,
        checkInDate,
        checkOutDate,
        numberOfGuests,
        numberOfRooms,
        totalPrice,
        gstAmount,
        amountPaid,
        remainingAmount,
        paymentType,
        status: 'pending',
        adminApprovalStatus: 'pending',
        message: 'Your booking is pending admin approval. You will receive a confirmation email once approved.'
      }
    });
  } catch (error) {
    console.error('Error creating booking with payment:', error);
    res.status(500).json({ 
      message: 'Failed to create booking. Please try again.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Get booking details by confirmation number (no auth required)
 */
export const getBookingByConfirmation = async (req, res) => {
  try {
    const { confirmationNumber } = req.params;

    const bookingQuery = `
      SELECT 
        b.*,
        r.type as roomType,
        r.pricePerNight,
        h.name as hotelName,
        h.city,
        h.address,
        g.name as guestName,
        g.email as guestEmail,
        g.phone as guestPhone
      FROM bookings b
      JOIN rooms r ON b.roomId = r.id
      JOIN hotels h ON r.hotelId = h.id
      JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      WHERE b.confirmationNumber = ?
    `;

    const results = await executeQuery(bookingQuery, [confirmationNumber]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json({ success: true, booking: results[0] });
  } catch (error) {
    console.error('Error getting booking:', error);
    res.status(500).json({ message: 'Failed to get booking details' });
  }
};

/**
 * Send booking voucher via email
 */
export const sendBookingVoucherEmail = async (req, res) => {
  try {
    const { bookingId, email } = req.body;

    if (!bookingId || !email) {
      return res.status(400).json({ message: 'Booking ID and email are required' });
    }

    // Get booking details with guest and hotel information
    const bookingQuery = `
      SELECT 
        b.*,
        g.uniqueId as guestUniqueId,
        g.name as guestName,
        g.email as guestEmail,
        g.phone as guestPhone,
        h.name as hotelName,
        h.city,
        r.type as roomType
      FROM bookings b
      JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ?
    `;

    const results = await executeQuery(bookingQuery, [bookingId]);
    
    if (results.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = results[0];

    // Send confirmation email with all booking details
    await sendGuestBookingConfirmation(email, {
      uniqueId: booking.guestUniqueId,
      confirmationNumber: booking.confirmationNumber,
      guestName: booking.guestName,
      hotelName: booking.hotelName,
      roomType: booking.roomType,
      checkIn: booking.checkInDate,
      checkOut: booking.checkOutDate,
      guests: booking.numberOfGuests,
      totalPrice: booking.totalPrice,
      specialRequests: booking.specialRequests
    });

    res.json({ 
      success: true, 
      message: 'Booking details sent successfully to your email!' 
    });
  } catch (error) {
    console.error('Error sending booking email:', error);
    res.status(500).json({ message: 'Failed to send booking details via email' });
  }
};

// Cleanup expired OTPs and sessions (run periodically)
export const cleanupExpired = async () => {
  try {
    await GuestOTP.deleteExpired();
    await GuestBookingSession.deleteExpired();
  } catch (error) {
    // Silently handle cleanup errors to not disrupt service
  }
};
