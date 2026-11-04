import { executeQuery } from '../config/database.js';
import { config } from '../config/config.js';

const loginAttempts = new Map();

export const checkLoginAttempts = async (email, ip) => {
  const key = `${email}:${ip}`;
  const attempts = loginAttempts.get(key) || { count: 0, lastAttempt: 0 };

  // Reset if more than lockout time has passed
  if (Date.now() - attempts.lastAttempt > config.security.lockoutTime) {
    loginAttempts.delete(key);
    return { allowed: true, attempts: 0 };
  }

  if (attempts.count >= config.security.maxLoginAttempts) {
    return { 
      allowed: false, 
      attempts: attempts.count,
      lockedUntil: new Date(attempts.lastAttempt + config.security.lockoutTime)
    };
  }

  return { allowed: true, attempts: attempts.count };
};

export const recordLoginAttempt = async (email, ip, success) => {
  const key = `${email}:${ip}`;
  
  if (success) {
    loginAttempts.delete(key);
  } else {
    const attempts = loginAttempts.get(key) || { count: 0 };
    attempts.count += 1;
    attempts.lastAttempt = Date.now();
    loginAttempts.set(key, attempts);
  }

  // Log to database for audit trail
  try {
    await executeQuery(
      'INSERT INTO loginAttempts (email, success, ipAddress) VALUES (?, ?, ?)',
      [email, success, ip]
    );
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
};

export const validatePassword = (password) => {
  // Must contain: uppercase, lowercase, number, special character, min 8 chars
  const regex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  return regex.test(password);
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .slice(0, 255); // Limit length
};
