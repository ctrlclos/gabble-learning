/**
 * Rate Limiter Middleware
 *
 * Provides configurable rate limiting for API endpoints.
 * Uses MongoDB to persist rate limit records across restarts.
 */

import RateLimitRecord from '../models/RateLimitRecord.js';
import rateLimitConfig from '../config/rateLimit.js';

/**
 * Creates a rate limiting middleware for a specific category
 * @param {string} category - The rate limit category (must exist in rateLimitConfig)
 * @returns {Function} Express middleware function
 */
export const createRateLimiter = (category) => {
  const config = rateLimitConfig[category];

  if (!config) {
    throw new Error(`Rate limit configuration not found for category: ${category}`);
  }

  return async (req, res, next) => {
    // Rate limiting requires authentication
    if (!req.session || !req.session.userId) {
      return res.status(401).json({
        error: 'Authentication required',
      });
    }

    try {
      const result = await RateLimitRecord.checkAndIncrement(
        req.session.userId,
        category,
        config.maxRequests,
        config.windowMs
      );

      // Set rate limit headers for client awareness
      res.set('X-RateLimit-Limit', config.maxRequests);
      res.set('X-RateLimit-Remaining', result.remaining);
      res.set('X-RateLimit-Reset', result.resetAt ? result.resetAt.toISOString() : '');

      if (!result.allowed) {
        res.set('Retry-After', Math.ceil((result.resetAt - new Date()) / 1000));

        return res.status(config.statusCode).json({
          error: config.message,
          retryAfter: result.resetAt.toISOString(),
          limit: config.maxRequests,
          windowDescription: config.windowDescription,
        });
      }

      next();
    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request to proceed (fail open)
      // This prevents rate limiting issues from blocking all requests
      next();
    }
  };
};

/**
 * Middleware to get rate limit status without incrementing
 * Useful for displaying remaining quota to users
 * @param {string} category - The rate limit category
 * @returns {Function} Express middleware function
 */
export const getRateLimitStatus = (category) => {
  const config = rateLimitConfig[category];

  if (!config) {
    throw new Error(`Rate limit configuration not found for category: ${category}`);
  }

  return async (req, res, next) => {
    if (!req.session || !req.session.userId) {
      req.rateLimitStatus = null;
      return next();
    }

    try {
      const status = await RateLimitRecord.getUsage(
        req.session.userId,
        category,
        config.maxRequests,
        config.windowMs
      );

      req.rateLimitStatus = {
        ...status,
        limit: config.maxRequests,
        windowDescription: config.windowDescription,
      };
    } catch (error) {
      console.error('Rate limit status error:', error);
      req.rateLimitStatus = null;
    }

    next();
  };
};

// Pre-configured rate limiters for convenience
export const aiRateLimiter = createRateLimiter('ai');
export const aiRateLimitStatus = getRateLimitStatus('ai');
