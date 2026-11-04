import rateLimit from 'express-rate-limit';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter (stricter)
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit to 5 attempts
  skip: (req) => req.method !== 'POST',
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true, // Only count failed attempts
  store: new (rateLimit.MemoryStore)(),
});

// Booking creation limiter
export const bookingLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Max 10 bookings per hour per user
  keyGenerator: (req) => req.user?.userId || req.ip,
  message: 'Too many booking attempts, please try again later',
});

// Password reset limiter
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // Max 3 attempts per hour
  message: 'Too many password reset attempts, please try again later',
});

// Email sending limiter
export const emailLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Max 5 emails per minute
  message: 'Too many emails sent, please try again later',
});

// IP-based rate limiter for API
export const ipLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: 'Too many requests from this IP',
});
