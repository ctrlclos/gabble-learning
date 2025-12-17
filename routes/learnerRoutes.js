import express from 'express';
import * as learnerController from '../controllers/learnerController.js';

const router = express.Router();

router.get('/', (req, res) => {
  res.render('learners/index', { title: 'Learners' });
});

export default router;
