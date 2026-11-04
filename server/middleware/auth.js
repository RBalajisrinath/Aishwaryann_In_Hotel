import { verifyAccessToken } from '../utils/auth.js';

export const authenticate = (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const decoded = verifyAccessToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Trim roles to handle any whitespace issues
    const userRole = req.user.role?.trim();
    const trimmedAllowedRoles = allowedRoles.map(role => role.trim());
    
    if (!trimmedAllowedRoles.includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions', userRole, allowedRoles: trimmedAllowedRoles });
    }

    next();
  };
};
