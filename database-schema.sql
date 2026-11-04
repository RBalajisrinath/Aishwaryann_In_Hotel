-- Hotel Booking System Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
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
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);

-- Website Content Management Tables

-- Hero Section
CREATE TABLE IF NOT EXISTS website_hero (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL DEFAULT 'Welcome to Aishwaryam Inn',
  subtitle TEXT NOT NULL DEFAULT 'Experience luxury comfort at an unbeatable price',
  primaryButtonText VARCHAR(100) DEFAULT 'Browse Rooms',
  primaryButtonLink VARCHAR(255) DEFAULT '/all-rooms',
  secondaryButtonText VARCHAR(100) DEFAULT 'My Bookings',
  secondaryButtonLink VARCHAR(255) DEFAULT '/my-bookings',
  backgroundType ENUM('slider', 'video') DEFAULT 'slider',
  backgroundVideoUrl VARCHAR(255),
  backgroundVideoEnabled BOOLEAN DEFAULT FALSE,
  backgroundVideoLoop BOOLEAN DEFAULT TRUE,
  overlayOpacity INT DEFAULT 50,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Features
CREATE TABLE IF NOT EXISTS website_features (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  icon VARCHAR(100) DEFAULT '🏨',
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_displayOrder (displayOrder)
);

-- Contact Information
CREATE TABLE IF NOT EXISTS contact_info (
  id INT AUTO_INCREMENT PRIMARY KEY,
  phone VARCHAR(20),
  email VARCHAR(100),
  address TEXT,
  googleMapsLink VARCHAR(255),
  frontDeskMonFri VARCHAR(100),
  frontDeskSat VARCHAR(100),
  frontDeskSun VARCHAR(100),
  emergencySupport VARCHAR(20),
  breakfastHours VARCHAR(100),
  lunchHours VARCHAR(100),
  dinnerHours VARCHAR(100),
  roomService VARCHAR(100),
  facebook VARCHAR(255),
  instagram VARCHAR(255),
  twitter VARCHAR(255),
  whatsapp VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- FAQs
CREATE TABLE IF NOT EXISTS website_faqs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question VARCHAR(500) NOT NULL,
  answer LONGTEXT NOT NULL,
  category VARCHAR(50) DEFAULT 'general',
  displayOrder INT DEFAULT 0,
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_category (category),
  INDEX idx_displayOrder (displayOrder)
);

-- CTA Sections
CREATE TABLE IF NOT EXISTS website_cta (
  id INT AUTO_INCREMENT PRIMARY KEY,
  section VARCHAR(100) NOT NULL UNIQUE,
  title VARCHAR(255),
  subtitle TEXT,
  buttonText VARCHAR(100),
  buttonLink VARCHAR(255),
  backgroundColor VARCHAR(50),
  isActive BOOLEAN DEFAULT TRUE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Homepage Videos (for video management)
CREATE TABLE IF NOT EXISTS homepage_videos (
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
);

-- (other table definitions go here, add as needed)

-- Example: Insert initial admin user
-- Initial admin user insertion removed as requested. Create admin users via
-- the provided `server/scripts/reset-admin-password.js` script or via your
-- preferred migration tooling to avoid embedding credentials in schema files.
