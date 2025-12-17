//protecting routes.
// will check if users are logged in before letting them access some pages.
import Learner from '../models/Learner.js';

// middleware: Require user to be logged in.
// Will use this to protect routes that need authentication.
export const isAuthenticated = (req, res, next) => {
  //First, we need to check if there is a user ID in the session.
  if(req.session && req.session.userId) {
    // That means the user is logged in, so we let them through.
    return next();
  }

  //Now, in case the user is not logged in, then we save where they were trying to go so we can redirect them after they log in.
  req.session.returnTo = req.originalUrl;

  // We show an error message and redirect them to the login page.
  req.flash('error', 'Please log in to access this page');
  res.redirect('/auth/login');
};

// Middleware: this requires a user to be a guest,
// meaning not logged in,
// to access these pages so that we prevent users that are logged in from accessing,
//  for example, the login and register pages, because they are already logged in.
export const isGuest = (req, res, next) => {
  //Check if the user is logged in.
  if(req.session && req.session.userId) {
    // If the user is logged in, then we redirect them away from the login or register page.
    req.flash('info', 'You are already logged in.');
    return res.redirect('/vocabularies');
  }
  // If the user is not logged in,
  // We let them access the login/register pages.
  next();
};

/**
 * Middleware:
 * Ensures that the user trying to access
 * an admin page is an actual admin.
 */

export const isAdmin = (req, res, next) => {
  // First check if the user is logged.
  if(!req.session || !req.session.userId){
    req.flash('error', 'Please log in to access this page');
    return res.redirect('/auth/login');
  }
  // If the user is logged in,
  // then we check if they are an admin.
  if(req.session.userRole === 'admin') {
    // Logged in user is an admin,
    // we let them through.
    return next();
  }
  // In case the user is not an admin,
  // we deny access.
  req.flash('error', 'Access denied. Admin privileges required.');
  res.redirect('/');
}

// middleware: load the current user
// and make it available to all views.
// This will run on every request.

export const loadUser = async (req, res, next) => {
  // Set default values
  res.locals.currentUser = null;
  res.locals.isAuthenticated = false;

  // Check if the user is logged in.
  if(req.session && req.session.userId) {
    try {
    // User is logged in,
    // fetch them from the database.
    const user = await Learner.findById(req.session.userId);

    if(user) {
      // Make the current logged-in user
      // available in all EJS templates
      // as currentUser.
      res.locals.currentUser = user;
      res.locals.isAuthenticated = true;
    }
      } catch (error) {
        console.log('Error loading user:', error);
      }
  }
  next();
};
