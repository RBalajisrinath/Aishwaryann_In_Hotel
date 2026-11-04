-- ============================================================================
-- MIGRATION: Make ID Proof Mandatory in Bookings
-- Date: 2025-11-02
-- Description: Updates existing database to make ID proof fields mandatory
-- ============================================================================

SET FOREIGN_KEY_CHECKS = 0;

-- Add numberOfAdults and numberOfChildren columns if they don't exist
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS numberOfAdults INT DEFAULT 1 AFTER numberOfRooms,
ADD COLUMN IF NOT EXISTS numberOfChildren INT DEFAULT 0 AFTER numberOfAdults;

-- Make idProof and idProofType NOT NULL
ALTER TABLE bookings 
MODIFY COLUMN idProof VARCHAR(255) NOT NULL,
MODIFY COLUMN idProofType VARCHAR(50) NOT NULL;

-- Make transactionId NOT NULL
ALTER TABLE bookings 
MODIFY COLUMN transactionId VARCHAR(100) NOT NULL;

-- Make paymentProof NOT NULL
ALTER TABLE bookings 
MODIFY COLUMN paymentProof VARCHAR(255) NOT NULL;

-- Update guest_profiles to make idProofType and idProofNumber mandatory
ALTER TABLE guest_profiles 
MODIFY COLUMN idProofType VARCHAR(50) NOT NULL,
MODIFY COLUMN idProofNumber VARCHAR(100) NOT NULL;

-- Add address column to guest_profiles if it doesn't exist
ALTER TABLE guest_profiles 
ADD COLUMN IF NOT EXISTS address TEXT AFTER phone;

SET FOREIGN_KEY_CHECKS = 1;

-- Verification queries
SELECT 'Bookings table structure after migration:';
DESCRIBE bookings;

SELECT 'Guest profiles table structure after migration:';
DESCRIBE guest_profiles;

-- Count bookings with missing ID proof (should be 0 after validation)
SELECT COUNT(*) as bookings_without_id_proof 
FROM bookings 
WHERE idProof IS NULL OR idProofType IS NULL;
