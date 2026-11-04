import { Hotel, Room } from '../models/index.js';
import { validateHotel, validateRoom } from '../utils/validators.js';
import { executeQuery } from '../config/database.js';

export const createHotel = async (req, res) => {
  try {
    const { error, value } = validateHotel(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await Hotel.create(value);
    
    res.status(201).json({
      message: 'Hotel created successfully',
      hotelId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllHotels = async (req, res) => {
  try {
    const hotels = await Hotel.getAll();
    
    if (!hotels || hotels.length === 0) {
      return res.json([]);
    }

    // Get rooms for each hotel
    const hotelsWithRooms = await Promise.all(
      hotels.map(async (hotel) => {
        try {
          const rooms = await Room.getByHotel(hotel.id);
          
          return {
            ...hotel,
            amenities: typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities || '[]') : (hotel.amenities || []),
            rooms: rooms || []
          };
        } catch (err) {
          console.error(`Error fetching rooms for hotel ${hotel.id}:`, err);
          return {
            ...hotel,
            amenities: typeof hotel.amenities === 'string' ? JSON.parse(hotel.amenities || '[]') : (hotel.amenities || []),
            rooms: []
          };
        }
      })
    );
    
    res.json(hotelsWithRooms);
  } catch (error) {
    console.error('Error in getAllHotels:', error);
    res.status(500).json({ message: 'Error fetching hotels: ' + error.message });
  }
};

export const getHotelById = async (req, res) => {
  try {
    const { hotelId } = req.params;
    const hotel = await Hotel.getById(hotelId);
    
    if (!hotel) {
      return res.status(404).json({ message: 'Hotel not found' });
    }

    // Get rooms for this hotel
    const rooms = await Room.getByHotel(hotelId);

    res.json({
      ...hotel,
      amenities: JSON.parse(hotel.amenities || '[]'),
      rooms
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const searchHotels = async (req, res) => {
  try {
    const { city, checkIn, checkOut, guests } = req.query;

    let query = `
      SELECT h.*, COUNT(DISTINCT r.id) as totalRooms,
             SUM(CASE WHEN r.availability > 0 THEN 1 ELSE 0 END) as availableRooms
      FROM hotels h
      LEFT JOIN rooms r ON h.id = r.hotelId
      WHERE h.status = 'active'
    `;
    const params = [];

    if (city) {
      query += ` AND h.city LIKE ?`;
      params.push(`%${city}%`);
    }

    query += ` GROUP BY h.id ORDER BY h.name`;

    const hotels = await executeQuery(query, params);

    // Filter rooms by date and capacity if check-in/check-out provided.
    // Default guests to 1 when not provided so the API returns available room arrays
    if (checkIn && checkOut) {
      const guestsNum = parseInt(guests) || 1;
      for (let hotel of hotels) {
        const roomQuery = `
          SELECT r.* FROM rooms r
          WHERE r.hotelId = ? 
          AND r.capacity >= ?
          AND NOT EXISTS (
            SELECT 1 FROM bookings b
            WHERE b.roomId = r.id 
            AND b.bookingStatus NOT IN ('cancelled', 'checked_out')
            AND ((b.checkInDate < ? AND b.checkOutDate > ?) OR
                 (b.checkInDate >= ? AND b.checkInDate < ?) OR
                 (b.checkOutDate > ? AND b.checkOutDate <= ?))
          )
        `;
        const availableRooms = await executeQuery(roomQuery, [
          hotel.id, guestsNum, checkOut, checkIn, checkIn, checkOut, checkIn, checkOut
        ]);
        hotel.availableRooms = availableRooms;
      }
    }

    res.json(hotels);
  } catch (error) {
    console.error('searchHotels error:', error);
    res.status(500).json({ message: error.message });
  }
};

export const createRoom = async (req, res) => {
  try {
    const { error, value } = validateRoom(req.body);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    const result = await Room.create(value);
    
    res.status(201).json({
      message: 'Room created successfully',
      roomId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getRoomById = async (req, res) => {
  try {
    const { roomId } = req.params;
    const room = await Room.getById(roomId);
    
    if (!room) {
      return res.status(404).json({ message: 'Room not found' });
    }

    res.json({
      ...room,
      amenities: JSON.parse(room.amenities || '[]')
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const checkRoomAvailability = async (req, res) => {
  try {
    const { roomId, checkIn, checkOut } = req.query;

    const isAvailable = await Room.checkAvailability(roomId, checkIn, checkOut);

    res.json({ available: isAvailable });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getHotelPolicies = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    const [policies] = await executeQuery(
      'SELECT * FROM hotel_policies WHERE hotelId = ? AND isActive = true ORDER BY type',
      [hotelId]
    );

    if (!policies || policies.length === 0) {
      // Return default policy if none found
      return res.json([{
        policyType: 'regular',
        checkInTime: '12:00 PM',
        checkOutTime: '11:00 AM',
        idRequirement: 'Please carry a valid government-issued photo ID',
        voucherRequirement: 'Present this voucher at check-in',
        earlyCheckIn: 'Early check-in subject to availability',
        cancellationPolicy: 'Cancellation policy: Please contact hotel',
        additionalInfo: null
      }]);
    }

    // Ensure we always return an array
    const policyArray = Array.isArray(policies) ? policies : [policies];
    res.json(policyArray);
  } catch (error) {
    console.error('Error fetching hotel policies:', error);
    res.status(500).json({ message: error.message });
  }
};

export const getPaymentSettings = async (req, res) => {
  try {
    const { hotelId } = req.params;
    
    console.log('Fetching payment settings for hotel:', hotelId);
    
    const settings = await executeQuery(
      'SELECT * FROM payment_settings WHERE hotelId = ?',
      [hotelId]
    );

    if (!settings || settings.length === 0) {
      // Return default settings if none found
      return res.json({
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

    // Convert DB boolean values (0/1) to actual booleans
    const settingsForClient = {
      ...settings[0],
      partialPaymentEnabled: settings[0].partialPaymentEnabled ? true : false,
      gstEnabled: settings[0].gstEnabled ? true : false
    };

    res.json(settingsForClient);
  } catch (error) {
    console.error('Error fetching payment settings:', error);
    res.status(500).json({ message: error.message });
  }
};

// Serve room images as separate endpoint to avoid large JSON responses
export const getRoomImage = async (req, res) => {
  try {
    const { roomId } = req.params;
    
    const room = await Room.getById(roomId);
    if (!room || !room.imageUrl) {
      return res.status(404).json({ message: 'Room image not found' });
    }
    
    // Extract base64 data and mime type
    const matches = room.imageUrl.match(/^data:([^;]+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ message: 'Invalid image format' });
    }
    
    const mimeType = matches[1];
    const base64Data = matches[2];
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Set appropriate headers
    res.set({
      'Content-Type': mimeType,
      'Content-Length': imageBuffer.length,
      'Cache-Control': 'public, max-age=86400' // Cache for 24 hours
    });
    
    res.send(imageBuffer);
  } catch (error) {
    console.error('Error serving room image:', error);
    res.status(500).json({ message: 'Error serving room image' });
  }
};
