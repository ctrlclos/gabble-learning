/**
 * Rate Limiting Configuration
 *
 * Centralized configuration for API rate limits.
 * Modify these values to adjust rate limiting behavior.
 */

const rateLimitConfig = {
  // AI API endpoints rate limit
  ai: {
    // Maximum number of requests allowed per window
    maxRequests: parseInt(process.env.RATE_LIMIT_AI_MAX_REQUESTS, 10) || 2,

    // Time window in milliseconds (default: 24 hours)
    windowMs: parseInt(process.env.RATE_LIMIT_AI_WINDOW_MS, 10) || 24 * 60 * 60 * 1000,

    // Human-readable window description for error messages
    windowDescription: process.env.RATE_LIMIT_AI_WINDOW_DESC || 'day',

    // Error message shown when limit is exceeded
    message: 'You have reached your daily API limit. Please try again tomorrow.',

    // HTTP status code for rate limit exceeded
    statusCode: 429,
  },

  // Add more rate limit configurations here as needed
  // Example:
  // cards: {
  //   maxRequests: 100,
  //   windowMs: 60 * 60 * 1000, // 1 hour
  //   windowDescription: 'hour',
  //   message: 'Too many card operations. Please wait.',
  //   statusCode: 429,
  // },
};

export default rateLimitConfig;
