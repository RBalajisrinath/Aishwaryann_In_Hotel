import { Booking, Room, Hotel, User } from '../models/index.js';
import { validateBooking } from '../utils/validators.js';
import { executeQuery } from '../config/database.js';
import { sendBookingConfirmationEmail, sendAdminNotificationEmail } from '../utils/email.js';
import { emitToAdmins, emitToAllUsers } from '../socket/socketHandler.js';

export const createBooking = async (req, res) => {
  try {
    const { error, value } = validateBooking(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const { roomId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms = 1, numberOfNights, specialRequests } = value;

    // Check room availability for the requested number of rooms
    const isAvailable = await Room.checkAvailability(roomId, checkInDate, checkOutDate, numberOfRooms);
    if (!isAvailable) {
      return res.status(409).json({ message: `Not enough rooms available for selected dates. Only ${isAvailable.available} rooms available.` });
    }

    // Get room details
    const room = await Room.getById(roomId);
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Calculate total price
    // Use numberOfNights passed from frontend to avoid timezone issues
    const nights = numberOfNights ? parseInt(numberOfNights) : Math.ceil(
      (new Date(checkOutDate) - new Date(checkInDate)) / (1000 * 60 * 60 * 24)
    );
    // Calculate extra adult charges (per extra person per night)
    const extraAdultCharge = parseFloat(room.extraAdultCharge || 0);
    const extraGuests = Math.max(0, (numberOfGuests || 0) - (numberOfRooms * (room.capacity || 1)));
    const extraChargeTotal = extraAdultCharge * extraGuests * nights;

    const totalPrice = (parseFloat(room.pricePerNight) * nights * numberOfRooms) + extraChargeTotal;

    // Create booking (authenticated user)
    const uuid = require('uuid').v4();
    const bookingNumber = 'BK' + Date.now();
    const bookingQuery = `INSERT INTO bookings (uuid, bookingNumber, userId, roomId, hotelId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms, numberOfNights, totalPrice, specialRequests, bookingStatus, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const bookingRes = await executeQuery(bookingQuery, [
      uuid,
      bookingNumber,
      req.user.userId,
      roomId,
      room.hotelId,
      checkInDate,
      checkOutDate,
      numberOfGuests,
      numberOfRooms,
      nights,
      totalPrice,
      specialRequests || null,
      'pending'
    ]);
    const bookingResult = { id: bookingRes.insertId, bookingNumber };

    // NOTE: Room availability is now calculated dynamically from bookings
    // No need to update availableRooms field

    // Get full booking details
    const booking = await Booking.getById(bookingResult.id);
    const hotel = await Hotel.getById(room.hotelId);
    const user = await User.findById(req.user.userId);

    // Send confirmation email
    await sendBookingConfirmationEmail(user.email, {
      bookingId: bookingResult.bookingNumber,
      hotelName: hotel.name,
      roomType: room.type,
      numberOfRooms,
      checkIn: new Date(checkInDate).toLocaleDateString(),
      checkOut: new Date(checkOutDate).toLocaleDateString(),
      totalPrice,
      guestName: user.firstName
    });

    // Send admin notification
    const adminEmail = process.env.ADMIN_EMAIL || 'admin@hotelbooking.com';
    await sendAdminNotificationEmail(adminEmail, 'New Booking', 'A new booking has been created', {
      BookingID: bookingResult.bookingNumber,
      Guest: user.firstName + ' ' + user.lastName,
      Hotel: hotel.name,
      'Room Type': room.type,
      'Number of Rooms': numberOfRooms,
      'Check-In': new Date(checkInDate).toLocaleDateString(),
      'Check-Out': new Date(checkOutDate).toLocaleDateString(),
      Amount: totalPrice
    });

    // Real-time notification
    req.app.locals.io.emit('booking:created', {
      bookingId: bookingResult.id,
      bookingNumber: bookingResult.bookingNumber,
      roomId,
      hotelId: room.hotelId,
      numberOfRooms,
      timestamp: new Date()
    });

    res.status(201).json({
      message: 'Booking created successfully',
      booking: {
        id: bookingResult.id,
        bookingNumber: bookingResult.bookingNumber,
        totalPrice,
        numberOfRooms,
        status: 'pending'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.getByUser(req.user.userId);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.getById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.userId !== req.user.userId && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const cancelBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const booking = await Booking.getById(bookingId);

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (booking.userId !== req.user.userId && req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    // Check if can cancel
    if (['checked-out', 'cancelled'].includes(booking.status)) {
      return res.status(409).json({ message: 'Cannot cancel this booking' });
    }

    // Cancel booking
    await Booking.cancel(bookingId);

    // NOTE: Room availability is now calculated dynamically from bookings
    // When booking is cancelled, it will automatically be excluded from availability counts

    // Real-time notification
    req.app.locals.io.emit('booking:cancelled', {
      bookingId,
      roomId: booking.roomId,
      hotelId: booking.hotelId,
      timestamp: new Date()
    });

    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBookingStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { status } = req.body;

    // Only admin can update status
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const validStatuses = ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    await Booking.updateStatus(bookingId, status);

    // Real-time notification
    req.app.locals.io.emit('booking:statusUpdated', {
      bookingId,
      status,
      timestamp: new Date()
    });

    res.json({ message: 'Booking status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getBookingStats = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const stats = await executeQuery(`
      SELECT 
        COUNT(*) as totalBookings,
        SUM(CASE WHEN bookingStatus = 'confirmed' THEN 1 ELSE 0 END) as confirmedBookings,
        SUM(CASE WHEN bookingStatus = 'checked_in' THEN 1 ELSE 0 END) as checkedInBookings,
        SUM(CASE WHEN bookingStatus = 'cancelled' THEN 1 ELSE 0 END) as cancelledBookings,
        SUM(CASE WHEN paymentStatus = 'completed' THEN totalPrice ELSE 0 END) as totalRevenue
      FROM bookings
    `);

    res.json(stats[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
