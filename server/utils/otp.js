import crypto from 'crypto';

/**
 * Generate a 6-digit OTP
 */
export const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * Generate a unique guest ID
 * Format: HB + 10 random alphanumeric characters
 * Example: HB5K9M2X7P4Q
 */
export const generateUniqueGuestId = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding similar characters (I, O, 0, 1)
  let uniqueId = 'HB';
  
  for (let i = 0; i < 10; i++) {
    uniqueId += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return uniqueId;
};

/**
 * Generate a session token for verified OTP
 */
export const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

/**
 * Calculate OTP expiry time (5 minutes from now)
 */
export const getOTPExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setMinutes(expiryTime.getMinutes() + 5);
  return expiryTime;
};

/**
 * Calculate session expiry time (1 hour from now)
 */
export const getSessionExpiryTime = () => {
  const expiryTime = new Date();
  expiryTime.setHours(expiryTime.getHours() + 1);
  return expiryTime;
};

/**
 * Check if OTP is expired
 */
export const isOTPExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Check if session is expired
 */
export const isSessionExpired = (expiresAt) => {
  return new Date() > new Date(expiresAt);
};

/**
 * Format unique ID for display
 * Adds dashes for readability: HB-5K9M-2X7P-4Q
 */
export const formatUniqueId = (uniqueId) => {
  if (!uniqueId || uniqueId.length !== 12) return uniqueId;
  return `${uniqueId.slice(0, 2)}-${uniqueId.slice(2, 6)}-${uniqueId.slice(6, 10)}-${uniqueId.slice(10)}`;
};

/**
 * Remove dashes from formatted unique ID
 */
export const unformatUniqueId = (formattedId) => {
  return formattedId.replace(/-/g, '');
};

/**
 * Validate email format
 */
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validate OTP format (6 digits)
 */
export const isValidOTP = (otp) => {
  return /^\d{6}$/.test(otp);
};

/**
 * Validate unique ID format (HB + 10 alphanumeric)
 */
export const isValidUniqueId = (uniqueId) => {
  return /^HB[A-Z0-9]{10}$/i.test(uniqueId);
};
