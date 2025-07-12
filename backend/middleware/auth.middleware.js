const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const protect = async (req, res, next) => {
  let token;

  // Check for token in Authorization header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      // Get token from header
      token = req.headers.authorization.split(' ')[1];

      // Verify token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Get user from the token
      req.user = await User.findById(decoded.id).select('-password -refreshToken');

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'User not found',
          errors: { general: 'Token is valid but user no longer exists' }
        });
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'User account is deactivated',
          errors: { general: 'Your account has been deactivated' }
        });
      }

      next();
    } catch (error) {
      console.error('Token verification error:', error);
      
      let message = 'Not authorized';
      if (error.name === 'TokenExpiredError') {
        message = 'Token expired';
      } else if (error.name === 'JsonWebTokenError') {
        message = 'Invalid token';
      }

      return res.status(401).json({
        success: false,
        message,
        errors: { general: 'Please login again' }
      });
    }
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token',
      errors: { general: 'Access token is required' }
    });
  }
};

// Role-based authorization
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
        errors: { general: `User role ${req.user.role} is not authorized to access this route` }
      });
    }
    next();
  };
};

// Optional auth - doesn't require token but adds user if present
const optionalAuth = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    try {
      token = req.headers.authorization.split(' ')[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = await User.findById(decoded.id).select('-password -refreshToken');
    } catch (error) {
      // Token invalid or expired, but continue without user
      req.user = null;
    }
  }

  next();
};

// Platform-specific middleware
const requireWeb = (req, res, next) => {
  if (req.user.role !== 'admin' || req.user.deviceType !== 'web') {
    return res.status(403).json({
      success: false,
      message: 'Web access required',
      errors: { general: 'This feature is only available for admin via web dashboard' }
    });
  }
  next();
};

const requireAndroid = (req, res, next) => {
  if (req.user.role !== 'student' || req.user.deviceType !== 'android') {
    return res.status(403).json({
      success: false,
      message: 'Mobile access required',
      errors: { general: 'This feature is only available for students via mobile app' }
    });
  }
  next();
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireWeb,
  requireAndroid
};
