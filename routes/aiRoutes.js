// AI Routes - API endpoints for Gemini AI features (prefixed with /api/ai)
import express from 'express';
import { getWordInfo, getStatus } from '../controllers/aiController.js';
import { isAuthenticated } from '../middleware/auth.js';
import { aiRateLimiter, aiRateLimitStatus } from '../middleware/rateLimiter.js';

const router = express.Router();

router.use(isAuthenticated);

// Status endpoint includes rate limit info but doesn't count against quota
router.get('/status', aiRateLimitStatus, getStatus);

// Word info endpoint is rate limited
router.post('/word-info', aiRateLimiter, getWordInfo);

export default router;
