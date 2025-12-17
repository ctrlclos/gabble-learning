import express from 'express';

const router = express.Router();

import { body } from 'express-validator';

import * as flashcardController from '../controllers/flashcardController.js';

import { isAuthenticated } from '../middleware/auth.js';

router.use(isAuthenticated);

const flashcardValidation = [
  body('front')
  .trim()
  .notEmpty()
  .withMessage('Question (front) is required'),

  body('back')
  .trim()
  .notEmpty()
  .withMessage('Answer (back) is required')
]

router.get('/', flashcardController.index);
router.get('/new', flashcardController.newForm);
router.post('/', flashcardValidation, flashcardController.create);

export default router;
