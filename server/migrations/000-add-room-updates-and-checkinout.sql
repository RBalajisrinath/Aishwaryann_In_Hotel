-- Migration: add extraAdultCharge column, add five_bedded enum, update double rooms and insert a five_bedded room, and add hotel check-in/out defaults
-- BACKUP: make a dump of your database before running this migration
-- Example: mysqldump -u root -p your_db_name > backup.sql

-- 1) Add extraAdultCharge column if not exists
ALTER TABLE rooms
  ADD COLUMN IF NOT EXISTS extraAdultCharge DECIMAL(10,2) DEFAULT 0 AFTER availableRooms;

-- 2) Modify rooms.type enum to include 'five_bedded'
ALTER TABLE rooms
  MODIFY COLUMN type ENUM('single','double','suite','deluxe','five_bedded') NOT NULL;

-- 3) Update all existing double room records to requested values
UPDATE rooms
SET totalRooms = 10,
    availableRooms = LEAST(10, availableRooms),
    pricePerNight = 1800,
    extraAdultCharge = 300
WHERE type = 'double';

-- 4) Insert a 5 Bedded room if one doesn't exist (attach to the first hotel found)
INSERT INTO rooms (uuid, hotelId, type, pricePerNight, capacity, totalRooms, availableRooms, extraAdultCharge, description, amenities, status, createdAt)
SELECT UUID(), (SELECT id FROM hotels LIMIT 1), 'five_bedded', 3300, 5, 1, 1, 0, '5 Bedded Room', '[]', 'active', NOW()
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM rooms WHERE type = 'five_bedded');

-- 5) Add check-in/check-out columns to hotels (if not present)
ALTER TABLE hotels
  ADD COLUMN IF NOT EXISTS checkInTime TIME DEFAULT '14:00:00',
  ADD COLUMN IF NOT EXISTS checkOutTime TIME DEFAULT '10:00:00';

-- 6) Optionally update existing hotels to the new default times
UPDATE hotels SET checkInTime = '14:00:00', checkOutTime = '10:00:00' WHERE checkInTime IS NULL OR checkOutTime IS NULL;

-- End of migration
