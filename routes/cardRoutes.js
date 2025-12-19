import express from 'express';
import { body } from 'express-validator';
import * as cardController from '../controllers/cardController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All card routes require authentication
router.use(isAuthenticated);

// Validation rules
const cardValidation = [
  body('front')
    .trim()
    .notEmpty()
    .withMessage('Front side is required')
    .isLength({ max: 2000 })
    .withMessage('Front side cannot exceed 2000 characters'),
  body('back')
    .trim()
    .notEmpty()
    .withMessage('Back side is required')
    .isLength({ max: 2000 })
    .withMessage('Back side cannot exceed 2000 characters'),
];

// Review routes (must be before :id routes to avoid conflicts)
router.get('/review', cardController.review);
router.post('/:id/answer', cardController.answerAPI);

// CRUD routes
router.get('/', cardController.index);
router.get('/new', cardController.newForm);
router.post('/', cardValidation, cardController.create);
router.get('/:id', cardController.show);
router.get('/:id/edit', cardController.editForm);
router.put('/:id', cardValidation, cardController.update);
router.delete('/:id', cardController.destroy);

export default router;
