-- Migration: Reset rooms to only keep Double and Five-bedded rooms
-- WARNING: This will REMOVE ALL existing rows in `rooms` and replace them with the requested configuration.
-- BACKUP your database before running this migration:
-- mysqldump -u <user> -p <db_name> > backup_before_reset_rooms.sql

-- 1) Remove all existing rooms
DELETE FROM rooms;

-- 2) Ensure enum includes 'five_bedded'
ALTER TABLE rooms
  MODIFY COLUMN type ENUM('single','double','suite','deluxe','five_bedded') NOT NULL;

-- 2b) Ensure extraAdultCharge column exists (compatible with mysql2 / client libraries)
-- Use INFORMATION_SCHEMA to decide and run a conditional ALTER via prepared statement
SET @col_exists = (
  SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'rooms' AND COLUMN_NAME = 'extraAdultCharge'
);
SET @sql = IF(@col_exists = 0,
  'ALTER TABLE rooms ADD COLUMN extraAdultCharge DECIMAL(10,2) DEFAULT 0 AFTER availableRooms',
  'SELECT 1'
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- 3) Insert Double room (one row per hotel) with totalRooms=10, price=1800, extraAdultCharge=300
INSERT INTO rooms (uuid, hotelId, type, pricePerNight, capacity, totalRooms, availableRooms, extraAdultCharge, description, amenities, status, createdAt)
SELECT UUID(), h.id, 'double', 1800, 2, 10, 10, 300, 'Double Room', '[]', 'active', NOW()
FROM hotels h;

-- 4) Insert Five-bedded room (one row per hotel) with totalRooms=1, price=3300
INSERT INTO rooms (uuid, hotelId, type, pricePerNight, capacity, totalRooms, availableRooms, extraAdultCharge, description, amenities, status, createdAt)
SELECT UUID(), h.id, 'five_bedded', 3300, 5, 1, 1, 0, '5 Bedded Room', '[]', 'active', NOW()
FROM hotels h;

-- End of migration
