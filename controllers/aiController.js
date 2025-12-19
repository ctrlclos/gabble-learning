// AI Controller - handles requests for Gemini AI-powered features
import {
  generateWordInfo,
  checkApiAvailability,
} from '../services/geminiService.js';

// POST /api/ai/word-info - Get word translation, definition, and examples
export async function getWordInfo(req, res) {
  try {
    const { word, targetLanguage, nativeLanguage, interests } = req.body;

    if (!word || typeof word !== 'string' || word.trim().length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Word is required',
      });
    }

    const result = await generateWordInfo(word.trim(), {
      targetLanguage: targetLanguage || '',
      nativeLanguage: nativeLanguage || 'English',
      interests: interests || '',
    });

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Failed to get word information',
      });
    }

    res.json(result);

  } catch (error) {
    console.error('Get word info error:', error);
    res.status(500).json({
      success: false,
      error: 'An unexpected error occurred. Please try again.',
    });
  }
}

// GET /api/ai/status - Check if AI service is available
export async function getStatus(req, res) {
  try {
    const isAvailable = await checkApiAvailability();

    res.json({
      success: true,
      available: isAvailable,
      message: isAvailable
        ? 'AI service is available'
        : 'AI service is not configured or unavailable',
    });

  } catch (error) {
    console.error('AI status check error:', error);
    res.json({
      success: true,
      available: false,
      message: 'AI service check failed',
    });
  }
}

export default {
  getWordInfo,
  getStatus,
};
