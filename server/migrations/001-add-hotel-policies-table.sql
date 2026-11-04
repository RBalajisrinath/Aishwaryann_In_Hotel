-- Migration: Create hotel_policies table
-- This table stores check-in/check-out times and policies for regular and holiday/festival days

CREATE TABLE IF NOT EXISTS hotel_policies (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hotelId INT NOT NULL DEFAULT 1,
  policyType ENUM('regular', 'holiday') NOT NULL DEFAULT 'regular',
  checkInTime VARCHAR(50) NOT NULL DEFAULT '12:00 PM',
  checkOutTime VARCHAR(50) NOT NULL DEFAULT '11:00 AM',
  idRequirement TEXT,
  voucherRequirement TEXT,
  earlyCheckIn TEXT,
  cancellationPolicy TEXT,
  additionalInfo TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_hotel_policy (hotelId, policyType),
  INDEX idx_hotelId (hotelId),
  INDEX idx_policyType (policyType)
);

-- Insert default policies if they don't exist
INSERT IGNORE INTO hotel_policies 
(hotelId, policyType, checkInTime, checkOutTime, idRequirement, voucherRequirement, earlyCheckIn, cancellationPolicy)
VALUES
(1, 'regular', '12:00 PM', '11:00 AM', 
 'Valid government-issued photo ID required at check-in',
 'Present this voucher at the time of check-in',
 'Early check-in subject to availability. Complimentary upgrade may be offered based on occupancy',
 'Free cancellation up to 7 days before check-in. 25% charge for cancellations 7-3 days before. 50% charge for cancellations 3-1 days before. 100% charge for cancellations within 24 hours or no-show'),
(1, 'holiday', '12:00 PM', '11:00 AM',
 'Valid government-issued photo ID required at check-in',
 'Present this voucher at the time of check-in',
 'Early check-in subject to availability',
 'Non-refundable. No cancellations permitted for holiday/festival bookings');
