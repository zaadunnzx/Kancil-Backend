const passport = require('passport');
const jwt = require('jsonwebtoken');
const { User } = require('../models');

// Import passport configuration
require('../config/passport');

// JWT Authentication middleware
const authenticate = (req, res, next) => {
  passport.authenticate('jwt', { session: false }, (err, user, info) => {
    if (err) {
      console.error('Auth error:', err);
      return res.status(500).json({ error: 'Authentication error' });
    }
    
    if (!user) {
      console.log('No user found, info:', info);
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    req.user = user;
    next();
  })(req, res, next);
};

// Role-based authorization middleware
const authorize = (roles = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    // Convert single role to array
    if (typeof roles === 'string') {
      roles = [roles];
    }

    // Check if user role is authorized
    if (roles.length && !roles.includes(req.user.role)) {
      return res.status(403).json({ 
        error: `Access denied. Required roles: ${roles.join(', ')}` 
      });
    }

    next();
  };
};

// Teacher only middleware
const teacherOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'teacher') {
    return res.status(403).json({ error: 'Teacher access required' });
  }
  next();
};

// Student only middleware  
const studentOnly = (req, res, next) => {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ error: 'Student access required' });
  }
  next();
};

module.exports = {
  authenticate,
  authorize,
  teacherOnly,
  studentOnly
};