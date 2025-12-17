import express from 'express';
import * as vocabularyController from '../controllers/vocabularyController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

// Apply authentication to all vocabulary routes.
router.use(isAuthenticated);

// INDEX - show all vocabulary words (/vocabularies)(GET)
router.get('/', vocabularyController.index);

// NEW - form to create new word (/vocabularies/new)(GET)
// Must be defined before /:id to avoid "new" being treated as an id
router.get('/new', vocabularyController.newForm);

// CREATE (/vocabularies)(POST)
router.post('/', vocabularyController.create);

// SHOW - single word detail (/vocabularies/:id)(GET)
router.get('/:id', vocabularyController.show);

// EDIT - form to edit word (/vocabularies/:id/edit)(GET)
router.get('/:id/edit', vocabularyController.editForm);

// UPDATE (/vocabularies/:id)(PUT)
router.put('/:id', vocabularyController.update);

// DELETE (/vocabularies/:id)(DELETE)
router.delete('/:id', vocabularyController.deleteWord);

export default router;
