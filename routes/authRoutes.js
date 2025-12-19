import express from 'express';
import { body } from 'express-validator'
import * as authController from '../controllers/authController.js';
import { isGuest, isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Registration validation
const registerValidation = [
  body('name')
    .trim()
    .isLength({ min: 2 })
    .withMessage('Name must be at least two characters')
    .escape(),
  body('email')
    .trim()
    .isEmail()
    .withMessage('Please, provide a valid email')
    .normalizeEmail(),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain: uppercase, lowercase, and number'),
  body('confirmPassword')
    .custom((value, { req }) => {
      if (value !== req.body.password) {
        throw new Error('Passwords do not match');
      }
      return true;
    }),
  body('targetLanguage')
    .trim()
    .notEmpty()
    .withMessage('Target language is required'),
  body('nativeLanguage')
    .trim()
    .notEmpty()
    .withMessage('Native language is required')
];

// Login validation
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

// Guest-only routes
router.get('/register', isGuest, authController.registerForm);
router.post('/register', isGuest, registerValidation, authController.register);
router.get('/login', isGuest, authController.loginForm);
router.post('/login', isGuest, loginValidation, authController.login);

// Authenticated-only routes
router.post('/logout', isAuthenticated, authController.logout);

export default router;
