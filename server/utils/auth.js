import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { config } from '../config/config.js';

const tokenBlacklist = new Set();

export const hashPassword = async (password) => {
  try {
    const hashedPassword = await bcrypt.hash(password, config.security.bcryptRounds);
    return hashedPassword;
  } catch (error) {
    throw new Error('Failed to hash password: ' + error.message);
  }
};

export const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('Failed to compare password: ' + error.message);
  }
};

export const generateTokens = (userId, email, role) => {
  try {
    const accessToken = jwt.sign(
      { userId, email, role },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId, email },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  } catch (error) {
    throw new Error('Failed to generate tokens: ' + error.message);
  }
};

export const verifyAccessToken = (token) => {
  try {
    if (tokenBlacklist.has(token)) {
      throw new Error('Token has been revoked');
    }
    const decoded = jwt.verify(token, config.jwt.secret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid access token: ' + error.message);
  }
};

export const verifyRefreshToken = (token) => {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret);
    return decoded;
  } catch (error) {
    throw new Error('Invalid refresh token: ' + error.message);
  }
};

export const revokeToken = (token) => {
  tokenBlacklist.add(token);
  
  // Clean up old tokens after 24 hours
  setTimeout(() => {
    tokenBlacklist.delete(token);
  }, config.security.tokenBlacklistDuration);
};

export const generateResetToken = () => {
  return jwt.sign(
    { type: 'password-reset' },
    config.jwt.secret,
    { expiresIn: '1h' }
  );
};
