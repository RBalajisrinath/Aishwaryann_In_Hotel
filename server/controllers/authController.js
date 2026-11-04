import { User, Booking } from '../models/index.js';
import { hashPassword, comparePassword, generateTokens, verifyAccessToken } from '../utils/auth.js';
import { sendRegistrationEmail, sendPasswordResetEmail } from '../utils/email.js';
import { validateUser } from '../utils/validators.js';
import { checkLoginAttempts, recordLoginAttempt, validatePassword as validatePasswordSecurity, sanitizeInput } from '../utils/security.js';
import { executeQuery } from '../config/database.js';

export const register = async (req, res) => {
  try {
    // Handle both 'name' and 'firstName/lastName' formats
    let userData = { ...req.body };
    
    // If 'name' is provided instead of firstName/lastName, split it
    if (userData.name && !userData.firstName && !userData.lastName) {
      const nameParts = userData.name.trim().split(/\s+/);
      userData.firstName = nameParts[0] || '';
      userData.lastName = nameParts.slice(1).join(' ') || nameParts[0] || '';
      delete userData.name;
    }

    const { error, value } = validateUser(userData);
    if (error) {
      return res.status(400).json({ message: error.details[0].message });
    }

    // Validate password strength
    if (!validatePasswordSecurity(value.password)) {
      return res.status(400).json({ 
        message: 'Password must contain uppercase, lowercase, number, and special character (@$!%*?&)' 
      });
    }

    // Sanitize inputs
    const firstName = sanitizeInput(value.firstName);
    const lastName = sanitizeInput(value.lastName);
    const email = sanitizeInput(value.email.toLowerCase());

    // Check if user exists
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(409).json({ message: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await hashPassword(value.password);

    // Create user
    const result = await User.create({
      firstName,
      lastName,
      email,
      hashedPassword,
      phone: sanitizeInput(value.phone),
      address: sanitizeInput(value.address || '')
    });

    // Send verification email (non-blocking - don't fail registration if email fails)
    try {
      const { accessToken } = generateTokens(result.insertId, email, 'user');
      const verificationLink = `http://localhost:3000/verify-email?token=${accessToken}`;
      await sendRegistrationEmail(email, firstName, verificationLink);
    } catch (emailError) {
      console.error('Error sending registration email:', emailError.message);
      // Continue with registration even if email fails
    }

    res.status(201).json({
      message: 'Registration successful! You can now login.',
      userId: result.insertId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.connection.remoteAddress;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password required' });
    }

    // Check login attempts
    const attempt = await checkLoginAttempts(email, ip);
    if (!attempt.allowed) {
      return res.status(429).json({ 
        message: `Too many login attempts. Try again at ${attempt.lockedUntil}` 
      });
    }

    // Find user
    const user = await User.findByEmail(email.toLowerCase());
    if (!user) {
      await recordLoginAttempt(email, ip, false);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      await recordLoginAttempt(email, ip, false);
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Check user status
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Account suspended' });
    }

    // Record successful login
    await recordLoginAttempt(email, ip, true);
    await User.updateLastLogin(user.id);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user.id, user.email, user.role);

    res.json({
      message: 'Login successful',
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const logout = (req, res) => {
  try {
    // Token is blacklisted in middleware
    res.json({ message: 'Logout successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    console.log('Getting profile for user:', req.user.userId);
    const user = await User.findById(req.user.userId);
    console.log('User found:', user);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Error getting profile:', error);
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { firstName, lastName, phone } = req.body;
    const query = 'UPDATE users SET firstName = ?, lastName = ?, phone = ? WHERE id = ?';
    
    await executeQuery(query, [firstName, lastName, phone, req.user.userId]);

    const user = await User.findById(req.user.userId);
    res.json({ message: 'Profile updated', user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists for security
      return res.json({ message: 'If email exists, reset link will be sent' });
    }

    const resetToken = generateTokens(user.id, email, user.role).accessToken;
    const resetLink = `http://localhost:3000/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(email, resetLink);

    res.json({ message: 'Password reset email sent' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    const decoded = verifyAccessToken(token);
    const hashedPassword = await hashPassword(newPassword);

    const query = 'UPDATE users SET password = ? WHERE id = ?';
    await executeQuery(query, [hashedPassword, decoded.userId]);

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
