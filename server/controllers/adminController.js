import { executeQuery } from '../config/database.js';
import { User, Hotel, Room, Booking, WebsiteStatus } from '../models/index.js';
import { sendGuestBookingConfirmation, sendAdminNotificationEmail } from '../utils/email.js';
import { config } from '../config/config.js';
import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import archiver from 'archiver';
import stream from 'stream';
const { PassThrough } = stream;

export const getDashboardStats = async (req, res) => {
  try {
    // Admin only - authenticated by middleware
    const [stats] = await Promise.all([
      executeQuery(`
        SELECT 
          (SELECT COUNT(*) FROM users WHERE role = 'user') as totalUsers,
          (SELECT COUNT(*) FROM bookings) as totalBookings,
          (SELECT COUNT(*) FROM bookings WHERE bookingStatus = 'confirmed') as confirmedBookings,
          (SELECT COUNT(*) FROM bookings WHERE bookingStatus = 'checked_in') as checkedInBookings,
          (SELECT COALESCE(SUM(totalPrice), 0) FROM bookings WHERE paymentStatus = 'completed') as totalRevenue,
          (SELECT COUNT(*) FROM hotels) as totalHotels,
          (SELECT SUM(availability) FROM rooms) as totalRooms,
          (SELECT COUNT(*) FROM rooms) as roomTypes
        LIMIT 1
      `).catch(() => [{}])
    ]);

    // Calculate available rooms dynamically from active bookings
    // Only count bookings that are confirmed or checked-in
    const availabilityRes = await executeQuery(`
      SELECT 
        SUM(r.availability) as totalRoomUnits,
        COALESCE(SUM(b.numberOfRooms), 0) as bookedUnits
      FROM rooms r
      LEFT JOIN bookings b ON r.id = b.roomId 
        AND (b.bookingStatus = 'confirmed' 
          OR b.bookingStatus = 'checked_in')
    `).catch(() => [{}]);

    const availability = availabilityRes[0] || {};
    const totalRoomUnits = parseInt(availability.totalRoomUnits) || 0;
    const bookedUnits = parseInt(availability.bookedUnits) || 0;
    const availableRooms = Math.max(0, totalRoomUnits - bookedUnits);

    const result = {
      ...(stats[0] || {}),
      availableRooms: availableRooms
    };

    res.json({ data: result });
  } catch (error) {
    console.error('getDashboardStats error:', error);
    res.json({ data: {} }); // Return empty object instead of error
  }
};

export const getAllUsers = async (req, res) => {
  try {
    // Admin only - authenticated by middleware
    const users = await executeQuery(`
      SELECT id, uuid, firstName, lastName, email, phone, role, status, lastLogin, createdAt
      FROM users
      ORDER BY createdAt DESC
    `).catch(() => []);

    res.json(users || []);
  } catch (error) {
    res.json([]); // Return empty array instead of error
  }
};

export const getUserDetails = async (req, res) => {
  try {
    // Admin only - authenticated by middleware
    const { userId } = req.params;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get user's bookings
    const bookings = await Booking.getByUser(userId);

    res.json({
      ...user,
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    // Admin only - authenticated by middleware

    const { userId } = req.params;
    const { status } = req.body;

    const validStatuses = ['active', 'inactive', 'suspended'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const query = 'UPDATE users SET status = ? WHERE id = ?';
    await executeQuery(query, [status, userId]);

    res.json({ message: 'User status updated' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { userId } = req.params;

    // Prevent deleting super-admin users
    const [user] = await executeQuery('SELECT role FROM users WHERE id = ?', [userId]);
    if (user && user.role === 'super-admin') {
      return res.status(403).json({ message: 'Cannot delete super-admin users' });
    }

    // Delete user
    const query = 'DELETE FROM users WHERE id = ?';
    await executeQuery(query, [userId]);

    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all guest profiles
 */
export const getAllGuests = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const guests = await executeQuery(`
      SELECT g.*, COUNT(b.id) as totalBookings
      FROM guest_profiles g
      LEFT JOIN bookings b ON g.uniqueId = b.guestUniqueId
      GROUP BY g.id
      ORDER BY g.createdAt DESC
    `);

    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get guest details by ID or uniqueId
 */
export const getGuestDetails = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { guestId } = req.params;
    if (!guestId) {
      return res.status(400).json({ message: 'Guest ID is required' });
    }

    // Search by id or uniqueId
    const guest = await executeQuery(`
      SELECT g.*, COUNT(b.id) as totalBookings
      FROM guest_profiles g
      LEFT JOIN bookings b ON g.uniqueId = b.guestUniqueId
      WHERE g.id = ? OR g.uniqueId = ?
      GROUP BY g.id
      LIMIT 1
    `, [guestId, guestId]);

    if (!guest || guest.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Get all bookings for this guest
    const bookings = await executeQuery(`
      SELECT b.*, r.type as roomType, h.name as hotelName
      FROM bookings b
      JOIN rooms r ON b.roomId = r.id
      JOIN hotels h ON b.hotelId = h.id
      WHERE b.guestUniqueId = ?
      ORDER BY b.createdAt DESC
    `, [guest[0].uniqueId]);

    res.json({
      guest: guest[0],
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get guest details by email
 */
export const getGuestByEmail = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { email } = req.params;
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const guest = await executeQuery(`
      SELECT g.*, COUNT(b.id) as totalBookings
      FROM guest_profiles g
      LEFT JOIN bookings b ON g.uniqueId = b.guestUniqueId
      WHERE g.email = ?
      GROUP BY g.id
      LIMIT 1
    `, [email]);

    if (!guest || guest.length === 0) {
      return res.status(404).json({ message: 'Guest not found' });
    }

    // Get all bookings for this guest
    const bookings = await executeQuery(`
      SELECT b.*, r.type as roomType, h.name as hotelName
      FROM bookings b
      JOIN rooms r ON b.roomId = r.id
      JOIN hotels h ON b.hotelId = h.id
      WHERE b.guestUniqueId = ?
      ORDER BY b.createdAt DESC
    `, [guest[0].uniqueId]);

    res.json({
      guest: guest[0],
      bookings
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const hotels = await executeQuery(`
      SELECT h.*, COUNT(r.id) as roomCount
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotelId
      GROUP BY h.id
      ORDER BY h.createdAt DESC
    `);

    res.json(hotels);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHotel = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { hotelId } = req.params;
    const { name, address, phone, email, description, amenities, status } = req.body;

    const query = `
      UPDATE hotels 
      SET name = ?, address = ?, phone = ?, email = ?, description = ?, amenities = ?, status = ?
      WHERE id = ?
    `;

    await executeQuery(query, [
      name,
      address,
      phone,
      email,
      description,
      JSON.stringify(amenities),
      status,
      hotelId
    ]);

    // Get updated hotel
    const updatedHotelRows = await executeQuery('SELECT * FROM hotels WHERE id = ?', [hotelId]);
    const updatedHotel = updatedHotelRows[0];

    // Emit socket event for real-time updates
    try {
      const io = req.app.locals.io;
      if (io) io.emit('hotelUpdated', { hotel: updatedHotel });
    } catch (emitErr) {
      console.error('Failed to emit hotelUpdated event:', emitErr && emitErr.message);
    }

    res.json({ message: 'Hotel updated successfully', hotel: updatedHotel });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllRooms = async (req, res) => {
  try {
    // Admin only - authenticated by middleware

    const rooms = await executeQuery(`
      SELECT r.*, h.name as hotelName
      FROM rooms r
      JOIN hotels h ON r.hotelId = h.id
      ORDER BY h.name, r.type
    `);

    // Parse amenities for each room if it's a string
    const parsedRooms = rooms.map(room => ({
      ...room,
      amenities: typeof room.amenities === 'string' ? JSON.parse(room.amenities || '[]') : room.amenities,
      price: room.pricePerNight, // Add price alias for frontend compatibility
      extraAdultCharge: room.extraAdultCharge || 0
    }));

    res.json(parsedRooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateRoom = async (req, res) => {
  try {
    // Admin only - authenticated by middleware

  const { roomId } = req.params;
  const { price, pricePerNight, capacity, totalRooms, description, amenities, status, size, type, removeImage, gstEnabled, gstPercentage, gstType, extraAdultCharge } = req.body;


    // Parse amenities if it's a string
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
      }
    }

    // Handle image operations
    let imageUrl = null;
    let shouldUpdateImage = false;

    // Check if user wants to remove the image
    if (removeImage === 'true' || removeImage === true) {
      imageUrl = null;
      shouldUpdateImage = true;
    } else if (req.file) {
      try {
        // Check file size limit (300KB to allow for reasonable room images)
        const maxSizeKB = 300;
        const maxSizeBytes = maxSizeKB * 1024;
        
        
        if (req.file.size > maxSizeBytes) {
          return res.status(400).json({ 
            success: false, 
            message: `Image file is too large (${Math.round(req.file.size/1024)}KB). Please use an image smaller than ${maxSizeKB}KB.` 
          });
        }
        
        // Convert to base64
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        
        // Additional check for base64 string length (MySQL longtext limit)
        if (imageUrl.length > 400000) { // ~400KB base64 limit (accommodates 300KB files)
          return res.status(400).json({ 
            success: false, 
            message: 'Processed image exceeds database storage limit. Please use a smaller image.' 
          });
        }
        
      } catch (imgError) {
        return res.status(400).json({ message: 'Failed to process image' });
      }
    } else {
    }

    // Build update query dynamically based on what's provided
    let updateFields = [];
    let values = [];

    // Support both 'price' and 'pricePerNight'
    const finalPrice = price || pricePerNight;
    if (finalPrice !== undefined) {
      updateFields.push('pricePerNight = ?');
      values.push(finalPrice);
    }
    
    // Support both 'capacity' and 'totalRooms'
    const finalCapacity = capacity || totalRooms;
    if (finalCapacity !== undefined) {
      updateFields.push('capacity = ?');
      values.push(finalCapacity);
    }
    
    if (type !== undefined) {
      updateFields.push('type = ?');
      values.push(type);
    }
    
    if (description !== undefined) {
      updateFields.push('description = ?');
      values.push(description);
    }
    if (parsedAmenities !== undefined) {
      updateFields.push('amenities = ?');
      values.push(JSON.stringify(parsedAmenities));
    }
    if (status !== undefined) {
      updateFields.push('status = ?');
      values.push(status);
    }
    if (size !== undefined && size !== '') {
      updateFields.push('size = ?');
      values.push(size || null);
    }
    if (gstEnabled !== undefined) {
      updateFields.push('gstEnabled = ?');
      values.push(gstEnabled === 'true' || gstEnabled === true ? 1 : 0);
    }
    if (gstPercentage !== undefined) {
      updateFields.push('gstPercentage = ?');
      values.push(gstPercentage);
    }
    if (gstType !== undefined) {
      updateFields.push('gstType = ?');
      values.push(gstType);
    }
    if (extraAdultCharge !== undefined) {
      updateFields.push('extraAdultCharge = ?');
      values.push(extraAdultCharge);
    }
    // Update imageUrl if a new file was uploaded or if removing image
    if (shouldUpdateImage) {
      updateFields.push('imageUrl = ?');
      values.push(imageUrl);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(roomId);

    const query = `UPDATE rooms SET ${updateFields.join(', ')} WHERE id = ?`;

    await executeQuery(query, values);

    // Return updated room data
    const updatedRoom = await executeQuery('SELECT * FROM rooms WHERE id = ?', [roomId]);

    // Emit socket event for real-time updates to connected clients
    try {
      const io = req.app.locals.io;
      if (io) {
        io.emit('roomUpdated', { room: updatedRoom[0] });
      }
    } catch (emitErr) {
      // Don't block the response if socket emit fails
      console.error('Failed to emit roomUpdated event:', emitErr && emitErr.message);
    }

    res.json({ message: 'Room updated successfully', room: updatedRoom[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a new room
export const addRoom = async (req, res) => {
  try {
    const { type, price, capacity, size, amenities, gstEnabled, gstPercentage, gstType, extraAdultCharge } = req.body;

    // Parse amenities if it's a string
    let parsedAmenities = amenities;
    if (typeof amenities === 'string') {
      try {
        parsedAmenities = JSON.parse(amenities);
      } catch (e) {
        parsedAmenities = [];
      }
    }

    // Handle image upload
    let imageUrl = null;
    if (req.file) {
      try {
        const maxSizeKB = 300;
        const maxSizeBytes = maxSizeKB * 1024;
        if (req.file.size > maxSizeBytes) {
          return res.status(400).json({ success: false, message: `Image file is too large (${Math.round(req.file.size/1024)}KB). Please use an image smaller than ${maxSizeKB}KB.` });
        }
        imageUrl = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
        if (imageUrl.length > 400000) {
          return res.status(400).json({ success: false, message: 'Processed image exceeds database storage limit. Please use a smaller image.' });
        }
      } catch (imgError) {
        return res.status(400).json({ message: 'Failed to process image' });
      }
    }

    // Get the default hotel (assuming single hotel setup)
    const hotels = await executeQuery('SELECT id FROM hotels LIMIT 1');
    if (hotels.length === 0) {
      return res.status(400).json({ message: 'No hotel found in system' });
    }
    const hotelId = hotels[0].id;

    const query = `
      INSERT INTO rooms (hotelId, type, pricePerNight, capacity, size, availability, extraAdultCharge, amenities, imageUrl, gstEnabled, gstPercentage, gstType)
      VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?)
    `;

    const result = await executeQuery(query, [
      hotelId,
      type,
      price,
      capacity,
      size || null,
      extraAdultCharge !== undefined ? extraAdultCharge : 0,
      JSON.stringify(parsedAmenities || []),
      imageUrl,
      gstEnabled !== undefined ? (gstEnabled === 'true' || gstEnabled === true ? 1 : 0) : false,
      gstPercentage !== undefined ? gstPercentage : 0,
      gstType || 'exclusive'
    ]);

    // Get the created room
    const newRoom = await executeQuery(
      'SELECT r.*, h.name as hotelName FROM rooms r JOIN hotels h ON r.hotelId = h.id WHERE r.id = ?',
      [result.insertId]
    );

    // Emit socket event and write realtime event for new room
    try {
      const io = req.app.locals.io;
      if (io) io.emit('roomAdded', { room: newRoom[0] });
    } catch (emitErr) {
      console.error('Failed to emit roomAdded event:', emitErr && emitErr.message);
    }

    try {
      await executeQuery(
        'INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (?, ?, ?, ?, ?)',
        ['rooms', 'INSERT', newRoom[0].id, newRoom[0].uuid, JSON.stringify({ id: newRoom[0].id, uuid: newRoom[0].uuid, type: newRoom[0].type, hotelId: newRoom[0].hotelId })]
      );
    } catch (dbEvtErr) {
      console.error('Failed to write realtime_events for roomAdded:', dbEvtErr && dbEvtErr.message);
    }

    res.json({ message: 'Room added successfully', room: newRoom[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllBookings = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { status, dateFrom, dateTo } = req.query;

    let query = `
      SELECT b.*, 
             COALESCE(g.name, 'Guest') as guestName,
             COALESCE(g.email, '') as guestEmail,
             COALESCE(g.phone, '') as guestPhone,
             g.uniqueId as guestUniqueId,
             h.name as hotelName, 
             r.type as roomType,
             b.totalPrice,
             b.numberOfGuests,
             b.numberOfNights,
             b.paymentType,
             b.paymentStatus,
             b.paymentAmountRequired,
             CASE 
               WHEN b.paymentType = 'full' THEN 0
               WHEN b.paymentType = 'partial' AND b.paymentAmountRequired > 0 THEN (b.totalPrice - b.paymentAmountRequired)
               ELSE b.totalPrice
             END as balanceAmount,
             CASE 
               WHEN b.paymentStatus = 'completed' THEN 'Paid'
               WHEN b.paymentType = 'partial' AND b.paymentAmountRequired > 0 THEN 'Partially Paid'
               ELSE 'Pending'
             END as paymentStatusText
      FROM bookings b
      LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE 1=1
    `;

    const params = [];

    if (status) {
      query += ' AND b.bookingStatus = ?';
      params.push(status);
    }

    if (dateFrom) {
      query += ' AND b.checkInDate >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND b.checkOutDate <= ?';
      params.push(dateTo);
    }

    query += ' ORDER BY b.createdAt DESC';

    const bookings = await executeQuery(query, params);
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchBookingById = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;

    if (!bookingId) {
      return res.status(400).json({ message: 'Booking ID is required' });
    }

    // Search by multiple possible booking identifiers
    const query = `
      SELECT b.*, 
             COALESCE(g.name, 'Guest') as guestName,
             COALESCE(g.email, '') as guestEmail,
             COALESCE(g.phone, '') as guestPhone,
             g.uniqueId as guestUniqueId,
             h.name as hotelName, 
             r.type as roomType,
             b.totalPrice,
             b.gstAmount,
             b.gstPercentage,
             b.gstType,
             b.numberOfGuests,
             b.numberOfNights,
             b.paymentType,
             b.paymentStatus,
             b.paymentAmountRequired,
             CASE 
               WHEN b.paymentType = 'full' THEN 0
               WHEN b.paymentType = 'partial' AND b.paymentAmountRequired > 0 THEN (b.totalPrice - b.paymentAmountRequired)
               ELSE b.totalPrice
             END as balanceAmount,
             CASE 
               WHEN b.paymentStatus = 'completed' THEN 'Paid'
               WHEN b.paymentType = 'partial' AND b.paymentAmountRequired > 0 THEN 'Partially Paid'
               ELSE 'Pending'
             END as paymentStatusText
      FROM bookings b
      LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ? 
         OR b.bookingId = ? 
         OR b.guestUniqueId = ?
         OR g.uniqueId = ?
      ORDER BY b.createdAt DESC
      LIMIT 1
    `;

    const bookings = await executeQuery(query, [
      bookingId, bookingId, bookingId, bookingId
    ]);

    if (bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found with this ID' });
    }

    res.json({ booking: bookings[0] });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Download booking details (JSON) including URLs to uploaded files
 */
export const getBookingDownload = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });

    const query = `
      SELECT b.*, 
             COALESCE(g.name, 'Guest') as guestName,
             COALESCE(g.email, '') as guestEmail,
             COALESCE(g.phone, '') as guestPhone,
             g.uniqueId as guestUniqueId,
             h.name as hotelName,
             r.type as roomType
      FROM bookings b
      LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ?
      LIMIT 1
    `;

    const bookings = await executeQuery(query, [bookingId]);
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Build file URLs for any uploaded files
    const host = req.get('host');
    const protocol = req.protocol;
    const paymentProofUrl = booking.paymentProof ? `${protocol}://${host}/uploads/payment-proofs/${booking.paymentProof}` : null;
    const proofFileUrl = booking.proofFile ? `${protocol}://${host}/uploads/id-proofs/${booking.proofFile}` : null;

    const payload = {
      booking,
      files: {
        paymentProofUrl,
        proofFileUrl
      }
    };

    const filename = `booking_${booking.bookingId || booking.id}.json`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/json');
    return res.send(JSON.stringify(payload, null, 2));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Download packaged booking: ZIP containing booking.pdf and any uploaded proof files
 */
export const getBookingPackage = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;
    if (!bookingId) return res.status(400).json({ message: 'Booking ID is required' });

    const query = `
      SELECT b.*, 
             COALESCE(g.name, 'Guest') as guestName,
             COALESCE(g.email, '') as guestEmail,
             COALESCE(g.phone, '') as guestPhone,
             g.uniqueId as guestUniqueId,
             h.name as hotelName,
             r.type as roomType
      FROM bookings b
      LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN hotels h ON b.hotelId = h.id
      JOIN rooms r ON b.roomId = r.id
      WHERE b.id = ?
      LIMIT 1
    `;

    const bookings = await executeQuery(query, [bookingId]);
    if (!bookings || bookings.length === 0) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    const booking = bookings[0];

    // Prepare ZIP stream
    const filename = `booking_${booking.bookingId || booking.id}.zip`;
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/zip');

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.on('error', (err) => {
      console.error('Archive error:', err && err.message);
      if (!res.headersSent) res.status(500).json({ message: 'Failed to create archive' });
    });

    // Pipe archive to response
    archive.pipe(res);

    // Create booking PDF and append as stream
    const pdfStream = new PassThrough();
    archive.append(pdfStream, { name: 'booking.pdf' });

    // Build PDF contents
    const doc = new PDFDocument({ margin: 50 });
    doc.fontSize(20).text('Booking Details', { align: 'center' });
    doc.moveDown();

    // Format dates properly
    const formatDate = (dateStr) => {
      if (!dateStr) return 'N/A';
      try {
        return new Date(dateStr).toLocaleDateString('en-IN', { 
          weekday: 'short', 
          year: 'numeric', 
          month: 'short', 
          day: 'numeric' 
        });
      } catch (e) {
        return dateStr;
      }
    };

    const lines = [
      [`Booking ID`, booking.id],
      [`Confirmation Number`, booking.bookingId || booking.confirmationNumber || 'N/A'],
      [`Guest Name`, booking.guestName || 'Guest'],
      [`Guest Email`, booking.guestEmail || 'N/A'],
      [`Guest Phone`, booking.guestPhone || 'N/A'],
      [`Hotel`, booking.hotelName || 'Default Hotel'],
      [`Room Type`, booking.roomType || 'N/A'],
      [`Number of Rooms`, booking.numberOfRooms || 1],
      [`Number of Guests`, booking.numberOfGuests || booking.numberOfGuests === 0 ? booking.numberOfGuests : 'N/A'],
      [`Number of Adults`, booking.numberOfAdults || 1],
      [`Number of Children`, booking.numberOfChildren || 0],
      [`Check-in Date`, formatDate(booking.checkInDate)],
      [`Check-out Date`, formatDate(booking.checkOutDate)],
      [`Number of Nights`, booking.numberOfNights || 'N/A'],
      [`Price per Night`, booking.pricePerNight ? `₹${parseFloat(booking.pricePerNight).toFixed(2)}` : 'N/A'],
      [`Total Price`, booking.totalPrice ? `₹${parseFloat(booking.totalPrice).toFixed(2)}` : 'N/A'],
      [`GST Amount`, booking.gstAmount ? `₹${parseFloat(booking.gstAmount).toFixed(2)}` : '₹0.00'],
      [`GST Type`, booking.gstType ? booking.gstType.charAt(0).toUpperCase() + booking.gstType.slice(1) : 'N/A'],
      [`Payment Type`, booking.paymentType ? booking.paymentType.charAt(0).toUpperCase() + booking.paymentType.slice(1) : 'N/A'],
      [`Payment Status`, booking.paymentStatus ? booking.paymentStatus.toUpperCase() : 'N/A'],
      [`Payment Verified`, booking.paymentStatus === 'completed' ? 'YES ✓' : booking.paymentStatus === 'paid' ? 'YES ✓' : 'NO'],
      [`Payment Proof`, booking.paymentProof ? 'ATTACHED ✓' : 'NOT PROVIDED'],
      [`ID Proof`, booking.idProof ? 'ATTACHED ✓' : 'NOT PROVIDED'],
      [`Booking Status`, booking.bookingStatus ? booking.bookingStatus.replace(/_/g, ' ').toUpperCase() : 'N/A']
    ];

    doc.fontSize(11);
    lines.forEach(([k, v]) => {
      doc.text(`${k}: ${v}`);
      doc.moveDown(0.3);
    });

    doc.moveDown();
    doc.fontSize(12).text('Special Requests:', { underline: true });
    doc.fontSize(11);
    if (booking.specialRequests) {
      doc.text(booking.specialRequests);
    } else {
      doc.text('None');
    }

    // Payment Verification Section
    doc.moveDown(0.5);
    doc.fontSize(14).text('Payment Verification Status', { underline: true });
    doc.fontSize(11);
    if (booking.paymentStatus === 'completed' || booking.paymentStatus === 'paid') {
      doc.text('✓ Payment has been verified and accepted');
      doc.text(`Status: ${booking.paymentStatus.toUpperCase()}`);
      if (booking.paymentProof) {
        doc.text('✓ Payment proof has been reviewed and verified');
      }
    } else {
      doc.text('⚠ Payment verification pending');
      doc.text(`Current Status: ${booking.paymentStatus ? booking.paymentStatus.toUpperCase() : 'UNKNOWN'}`);
    }

    // ID Proof Verification Section
    doc.moveDown(0.5);
    doc.fontSize(14).text('ID Proof Verification Status', { underline: true });
    doc.fontSize(11);
    if (booking.idProof) {
      doc.text('✓ ID Proof has been provided and stored');
      doc.text(`Proof Type: ${booking.idProofType || 'Not specified'}`);
    } else {
      doc.text('⚠ ID Proof verification pending');
    }

    doc.end();
    // Pipe the PDF doc into the PassThrough
    doc.pipe(pdfStream);

    // Attach uploaded files if present
    const uploadsDir = path.join('/var/www/hotel/server', 'uploads');
    console.log('📁 Uploads directory:', uploadsDir);
    
    // Payment proof
    if (booking.paymentProof) {
      const paymentPath = path.join(uploadsDir, 'payment-proofs', booking.paymentProof);
      console.log('💳 Checking payment proof:', paymentPath);
      console.log('💳 Payment proof exists?', fs.existsSync(paymentPath));
      if (fs.existsSync(paymentPath)) {
        archive.file(paymentPath, { name: `payment-proof${path.extname(paymentPath)}` });
        console.log('✅ Added payment proof to archive');
      } else {
        console.log('❌ Payment proof file not found at:', paymentPath);
      }
    } else {
      console.log('⚠️ No payment proof in booking record');
    }

    // ID proof - fixed to use correct column name
    if (booking.idProof) {
      const proofPath = path.join(uploadsDir, 'id-proofs', booking.idProof);
      console.log('🆔 Checking ID proof:', proofPath);
      console.log('🆔 ID proof exists?', fs.existsSync(proofPath));
      if (fs.existsSync(proofPath)) {
        archive.file(proofPath, { name: `id-proof${path.extname(proofPath)}` });
        console.log('✅ Added ID proof to archive');
      } else {
        console.log('❌ ID proof file not found at:', proofPath);
      }
    } else {
      console.log('⚠️ No ID proof in booking record');
    }

    // Finalize archive after a small delay to allow streams to start (PDF streaming)
    // Once doc finishes, finalize archive
    pdfStream.on('end', () => {
      archive.finalize();
    });

    // In case PDF already ended quickly, set a fallback finalize
    setTimeout(() => {
      if (!archive.pointer || archive.pointer === 0) {
        try { archive.finalize(); } catch (e) {}
      }
    }, 1000);

  } catch (error) {
    console.error('getBookingPackage error:', error && error.message);
    res.status(500).json({ message: error.message });
  }
};

export const getRevenueReport = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { dateFrom, dateTo } = req.query;

    let query = `
      SELECT 
        DATE(b.createdAt) as date,
        COUNT(*) as bookings,
        SUM(b.totalPrice) as totalAmount,
        SUM(CASE WHEN b.paymentStatus = 'paid' THEN b.totalPrice ELSE 0 END) as paidAmount
      FROM bookings b
      WHERE 1=1
    `;

    const params = [];

    if (dateFrom) {
      query += ' AND b.createdAt >= ?';
      params.push(dateFrom);
    }

    if (dateTo) {
      query += ' AND b.createdAt < DATE_ADD(?, INTERVAL 1 DAY)';
      params.push(dateTo);
    }

    query += ' GROUP BY DATE(b.createdAt) ORDER BY date DESC';

    const report = await executeQuery(query, params);
    res.json(report);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getOccupancyReport = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const report = await executeQuery(`
      SELECT 
        h.name as hotelName,
        r.type as roomType,
        r.availability as totalRooms,
        COALESCE(SUM(CASE WHEN b.bookingStatus IN ('confirmed', 'checked_in') THEN b.numberOfRooms ELSE 0 END), 0) as occupiedRooms,
        (r.availability - COALESCE(SUM(CASE WHEN b.bookingStatus IN ('confirmed', 'checked_in') THEN b.numberOfRooms ELSE 0 END), 0)) as availableRooms,
        ROUND((COALESCE(SUM(CASE WHEN b.bookingStatus IN ('confirmed', 'checked_in') THEN b.numberOfRooms ELSE 0 END), 0) / r.availability) * 100, 2) as occupancyRate
      FROM rooms r
      JOIN hotels h ON r.hotelId = h.id
      LEFT JOIN bookings b ON r.id = b.roomId
      GROUP BY r.id, h.id
      ORDER BY h.name, r.type
    `);

    res.json(report);
  } catch (error) {
    console.error('getOccupancyReport error:', error);
    res.status(500).json({ message: error.message });
  }
};

// Website Status Management

export const getWebsiteStatus = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const status = await WebsiteStatus.getStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const closeWebsite = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { message } = req.body;
    const maintenanceMessage = message || 'Website is under maintenance. Please try again later.';

    await WebsiteStatus.closeWebsite(req.user.userId, maintenanceMessage);
    const updatedStatus = await WebsiteStatus.getStatus();

    try {
      const io = req.app.locals.io;
      if (io) io.emit('websiteStatusChanged', { status: updatedStatus });
    } catch (emitErr) {
      console.error('Failed to emit websiteStatusChanged (close) event:', emitErr && emitErr.message);
    }

    res.json({
      message: 'Website closed successfully',
      status: updatedStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const openWebsite = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    await WebsiteStatus.openWebsite();
    const updatedStatus = await WebsiteStatus.getStatus();

    try {
      const io = req.app.locals.io;
      if (io) io.emit('websiteStatusChanged', { status: updatedStatus });
    } catch (emitErr) {
      console.error('Failed to emit websiteStatusChanged (open) event:', emitErr && emitErr.message);
    }

    res.json({
      message: 'Website opened successfully',
      status: updatedStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const toggleWebsite = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { message } = req.body;
    const currentStatus = await WebsiteStatus.getStatus();

    if (currentStatus.isOpen) {
      const maintenanceMessage = message || 'Website is under maintenance. Please try again later.';
      await WebsiteStatus.closeWebsite(req.user.userId, maintenanceMessage);
    } else {
      await WebsiteStatus.openWebsite();
    }

    const updatedStatus = await WebsiteStatus.getStatus();
    try {
      const io = req.app.locals.io;
      if (io) io.emit('websiteStatusChanged', { status: updatedStatus });
    } catch (emitErr) {
      console.error('Failed to emit websiteStatusChanged (toggle) event:', emitErr && emitErr.message);
    }

    res.json({
      message: `Website ${updatedStatus.isOpen ? 'opened' : 'closed'} successfully`,
      status: updatedStatus
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin Profile Management
export const getAdminProfile = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const admin = await executeQuery(
      'SELECT id, uuid, firstName, lastName, email, phone, role, createdAt FROM users WHERE id = ? AND role = ?',
      [req.user.userId, 'super-admin']
    );

    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: 'Admin profile not found' });
    }

    res.json(admin[0]);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAdminProfile = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { firstName, lastName, email, phone, currentPassword, newPassword } = req.body;

    // Get current admin
    const admin = await executeQuery(
      'SELECT * FROM users WHERE id = ? AND role = ?',
      [req.user.userId, 'super-admin']
    );

    if (!admin || admin.length === 0) {
      return res.status(404).json({ message: 'Admin not found' });
    }

    // Check if email is being changed and if it's already taken by another user
    // Note: Currently only one admin exists, but keeping validation for future multi-admin support
    if (email && email !== admin[0].email) {
      const existingUser = await executeQuery(
        'SELECT id FROM users WHERE email = ? AND id != ?',
        [email, req.user.userId]
      );

      if (existingUser.length > 0) {
        return res.status(400).json({ message: 'Email address is already in use by another account' });
      }
    }

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ message: 'Current password required to change password' });
      }

      const bcryptjs = await import('bcryptjs');
      const passwordMatch = await bcryptjs.default.compare(currentPassword, admin[0].password);
      if (!passwordMatch) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      const hashedPassword = await bcryptjs.default.hash(newPassword, 10);
      await executeQuery(
        'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ?, password = ? WHERE id = ?',
        [firstName || admin[0].firstName, lastName || admin[0].lastName, email || admin[0].email, phone || admin[0].phone, hashedPassword, req.user.userId]
      );
    } else {
      await executeQuery(
        'UPDATE users SET firstName = ?, lastName = ?, email = ?, phone = ? WHERE id = ?',
        [firstName || admin[0].firstName, lastName || admin[0].lastName, email || admin[0].email, phone || admin[0].phone, req.user.userId]
      );
    }

    const updatedAdmin = await executeQuery(
      'SELECT id, uuid, firstName, lastName, email, phone, role FROM users WHERE id = ?',
      [req.user.userId]
    );

    res.json({
      message: 'Profile updated successfully',
      admin: updatedAdmin[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Reviews Management
export const getAllReviews = async (req, res) => {
  try {
    // Note: reviews table may not exist yet, return empty array
    const reviews = await executeQuery(`
      SELECT r.*, u.firstName, u.lastName, u.email 
      FROM reviews r 
      LEFT JOIN users u ON r.userId = u.id 
      ORDER BY r.createdAt DESC
    `).catch(() => []);

    res.json(reviews || []);
  } catch (error) {
    res.json([]); // Return empty array instead of error
  }
};

export const approveReview = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { reviewId } = req.params;

    await executeQuery(
      'UPDATE reviews SET approved = 1 WHERE id = ?',
      [reviewId]
    );

    const updatedReview = await executeQuery(
      'SELECT * FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({
      message: 'Review approved successfully',
      review: updatedReview[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const rejectReview = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { reviewId } = req.params;

    await executeQuery(
      'UPDATE reviews SET approved = 0 WHERE id = ?',
      [reviewId]
    );

    const updatedReview = await executeQuery(
      'SELECT * FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({
      message: 'Review rejected successfully',
      review: updatedReview[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { reviewId } = req.params;

    await executeQuery(
      'DELETE FROM reviews WHERE id = ?',
      [reviewId]
    );

    res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateWebsiteStatus = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { isOpen, maintenanceMode, maintenanceMessage } = req.body;

    let updateQuery = 'UPDATE website_status SET ';
    let params = [];
    let setCount = 0;
    
    if (isOpen !== undefined) {
      updateQuery += 'isOpen = ?';
      params.push(isOpen ? 1 : 0);
      setCount++;
    }
    
    if (maintenanceMode !== undefined) {
      if (setCount > 0) updateQuery += ', ';
      updateQuery += 'maintenanceMode = ?';
      params.push(maintenanceMode ? 1 : 0);
      setCount++;
    }
    
    if (maintenanceMessage !== undefined) {
      if (setCount > 0) updateQuery += ', ';
      updateQuery += 'maintenanceMessage = ?';
      params.push(maintenanceMessage);
    }
    
    updateQuery += ', updatedAt = NOW() WHERE id = 1';

    await executeQuery(updateQuery, params);

    const status = await executeQuery('SELECT * FROM website_status WHERE id = 1');
    // Emit website status change
    try {
      const io = req.app.locals.io;
      if (io) io.emit('websiteStatusChanged', { status: status[0] });
    } catch (emitErr) {
      console.error('Failed to emit websiteStatusChanged event:', emitErr && emitErr.message);
    }

    res.json({
      message: 'Website status updated successfully',
      status: status[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Hotel Policies Management
export const getHotelPolicies = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const policies = await executeQuery(
      'SELECT * FROM hotel_policies WHERE hotelId = ? LIMIT 1',
      [hotelId || 1]
    );

    res.json({ policies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateHotelPolicy = async (req, res) => {
  try {
    const { hotelId, type } = req.params;
    const {
      checkInTime,
      checkOutTime,
      idRequirement,
      cancellationPolicy,
      additionalInfo
    } = req.body;

    // Check if policy exists
    const existing = await executeQuery(
      'SELECT id FROM hotel_policies WHERE hotelId = ?',
      [hotelId || 1]
    );

    if (existing.length === 0) {
      // Insert new policy
      await executeQuery(
        `INSERT INTO hotel_policies 
         (hotelId, type, checkInTime, checkOutTime, idRequirement_text, cancellationPolicy, additionalInfo, isActive)
         VALUES (?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          hotelId || 1,
          type || 'checkin',
          checkInTime,
          checkOutTime,
          idRequirement,
          cancellationPolicy,
          additionalInfo || null
        ]
      );
    } else {
      // Update existing policy
      await executeQuery(
        `UPDATE hotel_policies 
         SET checkInTime = ?, checkOutTime = ?, idRequirement_text = ?, cancellationPolicy = ?, 
             additionalInfo = ?, updatedAt = NOW()
         WHERE hotelId = ?`,
        [
          checkInTime,
          checkOutTime,
          idRequirement,
          cancellationPolicy,
          additionalInfo || null,
          hotelId || 1
        ]
      );
    }

    // Get updated policy
    const updated = await executeQuery(
      'SELECT * FROM hotel_policies WHERE hotelId = ? LIMIT 1',
      [hotelId || 1]
    );

    res.json({
      message: 'Policy updated successfully',
      policy: updated[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getActivePolicyType = async (req, res) => {
  try {
    // This endpoint can be used to determine which policy to use based on date
    // For now, return both and let frontend decide based on date/holiday calendar
    const policies = await executeQuery(
      'SELECT * FROM hotel_policies WHERE hotelId = 1 AND isActive = true'
    );

    res.json({ policies });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Update payment settings
 */
export const updatePaymentSettings = async (req, res) => {
  try {
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { hotelId } = req.params;
    const {
      paymentPhoneNumber,
      paymentUpiId,
      partialPaymentEnabled,
      partialPaymentPercentage,
      gstEnabled,
      gstPercentage,
      gstType,
      termsAndConditions
    } = req.body;

    // Check if settings exist
    const existing = await executeQuery(
      'SELECT id FROM payment_settings WHERE hotelId = ?',
      [hotelId]
    );

    if (existing.length === 0) {
      // Insert new settings
      await executeQuery(
        `INSERT INTO payment_settings 
         (hotelId, paymentPhoneNumber, paymentUpiId, partialPaymentEnabled, partialPaymentPercentage, gstEnabled, gstPercentage, gstType, termsAndConditions)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [hotelId, paymentPhoneNumber, paymentUpiId, partialPaymentEnabled === 'true' || partialPaymentEnabled === true ? 1 : 0, partialPaymentPercentage, gstEnabled === 'true' || gstEnabled === true ? 1 : 0, gstPercentage, gstType, termsAndConditions || null]
      );
    } else {
      // Update existing settings
      await executeQuery(
        `UPDATE payment_settings 
         SET paymentPhoneNumber = ?, paymentUpiId = ?, partialPaymentEnabled = ?, 
             partialPaymentPercentage = ?, gstEnabled = ?, gstPercentage = ?, gstType = ?, termsAndConditions = ?
         WHERE hotelId = ?`,
        [paymentPhoneNumber, paymentUpiId, partialPaymentEnabled === 'true' || partialPaymentEnabled === true ? 1 : 0, partialPaymentPercentage, gstEnabled === 'true' || gstEnabled === true ? 1 : 0, gstPercentage, gstType, termsAndConditions || null, hotelId]
      );
    }

    // Get updated settings
    const updated = await executeQuery(
      'SELECT * FROM payment_settings WHERE hotelId = ?',
      [hotelId]
    );

    console.log('Payment settings updated:', updated[0]);

    // Convert DB boolean values (0/1) to actual booleans for client response
    const settingsForClient = {
      ...updated[0],
      partialPaymentEnabled: updated[0].partialPaymentEnabled ? true : false,
      gstEnabled: updated[0].gstEnabled ? true : false
    };

    // Emit payment settings updated event to connected clients
    try {
      const io = req.app.locals.io;
      if (io) {
        console.log(`📡 Broadcasting paymentSettingsUpdated to all clients for hotelId: ${hotelId}`);
        io.emit('paymentSettingsUpdated', {
          hotelId: parseInt(hotelId, 10),
          settings: settingsForClient
        });
        console.log('✓ Broadcast sent successfully');
      } else {
        console.warn('⚠️ Socket.io instance not available in req.app.locals.io');
      }
    } catch (emitErr) {
      console.error('Failed to emit paymentSettingsUpdated:', emitErr && emitErr.message);
    }

    res.json({
      message: 'Payment settings updated successfully',
      settings: settingsForClient
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Get all bookings pending admin approval (manual payment workflow)
 */
export const getPendingApprovals = async (req, res) => {
  try {
    const query = `
      SELECT 
        b.*,
        g.name as guestName,
        g.email as guestEmail,
        g.phone as guestPhone,
        g.uniqueId as guestUniqueId,
        r.type as roomType,
        r.pricePerNight,
        h.name as hotelName,
        ps.paymentPhoneNumber,
        ps.paymentUpiId
      FROM bookings b
      JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
      JOIN rooms r ON b.roomId = r.id
      JOIN hotels h ON r.hotelId = h.id
      LEFT JOIN payment_settings ps ON h.id = ps.hotelId
      WHERE b.adminApprovalStatus = 'pending'
      ORDER BY b.createdAt DESC
    `;

    const bookings = await executeQuery(query);

    // Add full URL for payment proof images
    const bookingsWithUrls = bookings.map(booking => ({
      ...booking,
      paymentProofUrl: booking.paymentProof 
        ? `${req.protocol}://${req.get('host')}/uploads/payment-proofs/${booking.paymentProof}`
        : null
    }));

    res.json({
      success: true,
      count: bookingsWithUrls.length,
      bookings: bookingsWithUrls
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Approve a booking after verifying payment proof
 */
export const approveBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { adminNotes } = req.body;
    const adminId = req.user?.userId; // From auth middleware - use userId not id
    const adminName = req.user?.email || 'Admin'; // Use email as name

    // Get booking details
    const [booking] = await executeQuery(
      `SELECT b.*, 
              g.email, 
              g.name as guestName, 
              r.type as roomType, 
              h.name as hotelName
       FROM bookings b
       LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
       JOIN rooms r ON b.roomId = r.id
       JOIN hotels h ON r.hotelId = h.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.adminApprovalStatus !== 'pending') {
      return res.status(400).json({ 
        message: `Booking is already ${booking.adminApprovalStatus}` 
      });
    }

    // Determine final status based on payment type
    let newStatus = 'confirmed';
    // When admin approves, mark payment as completed (admin has verified payment proof)
    let newPaymentStatus = 'completed';

    // Update booking
    await executeQuery(
      `UPDATE bookings 
       SET bookingStatus = ?, 
           adminApprovalStatus = 'approved',
           paymentStatus = ?
       WHERE id = ?`,
      [newStatus, newPaymentStatus, bookingId]
    );

    // Update room availability - mark room(s) as booked
    // Decrement by the number of rooms booked (numberOfRooms field)
    const numberOfRooms = booking.numberOfRooms || 1;
    await executeQuery(
      `UPDATE rooms 
       SET availability = GREATEST(0, availability - ?)
       WHERE id = ?`,
      [numberOfRooms, booking.roomId]
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_actions (adminId, actionType, bookingId, details)
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        'approve',
        bookingId,
        JSON.stringify({
          bookingId: booking.bookingId,
          paymentType: booking.paymentType,
          paymentAmountRequired: booking.paymentAmountRequired,
          transactionId: booking.transactionId,
          adminNotes,
          adminName
        })
      ]
    );

    // Send confirmation email to guest
    if (booking.email) {
      try {
        console.log('📧 Attempting to send booking confirmation email to:', booking.email);
        await sendGuestBookingConfirmation(booking.email, {
          uniqueId: booking.guestUniqueId,
          confirmationNumber: booking.bookingId,
          guestName: booking.guestName || 'Guest',
          hotelName: booking.hotelName,
          roomType: booking.roomType,
          checkIn: booking.checkInDate,
          checkOut: booking.checkOutDate,
          guests: booking.numberOfGuests,
          totalPrice: booking.totalPrice
        });
        console.log('✅ Booking confirmation email sent successfully to:', booking.email);
      } catch (emailError) {
        console.error('❌ Failed to send booking confirmation email:', emailError.message);
        console.error('Email error details:', emailError);
        // Don't fail the approval if email fails
      }
    } else {
      console.log('⚠️ No email address found for booking, skipping confirmation email');
    }

    // Send notification to admin
    try {
      const adminEmail = process.env.ADMIN_EMAIL || '';
      await sendAdminNotificationEmail(adminEmail, 
        'Booking Approved', 
        `Booking #${booking.bookingId} has been approved`, 
        {
          'Booking ID': booking.bookingId,
          'Guest Name': booking.guestName || 'Unknown',
          'Guest Email': booking.email || 'Not provided',
          'Hotel': booking.hotelName,
          'Room Type': booking.roomType,
          'Check-in': new Date(booking.checkInDate).toLocaleDateString(),
          'Check-out': new Date(booking.checkOutDate).toLocaleDateString(),
          'Total Amount': `₹${booking.totalPrice}`,
          'Payment Type': booking.paymentType === 'full' ? 'Full Payment' : 'Partial Payment',
          'Amount Paid': `₹${booking.paymentAmountRequired || '0'}`,
          'Approved By': adminName
        }
      );
    } catch (emailError) {
      // Don't fail the approval if email fails
    }

    // Emit socket event for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit('bookingUpdated', {
        bookingId,
        status: newStatus,
        adminApprovalStatus: 'approved'
      });
    }

    res.json({
      success: true,
      message: 'Booking approved successfully',
      booking: {
        id: bookingId,
        confirmationNumber: booking.confirmationNumber,
        status: newStatus,
        adminApprovalStatus: 'approved',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * Reject a booking
 */
export const rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const { rejectionReason, adminNotes } = req.body;
    const adminId = req.user?.userId; // Use userId not id
    const adminName = req.user?.email || 'Admin'; // Use email as name

    if (!rejectionReason) {
      return res.status(400).json({ message: 'Rejection reason is required' });
    }

    // Get booking details
    const [booking] = await executeQuery(
      `SELECT b.*, 
              g.email, 
              g.name as guestName
       FROM bookings b
       LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.adminApprovalStatus !== 'pending') {
      return res.status(400).json({ 
        message: `Booking is already ${booking.adminApprovalStatus}` 
      });
    }

    // Update booking
    await executeQuery(
      `UPDATE bookings 
       SET bookingStatus = 'cancelled',
           adminApprovalStatus = 'rejected',
           paymentStatus = 'refunded'
       WHERE id = ?`,
      [bookingId]
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_actions (adminId, actionType, bookingId, details)
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        'reject',
        bookingId,
        JSON.stringify({
          bookingId: booking.bookingId,
          rejectionReason,
          transactionId: booking.transactionId,
          adminNotes,
          adminName
        })
      ]
    );

    // TODO: Send rejection email to guest
    // await sendGuestBookingRejected(booking, rejectionReason);

    // Emit socket event for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit('bookingUpdated', {
        bookingId,
        status: 'cancelled',
        adminApprovalStatus: 'rejected'
      });
    }

    res.json({
      success: true,
      message: 'Booking rejected successfully',
      booking: {
        id: bookingId,
        bookingId: booking.bookingId,
        status: 'cancelled',
        adminApprovalStatus: 'rejected',
        rejectionReason
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove room image
export const removeRoomImage = async (req, res) => {
  try {
    const { roomId } = req.params;


    // Check if room exists
    const existingRoom = await executeQuery('SELECT * FROM rooms WHERE id = ?', [roomId]);
    if (!existingRoom.length) {
      return res.status(404).json({ message: 'Room not found' });
    }

    // Remove the image by setting it to null
    await executeQuery('UPDATE rooms SET imageUrl = NULL WHERE id = ?', [roomId]);

    // Return updated room data
    const updatedRoom = await executeQuery('SELECT * FROM rooms WHERE id = ?', [roomId]);
    

    res.json({ 
      message: 'Room image removed successfully', 
      room: updatedRoom[0] 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Amenities Management
export const getAllAmenities = async (req, res) => {
  try {
    const amenities = await executeQuery(
      'SELECT * FROM amenities ORDER BY category, name ASC'
    );
    
    res.json({ data: amenities });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createAmenity = async (req, res) => {
  try {
    const { name, category, icon, description } = req.body;

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    // Check if amenity already exists
    const existing = await executeQuery(
      'SELECT * FROM amenities WHERE name = ? AND category = ?',
      [name, category]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Amenity already exists in this category' });
    }

    const result = await executeQuery(
      'INSERT INTO amenities (name, category, icon, description, createdAt) VALUES (?, ?, ?, ?, NOW())',
      [name, category, icon || null, description || null]
    );

    const amenity = {
      id: result.insertId,
      name,
      category,
      icon,
      description
    };

    // Emit amenity added event
    try {
      const io = req.app.locals.io;
      if (io) io.emit('amenityAdded', { amenity });
    } catch (emitErr) {
      console.error('Failed to emit amenityAdded event:', emitErr && emitErr.message);
    }

    res.status(201).json({
      message: 'Amenity created successfully',
      amenity
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateAmenity = async (req, res) => {
  try {
    const { amenityId } = req.params;
    const { name, category, icon, description } = req.body;

    // Check if amenity exists
    const existing = await executeQuery('SELECT * FROM amenities WHERE id = ?', [amenityId]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Amenity not found' });
    }

    await executeQuery(
      'UPDATE amenities SET name = ?, category = ?, icon = ?, description = ?, updatedAt = NOW() WHERE id = ?',
      [name || existing[0].name, category || existing[0].category, icon || existing[0].icon, description || existing[0].description, amenityId]
    );

    // Get updated amenity
    const updated = await executeQuery('SELECT * FROM amenities WHERE id = ?', [amenityId]);

    // Emit amenity updated event
    try {
      const io = req.app.locals.io;
      if (io) io.emit('amenityUpdated', { amenity: updated[0] });
    } catch (emitErr) {
      console.error('Failed to emit amenityUpdated event:', emitErr && emitErr.message);
    }

    res.json({
      message: 'Amenity updated successfully',
      amenity: updated[0]
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteAmenity = async (req, res) => {
  try {
    const { amenityId } = req.params;

    // Check if amenity exists
    const existing = await executeQuery('SELECT * FROM amenities WHERE id = ?', [amenityId]);
    if (!existing.length) {
      return res.status(404).json({ message: 'Amenity not found' });
    }

    await executeQuery('DELETE FROM amenities WHERE id = ?', [amenityId]);

    // Emit amenity deleted event
    try {
      const io = req.app.locals.io;
      if (io) io.emit('amenityDeleted', { amenityId });
    } catch (emitErr) {
      console.error('Failed to emit amenityDeleted event:', emitErr && emitErr.message);
    }

    res.json({ message: 'Amenity deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAmenitiesByCategory = async (req, res) => {
  try {
    const amenities = await executeQuery(
      'SELECT * FROM amenities ORDER BY category, name ASC'
    );
    
    // Group by category
    const grouped = amenities.reduce((acc, amenity) => {
      const category = amenity.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(amenity);
      return acc;
    }, {});

    res.json({ data: grouped });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteBooking = async (req, res) => {
  try {
    // Only admin
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;
    const adminId = req.user?.userId;
    const adminName = req.user?.email || 'Admin';

    // Get booking details before deletion
    const [booking] = await executeQuery(
      `SELECT b.*, 
              g.email, 
              g.name as guestName,
              r.type as roomType,
              h.name as hotelName
       FROM bookings b
       LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
       JOIN rooms r ON b.roomId = r.id
       JOIN hotels h ON r.hotelId = h.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check if booking is in a state that can be deleted
    if (booking.status === 'checked_in' || booking.status === 'completed') {
      return res.status(400).json({ 
        message: 'Cannot delete booking that is already checked in or completed' 
      });
    }

  // Note: billing records have been removed from the system. No related bills to delete.

    // Delete payment proof file if exists
    if (booking.paymentProof) {
      const fs = await import('fs');
      const path = await import('path');
      const paymentProofPath = path.join(process.cwd(), 'uploads', 'payment-proofs', booking.paymentProof);
      
      try {
        if (fs.existsSync(paymentProofPath)) {
          fs.unlinkSync(paymentProofPath);
        }
      } catch (fileError) {
        // Don't fail the deletion if file deletion fails
      }
    }

    // If booking was confirmed, restore room availability
    if (booking.status === 'confirmed' && booking.adminApprovalStatus === 'approved') {
      const numberOfRooms = booking.numberOfRooms || 1;
      await executeQuery(
        `UPDATE rooms 
         SET availability = availability + ?
         WHERE id = ?`,
        [numberOfRooms, booking.roomId]
      );
    }

    // Log admin action before deletion
    await executeQuery(
      `INSERT INTO admin_actions (adminId, actionType, bookingId, details)
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        'delete',
        bookingId,
        JSON.stringify({
          confirmationNumber: booking.confirmationNumber,
          guestName: booking.guestName || 'Unknown',
          guestEmail: booking.email || 'Not provided',
          hotelName: booking.hotelName,
          roomType: booking.roomType,
          checkInDate: booking.checkInDate,
          checkOutDate: booking.checkOutDate,
          totalPrice: booking.totalPrice,
          status: booking.status,
          adminName
        })
      ]
    );

    // Delete the booking
    await executeQuery('DELETE FROM bookings WHERE id = ?', [bookingId]);

    // Emit socket event for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit('bookingDeleted', {
        bookingId,
        confirmationNumber: booking.confirmationNumber
      });
    }

    res.json({
      success: true,
      message: 'Booking deleted successfully',
      deletedBooking: {
        id: bookingId,
        confirmationNumber: booking.confirmationNumber,
        guestName: booking.guestName || 'Unknown'
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateBooking = async (req, res) => {
  try {
    // Admin only - authenticated by middleware
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;
    const { paymentStatus, status, adminNotes } = req.body;
    const adminId = req.user?.userId;
    const adminName = req.user?.email || 'Admin';

    // Get current booking details
    const [booking] = await executeQuery(
      `SELECT b.*, 
              g.email, 
              g.name as guestName
       FROM bookings b
       LEFT JOIN guest_profiles g ON b.guestUniqueId = g.uniqueId
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Build update query
    const updates = [];
    const values = [];

    if (paymentStatus) {
      if (!['pending', 'completed', 'failed'].includes(paymentStatus)) {
        return res.status(400).json({ message: 'Invalid payment status' });
      }
      updates.push('paymentStatus = ?');
      values.push(paymentStatus);
    }

    if (status) {
      updates.push('bookingStatus = ?');
      values.push(status);
    }

    if (!updates.length) {
      return res.status(400).json({ message: 'No valid fields to update' });
    }

    values.push(bookingId);

    // Update booking
    await executeQuery(
      `UPDATE bookings 
       SET ${updates.join(', ')}
       WHERE id = ?`,
      values
    );

    // Get updated booking
    const [updatedBooking] = await executeQuery(
      `SELECT * FROM bookings WHERE id = ?`,
      [bookingId]
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_actions (adminId, actionType, bookingId, details)
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        'update',
        bookingId,
        JSON.stringify({
          confirmationNumber: booking.confirmationNumber,
          previousPaymentStatus: booking.paymentStatus,
          newPaymentStatus: paymentStatus || booking.paymentStatus,
          previousStatus: booking.bookingStatus,
          newStatus: status || booking.bookingStatus,
          adminNotes,
          adminName
        })
      ]
    );

    // Emit socket event for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit('bookingUpdated', {
        bookingId,
        confirmationNumber: booking.confirmationNumber,
        paymentStatus: paymentStatus || booking.paymentStatus,
        bookingStatus: status || booking.bookingStatus
      });
    }

    res.json({
      success: true,
      message: 'Booking updated successfully',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkoutBooking = async (req, res) => {
  try {
    // Admin only - authenticated by middleware
    if (req.user.role !== 'super-admin') {
      return res.status(403).json({ message: 'Admin only' });
    }

    const { bookingId } = req.params;
    const adminId = req.user?.userId;
    const adminName = req.user?.email || 'Admin';

    // Get booking details
    const [booking] = await executeQuery(
      `SELECT b.*, r.id as roomId
       FROM bookings b
       JOIN rooms r ON b.roomId = r.id
       WHERE b.id = ?`,
      [bookingId]
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.bookingStatus === 'checked_out') {
      return res.status(400).json({ 
        message: 'Booking is already checked out' 
      });
    }

    if (booking.bookingStatus === 'cancelled') {
      return res.status(400).json({ 
        message: 'Cannot checkout a cancelled booking' 
      });
    }

    // Update booking status to checked_out
    await executeQuery(
      `UPDATE bookings 
       SET bookingStatus = 'checked_out'
       WHERE id = ?`,
      [bookingId]
    );

    // Restore room availability - increment by the number of rooms booked
    const numberOfRooms = booking.numberOfRooms || 1;
    await executeQuery(
      `UPDATE rooms 
       SET availability = availability + ?
       WHERE id = ?`,
      [numberOfRooms, booking.roomId]
    );

    // Log admin action
    await executeQuery(
      `INSERT INTO admin_actions (adminId, actionType, bookingId, details)
       VALUES (?, ?, ?, ?)`,
      [
        adminId,
        'checkout',
        bookingId,
        JSON.stringify({
          confirmationNumber: booking.confirmationNumber,
          guestName: booking.guestName || 'Unknown',
          roomType: booking.roomType,
          numberOfRooms: numberOfRooms,
          checkOutDate: booking.checkOutDate,
          adminName
        })
      ]
    );

    // Emit socket event for real-time updates
    const io = req.app.locals.io;
    if (io) {
      io.emit('bookingCheckedOut', {
        bookingId,
        confirmationNumber: booking.confirmationNumber,
        roomId: booking.roomId,
        numberOfRooms: numberOfRooms
      });
    }

    // Get updated booking
    const [updatedBooking] = await executeQuery(
      `SELECT * FROM bookings WHERE id = ?`,
      [bookingId]
    );

    res.json({
      success: true,
      message: 'Booking checked out successfully. Room availability updated.',
      booking: updatedBooking
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

