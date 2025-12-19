import express from 'express';
import { body } from 'express-validator';
import * as learnerController from '../controllers/learnerController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All profile routes require authentication
router.use(isAuthenticated);

// Profile validation
const profileValidation = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2 }).withMessage('Name must be at least 2 characters'),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please enter a valid email'),
  body('targetLanguage')
    .trim()
    .notEmpty().withMessage('Target language is required'),
  body('nativeLanguage')
    .trim()
    .notEmpty().withMessage('Native language is required')
];

// Password validation
const passwordValidation = [
  body('currentPassword')
    .notEmpty().withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 8 }).withMessage('New password must be at least 8 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain uppercase, lowercase, and a number'),
  body('confirmNewPassword')
    .custom((value, { req }) => value === req.body.newPassword)
    .withMessage('Passwords do not match')
];

// GET /profile - Show edit form
router.get('/', learnerController.editProfile);

// PUT /profile - Update profile
router.put('/', profileValidation, learnerController.updateProfile);

// PUT /profile/password - Update password
router.put('/password', passwordValidation, learnerController.updatePassword);

export default router;
