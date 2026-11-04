// Reconstructed clean models file
import { v4 as uuidv4 } from 'uuid';
import { executeQuery } from '../config/database.js';

// Tables to initialize (billTemplate tables removed)
export const initializeTables = async () => {
  const tables = [
    `CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      firstName VARCHAR(50) NOT NULL,
      lastName VARCHAR(50) NOT NULL,
      email VARCHAR(100) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      address TEXT,
      role ENUM('user', 'super-admin') DEFAULT 'user',
      status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
      emailVerified BOOLEAN DEFAULT FALSE,
      lastLogin DATETIME,
      permissions JSON,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS hotels (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      name VARCHAR(100) NOT NULL,
      city VARCHAR(50) NOT NULL,
      state VARCHAR(50) NOT NULL,
      address VARCHAR(255) NOT NULL,
      phone VARCHAR(20),
      email VARCHAR(100),
      description TEXT,
      amenities JSON,
      rating DECIMAL(3,2),
      status ENUM('active', 'inactive') DEFAULT 'active',
      checkInTime TIME DEFAULT '14:00:00',
      checkOutTime TIME DEFAULT '10:00:00',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS rooms (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      hotelId INT NOT NULL,
      type ENUM('single', 'double', 'suite', 'deluxe', 'five_bedded') NOT NULL,
      pricePerNight DECIMAL(10,2) NOT NULL,
      capacity INT NOT NULL,
      totalRooms INT NOT NULL,
      availableRooms INT NOT NULL,
      extraAdultCharge DECIMAL(10,2) DEFAULT 0,
      description TEXT,
      amenities JSON,
      status ENUM('active', 'inactive') DEFAULT 'active',
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS bookings (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      bookingNumber VARCHAR(20) UNIQUE NOT NULL,
      confirmationNumber VARCHAR(20),
      guestUniqueId VARCHAR(36),
      userId INT NOT NULL,
      roomId INT NOT NULL,
      hotelId INT NOT NULL,
      checkInDate DATE NOT NULL,
      checkOutDate DATE NOT NULL,
      numberOfGuests INT NOT NULL,
      numberOfRooms INT DEFAULT 1,
      totalPrice DECIMAL(10,2) NOT NULL,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
      FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
    )`,

    `CREATE TABLE IF NOT EXISTS paperTypes (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      name VARCHAR(50) NOT NULL,
      description VARCHAR(200),
      width DECIMAL(8,2),
      height DECIMAL(8,2),
      unit VARCHAR(10) DEFAULT 'mm',
      layout ENUM('portrait', 'landscape') DEFAULT 'portrait',
      columns INT DEFAULT 1,
      fontSize INT DEFAULT 11,
      margins VARCHAR(50),
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,


    `CREATE TABLE IF NOT EXISTS yearCards (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uuid VARCHAR(36) UNIQUE NOT NULL,
      year INT NOT NULL,
      title VARCHAR(200),
      description TEXT,
      imageUrl VARCHAR(500),
      imageBase64 LONGTEXT,
      \`order\` INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      uploadedBy INT,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
    )`,

    `CREATE TABLE IF NOT EXISTS guest_profiles (
      id INT AUTO_INCREMENT PRIMARY KEY,
      uniqueId VARCHAR(36) UNIQUE NOT NULL,
      email VARCHAR(100),
      name VARCHAR(200),
      phone VARCHAR(30),
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS guest_otps (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100),
      otp VARCHAR(10),
      purpose VARCHAR(50),
      used BOOLEAN DEFAULT FALSE,
      expiresAt DATETIME,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS guest_booking_sessions (
      id INT AUTO_INCREMENT PRIMARY KEY,
      email VARCHAR(100),
      sessionToken VARCHAR(255),
      expiresAt DATETIME,
      used BOOLEAN DEFAULT FALSE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`
    ,
    `CREATE TABLE IF NOT EXISTS realtime_events (
      id INT AUTO_INCREMENT PRIMARY KEY,
      tableName VARCHAR(100) NOT NULL,
      eventType VARCHAR(50) NOT NULL,
      recordId INT DEFAULT NULL,
      recordUuid VARCHAR(36) DEFAULT NULL,
      payload JSON DEFAULT NULL,
      processed TINYINT(1) DEFAULT 0,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`,

    `CREATE TABLE IF NOT EXISTS homepage_videos (
      id INT AUTO_INCREMENT PRIMARY KEY,
      hotelId INT NOT NULL DEFAULT 1,
      title VARCHAR(255) NOT NULL,
      description TEXT,
      videoUrl VARCHAR(500) NOT NULL,
      displayOrder INT DEFAULT 0,
      isActive BOOLEAN DEFAULT TRUE,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
      INDEX idx_hotelId (hotelId),
      INDEX idx_displayOrder (displayOrder)
    )`
  ];

  for (const table of tables) {
    try {
      await executeQuery(table);
    } catch (err) {
      console.error('initializeTables error:', err && err.message);
    }
  }

  // Add optional columns for proofs on bookings if they don't exist (idempotent)
  try {
    await executeQuery(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS proofType VARCHAR(50) DEFAULT NULL`);
    await executeQuery(`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS proofFile VARCHAR(255) DEFAULT NULL`);
  } catch (err) {
    // Some MySQL versions may not support IF NOT EXISTS for ADD COLUMN, try a safe fallback
    try {
      const cols = await executeQuery(`SHOW COLUMNS FROM bookings`);
      const colNames = (cols || []).map(c => c.Field);
      if (!colNames.includes('proofType')) {
        await executeQuery(`ALTER TABLE bookings ADD COLUMN proofType VARCHAR(50) DEFAULT NULL`);
      }
      if (!colNames.includes('proofFile')) {
        await executeQuery(`ALTER TABLE bookings ADD COLUMN proofFile VARCHAR(255) DEFAULT NULL`);
      }
    } catch (innerErr) {
      console.error('Failed to ensure bookings proof columns:', innerErr && innerErr.message);
    }
  }
};

export const User = {
  create: async ({ firstName, lastName, email, hashedPassword, phone }) => {
    const uuid = uuidv4();
    const q = `INSERT INTO users (uuid, firstName, lastName, email, password, phone) VALUES (?, ?, ?, ?, ?, ?)`;
    return await executeQuery(q, [uuid, firstName, lastName, email, hashedPassword, phone]);
  },
  findByEmail: async (email) => {
    const results = await executeQuery('SELECT * FROM users WHERE email = ?', [email]);
    return results[0];
  },
  findById: async (id) => {
    const results = await executeQuery('SELECT id, uuid, firstName, lastName, email, phone, role, status, createdAt FROM users WHERE id = ?', [id]);
    if (results[0]) results[0].name = `${results[0].firstName || ''} ${results[0].lastName || ''}`.trim();
    return results[0];
  }
};

// Add helper to update last login timestamp
User.updateLastLogin = async (id) => {
  await executeQuery('UPDATE users SET lastLogin = NOW() WHERE id = ?', [id]);
};

export const Booking = {
  getById: async (id) => {
    const q = `SELECT b.*, u.firstName AS userFirstName, u.lastName AS userLastName, h.name AS hotelName, r.type AS roomType FROM bookings b JOIN users u ON b.userId = u.id JOIN hotels h ON b.hotelId = h.id JOIN rooms r ON b.roomId = r.id WHERE b.id = ?`;
    const results = await executeQuery(q, [id]);
    return results[0];
  },
  create: async (data) => {
    const uuid = uuidv4();
    const bookingNumber = 'BK' + Date.now();
    const q = `INSERT INTO bookings (uuid, bookingNumber, userId, roomId, hotelId, checkInDate, checkOutDate, numberOfGuests, numberOfRooms, numberOfNights, totalPrice, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const res = await executeQuery(q, [
      uuid,
      bookingNumber,
      data.userId || null,
      data.roomId,
      data.hotelId,
      data.checkInDate,
      data.checkOutDate,
      data.numberOfGuests || 1,
      data.numberOfRooms || 1,
      data.numberOfNights || 1,
      data.totalPrice || 0,
      data.status || 'pending'
    ]);
    return { id: res.insertId, bookingNumber };
  },
  getByUser: async (userId) => {
    return await executeQuery('SELECT * FROM bookings WHERE userId = ? ORDER BY createdAt DESC', [userId]);
  },
  updateStatus: async (bookingId, status) => {
    return await executeQuery('UPDATE bookings SET status = ?, updatedAt = NOW() WHERE id = ?', [status, bookingId]);
  },
  cancel: async (bookingId) => {
    return await executeQuery('UPDATE bookings SET status = ? WHERE id = ?', ['cancelled', bookingId]);
  }
};

export const Hotel = {
  create: async (hotelData) => {
    const uuid = uuidv4();
    const q = `INSERT INTO hotels (uuid, name, city, state, address, phone, email, description, amenities, status, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`;
    const res = await executeQuery(q, [uuid, hotelData.name, hotelData.city || '', hotelData.state || '', hotelData.address || '', hotelData.phone || null, hotelData.email || null, hotelData.description || null, JSON.stringify(hotelData.amenities || []), hotelData.status || 'active']);
    return { id: res.insertId, uuid };
  },
  getAll: async () => await executeQuery('SELECT * FROM hotels ORDER BY name'),
  getById: async (id) => {
    const results = await executeQuery('SELECT * FROM hotels WHERE id = ?', [id]);
    return results[0];
  }
};

export const Room = {
  getByHotel: async (hotelId) => {
    return await executeQuery('SELECT * FROM rooms WHERE hotelId = ?', [hotelId]);
  },
  getById: async (id) => {
    const results = await executeQuery('SELECT * FROM rooms WHERE id = ?', [id]);
    return results[0];
  },
  create: async (roomData) => {
    const q = `INSERT INTO rooms (hotelId, type, description, capacity, pricePerNight, extraAdultCharge, availability, amenities, imageUrl, gstEnabled, gstPercentage, gstType) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const res = await executeQuery(q, [
      roomData.hotelId,
      roomData.type,
      roomData.description || null,
      roomData.capacity || 2,
      roomData.pricePerNight || 0,
      roomData.extraAdultCharge || 0,
      roomData.availability || 1,
      JSON.stringify(roomData.amenities || []),
      roomData.imageUrl || null,
      roomData.gstEnabled ? 1 : 0,
      roomData.gstPercentage || 0,
      roomData.gstType || 'exclusive'
    ]);
    return { id: res.insertId };
  }
};

// Billing helpers removed — bill storage and helpers are no longer part of the models.


export const PaperType = {
  create: async (paperTypeData) => {
    const { name, description, width, height, unit = 'mm', layout = 'portrait', columns = 1, fontSize = 11, margins = '10,10,10,10', isActive = true } = paperTypeData;
    const uuid = uuidv4();
    const q = `INSERT INTO paperTypes (uuid, name, description, width, height, unit, layout, columns, fontSize, margins, isActive) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const res = await executeQuery(q, [uuid, name, description, width, height, unit, layout, columns, fontSize, margins, isActive ? 1 : 0]);
    return { id: res.insertId, uuid };
  },
  getAll: async () => await executeQuery('SELECT * FROM paperTypes WHERE isActive = TRUE ORDER BY name')
};

export const YearCard = {
  getAll: async () => await executeQuery('SELECT * FROM yearCards WHERE isActive = 1 ORDER BY year DESC'),
  update: async (id, updateData) => {
    const { title, description, imageUrl, imageBase64, order, year } = updateData;
    const query = `UPDATE yearCards SET title = ?, description = ?, imageUrl = ?, imageBase64 = ?, \`order\` = ?, year = ?, updatedAt = NOW() WHERE id = ?`;
    await executeQuery(query, [title, description, imageUrl, imageBase64, order, year, id]);
  },
  delete: async (id) => await executeQuery('UPDATE yearCards SET isActive = FALSE WHERE id = ?', [id]),
  deleteHard: async (id) => await executeQuery('DELETE FROM yearCards WHERE id = ?', [id])
};

export const GuestProfile = {
  create: async (guestData) => {
    const q = `INSERT INTO guest_profiles (uniqueId, email, name, phone) VALUES (?, ?, ?, ?)`;
    return await executeQuery(q, [guestData.uniqueId, guestData.email, guestData.name, guestData.phone]);
  },
  findByEmail: async (email) => {
    const results = await executeQuery('SELECT * FROM guest_profiles WHERE email = ?', [email]);
    return results[0];
  },
  findByUniqueId: async (uniqueId) => {
    const results = await executeQuery('SELECT * FROM guest_profiles WHERE uniqueId = ?', [uniqueId]);
    return results[0];
  },
  update: async (uniqueId, updateData) => {
    const setClauses = [];
    const values = [];
    Object.keys(updateData).forEach(key => {
      if (key !== 'uniqueId' && key !== 'email') {
        setClauses.push(`${key} = ?`);
        values.push(updateData[key]);
      }
    });
    values.push(uniqueId);
    const query = `UPDATE guest_profiles SET ${setClauses.join(', ')}, updatedAt = NOW() WHERE uniqueId = ?`;
    await executeQuery(query, values);
  }
};

export const GuestOTP = {
  create: async (otpData) => {
    const q = `INSERT INTO guest_otps (email, otp, purpose, expiresAt) VALUES (?, ?, ?, ?)`;
    return await executeQuery(q, [otpData.email, otpData.otp, otpData.purpose, otpData.expiresAt]);
  },
  // Count recent OTPs for rate limiting (within the last `minutes` minutes)
  countRecentOTPs: async (email, minutes = 5, purpose = 'booking') => {
    const q = `SELECT COUNT(*) as cnt FROM guest_otps WHERE email = ? AND purpose = ? AND createdAt >= DATE_SUB(NOW(), INTERVAL ? MINUTE)`;
    const results = await executeQuery(q, [email.toLowerCase(), purpose, minutes]);
    return results[0]?.cnt || 0;
  },
  findValidOTP: async (email, otp, purpose) => {
    const q = `SELECT * FROM guest_otps WHERE email = ? AND otp = ? AND purpose = ? AND used = FALSE AND expiresAt > NOW() ORDER BY createdAt DESC LIMIT 1`;
    const results = await executeQuery(q, [email, otp, purpose]);
    return results[0];
  },
  markAsUsed: async (id) => await executeQuery('UPDATE guest_otps SET used = TRUE WHERE id = ?', [id]),
  deleteExpired: async () => await executeQuery('DELETE FROM guest_otps WHERE expiresAt < NOW()')
};

export const GuestBookingSession = {
  create: async (sessionData) => {
    const q = `INSERT INTO guest_booking_sessions (email, sessionToken, expiresAt) VALUES (?, ?, ?)`;
    return await executeQuery(q, [sessionData.email, sessionData.sessionToken, sessionData.expiresAt]);
  },
  findValidSession: async (sessionToken) => {
    const q = `SELECT * FROM guest_booking_sessions WHERE sessionToken = ? AND used = FALSE AND expiresAt > NOW() LIMIT 1`;
    const results = await executeQuery(q, [sessionToken]);
    return results[0];
  },
  markAsUsed: async (sessionToken) => await executeQuery('UPDATE guest_booking_sessions SET used = TRUE WHERE sessionToken = ?', [sessionToken]),
  deleteExpired: async () => await executeQuery('DELETE FROM guest_booking_sessions WHERE expiresAt < NOW()')
};

// Website status helper (stores single row with id=1)
export const WebsiteStatus = {
  getStatus: async () => {
    try {
      const rows = await executeQuery('SELECT * FROM website_status WHERE id = 1');
      if (!rows || rows.length === 0) {
        // Default open status
        return { isOpen: true, maintenanceMessage: null, reopenedAt: null };
      }
      const row = rows[0];
      return {
        isOpen: !!row.isOpen,
        maintenanceMessage: row.maintenanceMessage || null,
        reopenedAt: row.reopenedAt || null,
        maintenanceMode: !!row.maintenanceMode
      };
    } catch (err) {
      console.error('WebsiteStatus.getStatus error:', err && err.message);
      return { isOpen: true, maintenanceMessage: null, reopenedAt: null };
    }
  },

  closeWebsite: async (adminId, message) => {
    // Ensure row exists
    await executeQuery(`INSERT INTO website_status (id, isOpen, maintenanceMessage, maintenanceMode, updatedBy, updatedAt) VALUES (1, 0, ?, 1, ?, NOW()) ON DUPLICATE KEY UPDATE isOpen = 0, maintenanceMessage = VALUES(maintenanceMessage), maintenanceMode = 1, updatedBy = VALUES(updatedBy), updatedAt = NOW()`, [message || 'Maintenance', adminId]);
  },

  openWebsite: async () => {
    await executeQuery(`INSERT INTO website_status (id, isOpen, maintenanceMessage, maintenanceMode, reopenedAt, updatedAt) VALUES (1, 1, NULL, 0, NOW(), NOW()) ON DUPLICATE KEY UPDATE isOpen = 1, maintenanceMessage = NULL, maintenanceMode = 0, reopenedAt = NOW(), updatedAt = NOW()`);
  }
};



