import Learner from '../models/Learner.js';
import { validationResult } from 'express-validator';

// registration form
export const registerForm = (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    errors: [], //initial state - no errors
    oldInput: {} //initial state - no input to restore
  });
};

// handle registration form submission
export const register = async (req, res) => {
  try {
  // check for validation errors
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      // validation failed
      return res.status(400).render('auth/register', {
        title: 'Register',
        errors: errors.array(), // error messages
        oldInput: req.body // preserve info user typed
      });
    }
    // extract data from the form
    const {name, email, password, targetLanguage, nativeLanguage} = req.body
    // check if email is already registered
    const existingUser = await Learner.findOne({ email });
    if(existingUser) {
      req.flash('error', 'An account with this email already exists');
      return res.redirect('/auth/register');
    }
    // create the new user
    const learner = await Learner.create({
      name,
      email,
      password, //plain text here but saved as hash
      targetLanguage,
      nativeLanguage
      // role defaults to learner -> schema
    });
    // automatically log user after registration
    req.session.userId = learner._id;
    req.session.userRole= learner.role;
    // show success message and reditect
    req.flash('success', 'Welcome to Gabble Learning');
    res.redirect('/vocabularies');
  } catch (error) {
    console.log('Registration error:', error);
    req.flash('error','Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
};

// display the login form
// GET -> /auth/login

export const loginForm = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    errors: [],
    oldInput: {}
  });
};

// handle login form submission
// POST -> /auth/login
export const login = async (req, res) => {
  try {
    // check validation
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        errors: errors.array(),
        oldInput: req.body
      });
    }
    const { email, password } = req.body;
    //find the user
    // needs select('+password'); password has select: false by default
    const learner = await Learner.findOne({email}).select('+password');

    // does user exist and password is correct
    // generic message -> not reveal which part failed
    if(!learner || !(await learner.comparePassword(password))) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }
    // security measure - regenerate session
    // prevents session fixation attacks
    const userId = learner._id;
    const userRole = learner.role;
    const userName = learner.name;

    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error');
        req.flash('error', 'Login failed. Please try again.');
        return res.redirect('/auth/login');
      }
      // store user info in new session
      req.session.userId = userId;
      req.session.userRole = userRole;

      // success
      req.flash('success', `Welcome back, ${userName}!`);

      // redirect to where the user was trying to go, or default page.
      const redirectUrl = req.session.returnTo || '/vocabularies';
      delete req.session.returnTo; //clean up
      res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
};

// handle log out
export const logout = (req, res) => {
  // destroy the session
  req.session.destroy((err) => {
    if(err) {
      console.log('Logout error:', err);
    }
    // clear the cookie from the browser
    res.clearCookie('connect.sid');
    res.redirect('/')
  })
}
