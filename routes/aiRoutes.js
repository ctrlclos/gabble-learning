// AI Routes - API endpoints for Gemini AI features (prefixed with /api/ai)
import express from 'express';
import { getWordInfo, getStatus } from '../controllers/aiController.js';
import { isAuthenticated } from '../middleware/auth.js';

const router = express.Router();

router.use(isAuthenticated);

router.get('/status', getStatus);
router.post('/word-info', getWordInfo);

export default router;
