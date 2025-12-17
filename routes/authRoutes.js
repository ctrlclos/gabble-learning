import express from 'express';
import { body } from 'express-validator'
import * as authController from '../controllers/authController.js';
import {isGuest, isAuthenticated} from '../middleware/auth.js';

const router = express.Router();

// validation rules
// runs before controller function
// checks input and add errors if invalid

const registerValidation = [
  // validate name
  body('name')
  .trim() // remove whitespace
  .isLength({ min:2 }) // at least 2 characters
  .withMessage('Name must be at least two characters')
  .escape(), // convert special chars to HTML entities (XSS protection) - sanitazes input - helps with malicious scripts

  // validate email
  body('email')
  .trim()
  .isEmail()
  .withMessage('Please, provide a valid email')
  .normalizeEmail(), // Standardize email format (eg. lowercase email etc)

  // validate password
  body('password')
  .isLength({ min: 8 })
  .withMessage('Password must be at least 8 characters')
  .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)// regular expression
  .withMessage('Password must containt: at least one uppercase letter, one lowercase letter, and one number'),

  // validate password confirmation
  body('confirmPassword')
  .custom((value, {req}) => {
    if (value !== req.body.password) {
      throw new Error('Passwords do not match');
    }
    return true;
  }),
  // validate languages
  body('targetLanguage')
  .trim()
  .notEmpty()
  .withMessage('Target language is required'),

  body('nativeLanguage')
  .trim()
  .notEmpty()
  .withMessage('Native language is required')
];


// validation array
const loginValidation = [
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please, provide a valid email')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

// Guest-only routes - logged-in users get redirected.
//routes
// GET -> /auth/register -> show registration form
router.get('/register', isGuest, authController.registerForm);
// POST -> /auth/register
router.post('/register', isGuest, registerValidation, authController.register);
// GET -> /auth/login
router.get('/login', isGuest, authController.loginForm);
// POST -> /auth/login
router.post('/login', isGuest, loginValidation, authController.login);

// Authenticated-only routes
// POST -> '/auth/logout'
router.post('/logout', isAuthenticated, authController.logout);

export default router;
