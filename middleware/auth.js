// Auth middleware - protects routes based on login status
import Learner from '../models/Learner.js';

// Require user to be logged in
export const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }

  req.session.returnTo = req.originalUrl;
  req.flash('error', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Require user to NOT be logged in (for login/register pages)
export const isGuest = (req, res, next) => {
  if (req.session && req.session.userId) {
    req.flash('info', 'You are already logged in.');
    return res.redirect('/cards');
  }
  next();
};

// Require admin role
export const isAdmin = (req, res, next) => {
  if (!req.session || !req.session.userId) {
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }

  if (req.session.userRole === 'admin') {
    return next();
  }

  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/');
};

// Load current user for all requests (makes currentUser available in views)
export const loadUser = async (req, res, next) => {
  res.locals.currentUser = null;
  res.locals.isAuthenticated = false;

  if (req.session && req.session.userId) {
    try {
      const user = await Learner.findById(req.session.userId);
      if (user) {
        res.locals.currentUser = user;
        res.locals.isAuthenticated = true;
      }
    } catch (error) {
      console.log('Error loading user:', error);
    }
  }
  next();
};
