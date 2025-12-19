import express from 'express';
import { body } from 'express-validator';
import * as deckController from '../controllers/deckController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// All deck routes require authentication
router.use(isAuthenticated);

// Validation rules for deck creation/update
const deckValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Deck name is required')
    .isLength({ max: 100 })
    .withMessage('Deck name cannot exceed 100 characters'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
];

// Routes
router.get('/', deckController.index);
router.get('/new', deckController.newForm);
router.post('/', deckValidation, deckController.create);
router.get('/:id', deckController.show);
router.get('/:id/edit', deckController.editForm);
router.put('/:id', deckValidation, deckController.update);
router.delete('/:id', deckController.destroy);
router.get('/:id/review', deckController.review);
router.post('/:id/review/:cardId/answer', deckController.answerAPI);

export default router;
