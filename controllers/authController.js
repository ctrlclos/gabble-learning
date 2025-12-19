import Learner from '../models/Learner.js';
import { validationResult } from 'express-validator';

// GET /auth/register - Show registration form
export const registerForm = (req, res) => {
  res.render('auth/register', {
    title: 'Register',
    errors: [],
    oldInput: {}
  });
};

// POST /auth/register - Handle registration
export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/register', {
        title: 'Register',
        errors: errors.array(),
        oldInput: req.body
      });
    }

    const { name, email, password, targetLanguage, nativeLanguage } = req.body;

    const existingUser = await Learner.findOne({ email });
    if (existingUser) {
      req.flash('error', 'An account with this email already exists');
      return res.redirect('/auth/register');
    }

    const learner = await Learner.create({
      name,
      email,
      password,
      targetLanguage,
      nativeLanguage
    });

    req.session.userId = learner._id;
    req.session.userRole = learner.role;

    req.flash('success', 'Welcome to Gabble Learning');
    res.redirect('/cards');
  } catch (error) {
    console.log('Registration error:', error);
    req.flash('error', 'Registration failed. Please try again.');
    res.redirect('/auth/register');
  }
};

// GET /auth/login - Show login form
export const loginForm = (req, res) => {
  res.render('auth/login', {
    title: 'Login',
    errors: [],
    oldInput: {}
  });
};

// POST /auth/login - Handle login
export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).render('auth/login', {
        title: 'Login',
        errors: errors.array(),
        oldInput: req.body
      });
    }

    const { email, password } = req.body;
    const learner = await Learner.findOne({ email }).select('+password');

    if (!learner || !(await learner.comparePassword(password))) {
      req.flash('error', 'Invalid email or password');
      return res.redirect('/auth/login');
    }

    const userId = learner._id;
    const userRole = learner.role;
    const userName = learner.name;

    req.session.regenerate((err) => {
      if (err) {
        console.error('Session regeneration error');
        req.flash('error', 'Login failed. Please try again.');
        return res.redirect('/auth/login');
      }

      req.session.userId = userId;
      req.session.userRole = userRole;

      req.flash('success', `Welcome back, ${userName}!`);

      const redirectUrl = req.session.returnTo || '/cards';
      delete req.session.returnTo;
      res.redirect(redirectUrl);
    });
  } catch (error) {
    console.error('Login error:', error);
    req.flash('error', 'Login failed. Please try again.');
    res.redirect('/auth/login');
  }
};

// POST /auth/logout - Handle logout
export const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log('Logout error:', err);
    }
    res.clearCookie('connect.sid');
    res.redirect('/');
  });
};
