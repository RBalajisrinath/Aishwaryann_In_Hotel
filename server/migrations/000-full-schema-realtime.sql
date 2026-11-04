-- Full schema and realtime triggers
-- WARNING: This file will DROP existing tables listed below and recreate them empty.
-- BACKUP your database before running this script:
-- mysqldump -u <user> -p <db_name> > backup_before_full_schema.sql

SET FOREIGN_KEY_CHECKS = 0;

-- Drop existing tables if present (order matters because of FKs)
DROP TABLE IF EXISTS realtime_events;
DROP TABLE IF EXISTS admin_actions;
DROP TABLE IF EXISTS payment_settings;
DROP TABLE IF EXISTS website_status;
DROP TABLE IF EXISTS bookings;
DROP TABLE IF EXISTS rooms;
DROP TABLE IF EXISTS hotels;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS paperTypes;
DROP TABLE IF EXISTS yearCards;
DROP TABLE IF EXISTS guest_profiles;
DROP TABLE IF EXISTS guest_otps;
DROP TABLE IF EXISTS guest_booking_sessions;
DROP TABLE IF EXISTS amenities;
DROP TABLE IF EXISTS reviews;

-- Create users
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('user','super-admin') DEFAULT 'user',
  status ENUM('active','inactive','suspended') DEFAULT 'active',
  emailVerified BOOLEAN DEFAULT FALSE,
  lastLogin DATETIME,
  permissions JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create hotels
CREATE TABLE hotels (
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
  status ENUM('active','inactive') DEFAULT 'active',
  checkInTime TIME DEFAULT '14:00:00',
  checkOutTime TIME DEFAULT '10:00:00',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create rooms
CREATE TABLE rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  hotelId INT NOT NULL,
  type ENUM('single','double','suite','deluxe','five_bedded') NOT NULL,
  pricePerNight DECIMAL(10,2) NOT NULL,
  capacity INT NOT NULL,
  totalRooms INT NOT NULL,
  availableRooms INT NOT NULL,
  extraAdultCharge DECIMAL(10,2) DEFAULT 0,
  size VARCHAR(50),
  description TEXT,
  amenities JSON,
  imageUrl VARCHAR(1000),
  roomNumber VARCHAR(50),
  gstEnabled BOOLEAN DEFAULT FALSE,
  gstPercentage DECIMAL(5,2) DEFAULT 0,
  gstType ENUM('inclusive','exclusive') DEFAULT 'exclusive',
  status ENUM('active','inactive') DEFAULT 'active',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Create bookings
CREATE TABLE bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  bookingNumber VARCHAR(50) UNIQUE,
  confirmationNumber VARCHAR(50),
  bookingId VARCHAR(50) UNIQUE NOT NULL,
  guestUniqueId VARCHAR(36),
  userId INT,
  roomId INT NOT NULL,
  hotelId INT NOT NULL,
  checkInDate DATE NOT NULL,
  checkOutDate DATE NOT NULL,
  numberOfGuests INT NOT NULL,
  numberOfAdults INT DEFAULT 1,
  numberOfChildren INT DEFAULT 0,
  numberOfRooms INT DEFAULT 1,
  numberOfNights INT DEFAULT 1,
  specialRequests TEXT,
  pricePerNight DECIMAL(10,2),
  totalPrice DECIMAL(12,2) NOT NULL,
  gstAmount DECIMAL(10,2) DEFAULT 0,
  gstPercentage DECIMAL(5,2),
  gstType ENUM('inclusive','exclusive'),
  paymentType ENUM('full','partial') DEFAULT 'full',
  partialPaymentPercentage INT,
  paymentAmountRequired DECIMAL(12,2),
  remainingAmount DECIMAL(12,2),
  paymentStatus ENUM('pending','completed','failed') DEFAULT 'pending',
  adminApprovalStatus ENUM('pending','approved','rejected') DEFAULT 'pending',
  bookingStatus ENUM('confirmed','checked_in','checked_out','cancelled') DEFAULT 'confirmed',
  paymentProof VARCHAR(255) NOT NULL,
  paymentProofType VARCHAR(50),
  transactionId VARCHAR(100) NOT NULL,
  idProof VARCHAR(255) NOT NULL,
  idProofType VARCHAR(50) NOT NULL,
  amountPaid DECIMAL(10,2) DEFAULT 0,
  status ENUM('pending','confirmed','checked_in','completed','cancelled') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE CASCADE,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Payment settings
CREATE TABLE payment_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  paymentPhoneNumber VARCHAR(50),
  paymentUpiId VARCHAR(100),
  partialPaymentEnabled BOOLEAN DEFAULT FALSE,
  partialPaymentPercentage INT DEFAULT 0,
  gstEnabled BOOLEAN DEFAULT FALSE,
  gstPercentage DECIMAL(5,2) DEFAULT 0,
  gstType ENUM('inclusive','exclusive') DEFAULT 'exclusive',
  termsAndConditions TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Amenities
CREATE TABLE amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(100) NOT NULL,
  icon VARCHAR(255),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- website_status
CREATE TABLE website_status (
  id INT PRIMARY KEY DEFAULT 1,
  isOpen BOOLEAN DEFAULT TRUE,
  maintenanceMessage TEXT,
  maintenanceMode BOOLEAN DEFAULT FALSE,
  updatedBy INT,
  reopenedAt DATETIME,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- admin_actions
CREATE TABLE admin_actions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  adminId INT,
  actionType VARCHAR(100),
  bookingId INT,
  details JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- paperTypes
CREATE TABLE paperTypes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  name VARCHAR(50) NOT NULL,
  description VARCHAR(200),
  width DECIMAL(8,2),
  height DECIMAL(8,2),
  unit VARCHAR(10) DEFAULT 'mm',
  layout ENUM('portrait','landscape') DEFAULT 'portrait',
  columns INT DEFAULT 1,
  fontSize INT DEFAULT 11,
  margins VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- yearCards
CREATE TABLE yearCards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  year INT NOT NULL,
  title VARCHAR(200),
  description TEXT,
  imageUrl VARCHAR(500),
  imageBase64 LONGTEXT,
  `order` INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  uploadedBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (uploadedBy) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- guest profiles and related
CREATE TABLE guest_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uniqueId VARCHAR(36) UNIQUE NOT NULL,
  email VARCHAR(100),
  name VARCHAR(200),
  phone VARCHAR(30),
  address TEXT,
  idProofType VARCHAR(50) NOT NULL,
  idProofNumber VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guest_otps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100),
  otp VARCHAR(10),
  purpose VARCHAR(50),
  used BOOLEAN DEFAULT FALSE,
  expiresAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE guest_booking_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100),
  sessionToken VARCHAR(255),
  expiresAt DATETIME,
  used BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- reviews (optional)
CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT,
  hotelId INT,
  rating INT,
  comment TEXT,
  approved BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- realtime_events table (for DB-driven events)
CREATE TABLE realtime_events (
  id INT AUTO_INCREMENT PRIMARY KEY,
  tableName VARCHAR(100) NOT NULL,
  eventType ENUM('INSERT','UPDATE','DELETE') NOT NULL,
  recordId INT NULL,
  recordUuid VARCHAR(36) NULL,
  payload JSON NULL,
  processed BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- TRIGGERS: rooms
DELIMITER $$
CREATE TRIGGER rooms_after_insert AFTER INSERT ON rooms
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'rooms', 'INSERT', NEW.id, NEW.uuid, JSON_OBJECT('id', NEW.id, 'uuid', NEW.uuid, 'type', NEW.type, 'hotelId', NEW.hotelId)
  );
END$$

CREATE TRIGGER rooms_after_update AFTER UPDATE ON rooms
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'rooms', 'UPDATE', NEW.id, NEW.uuid, JSON_OBJECT('id', NEW.id, 'uuid', NEW.uuid, 'type', NEW.type, 'hotelId', NEW.hotelId)
  );
END$$

CREATE TRIGGER rooms_after_delete AFTER DELETE ON rooms
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'rooms', 'DELETE', OLD.id, OLD.uuid, JSON_OBJECT('id', OLD.id, 'uuid', OLD.uuid, 'type', OLD.type, 'hotelId', OLD.hotelId)
  );
END$$
DELIMITER ;

-- TRIGGERS: bookings
DELIMITER $$
CREATE TRIGGER bookings_after_insert AFTER INSERT ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'bookings', 'INSERT', NEW.id, NEW.uuid, JSON_OBJECT('id', NEW.id, 'uuid', NEW.uuid, 'bookingNumber', NEW.bookingNumber, 'status', NEW.status)
  );
END$$

CREATE TRIGGER bookings_after_update AFTER UPDATE ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'bookings', 'UPDATE', NEW.id, NEW.uuid, JSON_OBJECT('id', NEW.id, 'uuid', NEW.uuid, 'bookingNumber', NEW.bookingNumber, 'status', NEW.status)
  );
END$$

CREATE TRIGGER bookings_after_delete AFTER DELETE ON bookings
FOR EACH ROW
BEGIN
  INSERT INTO realtime_events (tableName, eventType, recordId, recordUuid, payload) VALUES (
    'bookings', 'DELETE', OLD.id, OLD.uuid, JSON_OBJECT('id', OLD.id, 'uuid', OLD.uuid, 'bookingNumber', OLD.bookingNumber, 'status', OLD.status)
  );
END$$
DELIMITER ;

-- Reset auto-increment counters to start from 1 (tables are empty after DROP/CREATE)
ALTER TABLE users AUTO_INCREMENT = 1;
ALTER TABLE hotels AUTO_INCREMENT = 1;
ALTER TABLE rooms AUTO_INCREMENT = 1;
ALTER TABLE bookings AUTO_INCREMENT = 1;
ALTER TABLE paperTypes AUTO_INCREMENT = 1;
ALTER TABLE yearCards AUTO_INCREMENT = 1;
ALTER TABLE guest_profiles AUTO_INCREMENT = 1;
ALTER TABLE guest_otps AUTO_INCREMENT = 1;
ALTER TABLE guest_booking_sessions AUTO_INCREMENT = 1;
ALTER TABLE amenities AUTO_INCREMENT = 1;
ALTER TABLE reviews AUTO_INCREMENT = 1;
ALTER TABLE realtime_events AUTO_INCREMENT = 1;
ALTER TABLE admin_actions AUTO_INCREMENT = 1;
ALTER TABLE payment_settings AUTO_INCREMENT = 1;

SET FOREIGN_KEY_CHECKS = 1;

-- End of full schema + realtime triggers
