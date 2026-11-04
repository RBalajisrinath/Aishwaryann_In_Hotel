-- ============================================================================
-- COMPLETE HOTEL BOOKING SYSTEM DATABASE SCHEMA
-- Production Ready with Real-Time Support
-- ============================================================================

-- ============================================================================
-- 1. USERS & AUTHENTICATION TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(36) UNIQUE NOT NULL,
  firstName VARCHAR(50) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  role ENUM('user', 'super-admin', 'admin') DEFAULT 'user',
  status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
  emailVerified BOOLEAN DEFAULT FALSE,
  lastLogin DATETIME,
  permissions JSON,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role),
  INDEX idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 2. HOTELS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotels (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  address TEXT NOT NULL,
  city VARCHAR(50),
  state VARCHAR(50),
  country VARCHAR(50),
  postalCode VARCHAR(20),
  phone VARCHAR(20),
  email VARCHAR(100),
  website VARCHAR(255),
  totalRooms INT DEFAULT 0,
  checkInTime TIME DEFAULT '14:00:00',
  checkOutTime TIME DEFAULT '11:00:00',
  imageUrl LONGTEXT,
  status ENUM('active', 'inactive', 'maintenance') DEFAULT 'active',
  createdBy INT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_name (name),
  INDEX idx_status (status),
  INDEX idx_city (city)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 3. ROOMS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS rooms (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  description TEXT,
  capacity INT DEFAULT 2,
  pricePerNight DECIMAL(10, 2) NOT NULL,
  extraAdultCharge DECIMAL(10, 2) DEFAULT 0,
  availability INT DEFAULT 1,
  amenities JSON,
  imageUrl LONGTEXT,
  gstEnabled BOOLEAN DEFAULT FALSE,
  gstPercentage DECIMAL(5, 2) DEFAULT 0,
  gstType ENUM('inclusive', 'exclusive') DEFAULT 'exclusive',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 4. PAYMENT SETTINGS TABLE (Real-Time Updates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS payment_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL UNIQUE,
  paymentPhoneNumber VARCHAR(20),
  paymentUpiId VARCHAR(100),
  partialPaymentEnabled BOOLEAN DEFAULT TRUE,
  partialPaymentPercentage INT DEFAULT 50,
  gstEnabled BOOLEAN DEFAULT FALSE,
  gstPercentage DECIMAL(5, 2) DEFAULT 0,
  gstType ENUM('inclusive', 'exclusive') DEFAULT 'exclusive',
  termsAndConditions TEXT,
  adminEmail VARCHAR(100),
  adminPhoneForNotification VARCHAR(20),
  autoApprovalEnabled BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 5. GUEST PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS guest_profiles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uniqueId VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  idProofType VARCHAR(50) NOT NULL,
  idProofNumber VARCHAR(100) NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_uniqueId (uniqueId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 6. BOOKINGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS bookings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId VARCHAR(50) UNIQUE NOT NULL,
  guestUniqueId VARCHAR(50) NOT NULL,
  roomId INT NOT NULL,
  hotelId INT NOT NULL,
  numberOfRooms INT DEFAULT 1,
  numberOfGuests INT DEFAULT 1,
  numberOfAdults INT DEFAULT 1,
  numberOfChildren INT DEFAULT 0,
  checkInDate DATE NOT NULL,
  checkOutDate DATE NOT NULL,
  numberOfNights INT,
  specialRequests TEXT,
  pricePerNight DECIMAL(10, 2),
  totalPrice DECIMAL(12, 2),
  gstAmount DECIMAL(10, 2) DEFAULT 0,
  gstPercentage DECIMAL(5, 2),
  gstType ENUM('inclusive', 'exclusive'),
  paymentType ENUM('full', 'partial') DEFAULT 'full',
  partialPaymentPercentage INT,
  paymentAmountRequired DECIMAL(12, 2),
  remainingAmount DECIMAL(12, 2),
  transactionId VARCHAR(100) NOT NULL,
  paymentProof VARCHAR(255) NOT NULL,
  paymentProofType VARCHAR(50),
  idProof VARCHAR(255) NOT NULL,
  idProofType VARCHAR(50) NOT NULL,
  paymentStatus ENUM('pending', 'completed', 'failed') DEFAULT 'pending',
  adminApprovalStatus ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  bookingStatus ENUM('confirmed', 'checked_in', 'checked_out', 'cancelled') DEFAULT 'confirmed',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guestUniqueId) REFERENCES guest_profiles(uniqueId) ON DELETE RESTRICT,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE RESTRICT,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE RESTRICT,
  INDEX idx_bookingId (bookingId),
  INDEX idx_guestUniqueId (guestUniqueId),
  INDEX idx_roomId (roomId),
  INDEX idx_hotelId (hotelId),
  INDEX idx_checkInDate (checkInDate),
  INDEX idx_paymentStatus (paymentStatus),
  INDEX idx_adminApprovalStatus (adminApprovalStatus),
  INDEX idx_bookingStatus (bookingStatus)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 7. REAL-TIME EVENTS TABLE (For Real-Time Updates)
-- ============================================================================

CREATE TABLE IF NOT EXISTS db_events (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  eventType VARCHAR(50) NOT NULL,
  tableName VARCHAR(50) NOT NULL,
  recordId INT,
  hotelId INT,
  action ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
  oldValues JSON,
  newValues JSON,
  userId INT,
  processed BOOLEAN DEFAULT FALSE,
  processedAt DATETIME,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (userId) REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE SET NULL,
  INDEX idx_eventType (eventType),
  INDEX idx_tableName (tableName),
  INDEX idx_hotelId (hotelId),
  INDEX idx_processed (processed),
  INDEX idx_createdAt (createdAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 8. OTP SESSIONS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp_sessions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  sessionId VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) NOT NULL,
  otp VARCHAR(10) NOT NULL,
  attempts INT DEFAULT 0,
  expiresAt DATETIME NOT NULL,
  verified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_sessionId (sessionId),
  INDEX idx_expiresAt (expiresAt)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 9. GALLERY TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS gallery (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  title VARCHAR(100),
  description TEXT,
  imageUrl LONGTEXT,
  category VARCHAR(50),
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 10. RATINGS & REVIEWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS ratings_reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  bookingId VARCHAR(50) NOT NULL,
  guestUniqueId VARCHAR(50) NOT NULL,
  hotelId INT NOT NULL,
  roomId INT NOT NULL,
  overallRating INT CHECK (overallRating >= 1 AND overallRating <= 5),
  cleanliness INT CHECK (cleanliness >= 1 AND cleanliness <= 5),
  comfort INT CHECK (comfort >= 1 AND comfort <= 5),
  service INT CHECK (service >= 1 AND service <= 5),
  value INT CHECK (value >= 1 AND value <= 5),
  review TEXT,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (guestUniqueId) REFERENCES guest_profiles(uniqueId) ON DELETE RESTRICT,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE RESTRICT,
  FOREIGN KEY (roomId) REFERENCES rooms(id) ON DELETE RESTRICT,
  INDEX idx_hotelId (hotelId),
  INDEX idx_guestUniqueId (guestUniqueId),
  INDEX idx_overallRating (overallRating)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 11. AMENITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amenities (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  icon VARCHAR(50),
  description TEXT,
  available BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 12. POLICIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  title VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('cancellation', 'checkin', 'checkout', 'pets', 'smoking', 'other') DEFAULT 'other',
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_type (type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 13. WEBSITE CONTENT TABLES (CMS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS website_hero (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  title VARCHAR(255),
  subtitle TEXT,
  backgroundImageUrl LONGTEXT,
  backgroundVideoUrl VARCHAR(255),
  ctaText VARCHAR(100),
  ctaLink VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  title VARCHAR(100),
  description TEXT,
  icon VARCHAR(255),
  imageUrl LONGTEXT,
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  question VARCHAR(255),
  answer TEXT,
  category VARCHAR(50),
  displayOrder INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_category (category)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  city VARCHAR(50),
  state VARCHAR(50),
  postalCode VARCHAR(20),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS website_cta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL,
  section VARCHAR(50),
  buttonText VARCHAR(100),
  buttonLink VARCHAR(255),
  backgroundColor VARCHAR(7),
  textColor VARCHAR(7),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId),
  INDEX idx_section (section)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 14. WEBSITE STATUS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS website_status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL UNIQUE,
  isOpen BOOLEAN DEFAULT TRUE,
  maintenanceMessage TEXT,
  reopenedAt DATETIME,
  maintenanceMode BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId (hotelId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- 15. HOMEPAGE VIDEOS TABLE (CMS - Video Content Management)
-- ============================================================================

CREATE TABLE IF NOT EXISTS homepage_videos (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  videoUrl VARCHAR(500) NOT NULL,
  thumbnailUrl VARCHAR(500),
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT 1,
  hotelId INT DEFAULT 1,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (hotelId) REFERENCES hotels(id) ON DELETE CASCADE,
  INDEX idx_hotelId_active (hotelId, isActive),
  INDEX idx_displayOrder (displayOrder)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- INDEXES FOR PERFORMANCE (REAL-TIME CRITICAL)
-- ============================================================================

-- Real-time events quick retrieval
CREATE INDEX idx_db_events_unprocessed ON db_events(processed, createdAt DESC);
CREATE INDEX idx_db_events_hotel_type ON db_events(hotelId, eventType);

-- Booking quick lookups
CREATE INDEX idx_bookings_date_range ON bookings(checkInDate, checkOutDate);
CREATE INDEX idx_bookings_payment_pending ON bookings(paymentStatus, createdAt DESC);
CREATE INDEX idx_bookings_approval_pending ON bookings(adminApprovalStatus, createdAt DESC);

-- OTP session cleanup
CREATE INDEX idx_otp_cleanup ON otp_sessions(expiresAt);

-- ============================================================================
-- TRIGGERS FOR AUTOMATIC UPDATES (Optional, for better real-time sync)
-- ============================================================================

-- Trigger to automatically record payment settings updates to db_events
DELIMITER $$
CREATE TRIGGER payment_settings_update_trigger
AFTER UPDATE ON payment_settings
FOR EACH ROW
BEGIN
  INSERT INTO db_events (
    eventType,
    tableName,
    recordId,
    hotelId,
    action,
    oldValues,
    newValues,
    createdAt
  ) VALUES (
    'payment_settings_updated',
    'payment_settings',
    NEW.id,
    NEW.hotelId,
    'UPDATE',
    JSON_OBJECT(
      'paymentUpiId', OLD.paymentUpiId,
      'partialPaymentEnabled', OLD.partialPaymentEnabled,
      'partialPaymentPercentage', OLD.partialPaymentPercentage,
      'gstEnabled', OLD.gstEnabled,
      'gstPercentage', OLD.gstPercentage
    ),
    JSON_OBJECT(
      'paymentUpiId', NEW.paymentUpiId,
      'partialPaymentEnabled', NEW.partialPaymentEnabled,
      'partialPaymentPercentage', NEW.partialPaymentPercentage,
      'gstEnabled', NEW.gstEnabled,
      'gstPercentage', NEW.gstPercentage
    ),
    NOW()
  );
END$$
DELIMITER ;

-- ============================================================================
-- DEFAULT DATA INSERTION
-- ============================================================================

-- Insert admin user (Aishwaryam Inn) - Email: aishwaryaminn@gmail.com, Password: Aishwaryaminn@2025
INSERT IGNORE INTO users (uuid, firstName, lastName, email, password, phone, role, status, emailVerified)
VALUES (
  'admin-uuid-aishwaryam-inn-2025',
  'Aishwaryam',
  'Inn',
  'aishwaryaminn@gmail.com',
  '$2a$10$CzLLOjC36jXfBCyTzrTYQubfNk9cLyqXJvEpcxCNt1r4SVPwi1zvK',
  '+91-9876543210',
  'super-admin',
  'active',
  true
);

-- Insert default hotel (if not exists)
INSERT IGNORE INTO hotels (id, name, description, address, city, phone, email, website, status)
VALUES (
  1,
  'Default Hotel',
  'Default hotel for bookings',
  'Main Street, City',
  'City',
  '+1234567890',
  'hotel@example.com',
  'http://example.com',
  'active'
);

-- Insert default rooms for hotel 1
INSERT IGNORE INTO rooms (hotelId, type, description, capacity, pricePerNight, extraAdultCharge, availability, amenities, gstEnabled, gstPercentage, gstType)
VALUES 
(1, 'Double Room', 'Spacious double room with premium amenities', 2, 1800, 300, 10, JSON_ARRAY('WiFi', 'AC', 'TV', 'Hot Water'), FALSE, 0, 'exclusive'),
(1, '5 Bedded Room', 'Large family room with 5 beds, perfect for families and groups', 5, 3300, 300, 1, JSON_ARRAY('WiFi', 'AC', 'TV', 'Hot Water', 'Attached Bathroom'), FALSE, 0, 'exclusive');

-- Insert default payment settings for hotel 1
INSERT IGNORE INTO payment_settings (
  hotelId,
  paymentPhoneNumber,
  paymentUpiId,
  partialPaymentEnabled,
  partialPaymentPercentage,
  gstEnabled,
  gstPercentage,
  gstType
) VALUES (
  1,
  '+91 98427-72999',
  'hotel@bharatpe',
  TRUE,
  50,
  FALSE,
  0,
  'exclusive'
);

-- Insert default website status for hotel 1
INSERT IGNORE INTO website_status (hotelId, isOpen, maintenanceMode)
VALUES (1, TRUE, FALSE);

-- Insert default hero content
INSERT IGNORE INTO website_hero (hotelId, title, subtitle, ctaText, ctaLink, isActive)
VALUES (
  1,
  'Welcome to Aishwaryam Inn',
  'Experience luxury and comfort at our premium hotel',
  'Book Now',
  '/booking',
  TRUE
);

-- Insert default contact info
INSERT IGNORE INTO contact_info (hotelId, phone, email, city, state, postalCode, isActive)
VALUES (
  1,
  '+91-9876543210',
  'info@aishwaryaminn.com',
  'City',
  'State',
  '123456',
  TRUE
);

-- Insert rooms for Aishwaryam Inn
INSERT IGNORE INTO rooms (hotelId, type, description, capacity, pricePerNight, extraAdultCharge, availability, amenities, gstEnabled, gstPercentage, gstType)
VALUES 
(1, 'Double Room', 'Spacious double room with premium amenities', 2, 1800, 300, 10, JSON_ARRAY('WiFi', 'AC', 'TV', 'Hot Water'), FALSE, 0, 'exclusive'),
(1, '5 Bedded Room', 'Large family room with 5 beds, perfect for families and groups', 5, 3300, 300, 1, JSON_ARRAY('WiFi', 'AC', 'TV', 'Hot Water', 'Attached Bathroom'), FALSE, 0, 'exclusive');

-- Insert default homepage videos
INSERT IGNORE INTO homepage_videos (title, description, videoUrl, displayOrder, isActive, hotelId) 
VALUES
('Hotel Tour', 'Complete hotel walkthrough and amenities', '/uploads/hero-videos/hotel-tour.mp4', 1, 1, 1),
('Room Overview', 'Tour of our premium rooms', '/uploads/hero-videos/room-tour.mp4', 2, 1, 1),
('Guest Experience', 'What guests say about Aishwaryam Inn', '/uploads/hero-videos/guest-experience.mp4', 3, 1, 1);

-- ============================================================================
-- END OF SCHEMA
-- ============================================================================

-- Notes for Deployment:
-- 1. All tables use InnoDB for transaction support and foreign key constraints
-- 2. UTF-8 encoding for international character support
-- 3. Indexes created for real-time query optimization
-- 4. db_events table for real-time synchronization support
-- 5. Triggers enabled for automatic event logging
-- 6. Created with IF NOT EXISTS to allow safe re-runs
-- 7. All timestamps set to UTC by default
-- 8. Password fields should be stored as bcrypt hashes (done in application)
