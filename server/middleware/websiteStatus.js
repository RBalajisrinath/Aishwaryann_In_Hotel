import { WebsiteStatus } from '../models/index.js';

/**
 * Middleware to check if website is open
 * Admins can access even if closed, users cannot
 */
export const checkWebsiteStatus = async (req, res, next) => {
  try {
    const status = await WebsiteStatus.getStatus();

    // If website is open, proceed normally
    if (status.isOpen) {
      return next();
    }

    // If website is closed, only allow super-admins
    if (req.user && req.user.role === 'super-admin') {
      return next();
    }

    // For non-admins when website is closed, return maintenance message
    return res.status(503).json({
      message: 'Website is currently under maintenance',
      maintenanceMessage: status.maintenanceMessage || 'We are performing scheduled maintenance. Please try again later.',
      reopenedAt: status.reopenedAt,
      isOpen: false
    });
  } catch (error) {
    console.error('Website status check error:', error);
    next(); // Continue even if check fails
  }
};

/**
 * Get current website status (public endpoint)
 */
export const getWebsiteStatus = async (req, res) => {
  try {
    const status = await WebsiteStatus.getStatus();
    res.json({
      isOpen: status.isOpen,
      maintenanceMessage: status.isOpen ? null : status.maintenanceMessage
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
