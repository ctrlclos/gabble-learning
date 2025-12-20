/**
 * RateLimitRecord Model
 *
 * Tracks API usage per user for rate limiting purposes.
 * Records are automatically cleaned up via TTL index.
 */

import mongoose from 'mongoose';

const rateLimitRecordSchema = new mongoose.Schema({
  // User who made the request
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Learner',
    required: true,
  },

  // Identifier for the rate limit category (e.g., 'ai', 'cards')
  category: {
    type: String,
    required: true,
    index: true,
  },

  // Number of requests made in the current window
  requestCount: {
    type: Number,
    default: 1,
    min: 0,
  },

  // When this window started
  windowStart: {
    type: Date,
    default: Date.now,
    required: true,
  },

  // When this record expires (for automatic cleanup)
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: 0 }, // TTL index - MongoDB automatically deletes expired documents
  },
});

// Compound index for efficient lookups by user and category
rateLimitRecordSchema.index({ userId: 1, category: 1 }, { unique: true });

/**
 * Check if the rate limit has been exceeded for a user in a category
 * @param {ObjectId} userId - The user's ID
 * @param {string} category - The rate limit category
 * @param {number} maxRequests - Maximum allowed requests
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { allowed: boolean, remaining: number, resetAt: Date, current: number }
 */
rateLimitRecordSchema.statics.checkAndIncrement = async function (
  userId,
  category,
  maxRequests,
  windowMs
) {
  const now = new Date();
  const windowStart = new Date(now.getTime());
  const expiresAt = new Date(now.getTime() + windowMs);

  // Find existing record or create new one
  let record = await this.findOne({ userId, category });

  if (record) {
    // Check if the current window has expired
    const windowEnd = new Date(record.windowStart.getTime() + windowMs);

    if (now >= windowEnd) {
      // Window expired, reset the record
      record.requestCount = 1;
      record.windowStart = windowStart;
      record.expiresAt = expiresAt;
      await record.save();

      return {
        allowed: true,
        remaining: maxRequests - 1,
        resetAt: expiresAt,
        current: 1,
      };
    }

    // Window still active
    if (record.requestCount >= maxRequests) {
      // Limit exceeded
      return {
        allowed: false,
        remaining: 0,
        resetAt: windowEnd,
        current: record.requestCount,
      };
    }

    // Increment and allow
    record.requestCount += 1;
    await record.save();

    return {
      allowed: true,
      remaining: maxRequests - record.requestCount,
      resetAt: windowEnd,
      current: record.requestCount,
    };
  }

  // No existing record, create new one
  record = await this.create({
    userId,
    category,
    requestCount: 1,
    windowStart,
    expiresAt,
  });

  return {
    allowed: true,
    remaining: maxRequests - 1,
    resetAt: expiresAt,
    current: 1,
  };
};

/**
 * Get current usage without incrementing
 * @param {ObjectId} userId - The user's ID
 * @param {string} category - The rate limit category
 * @param {number} maxRequests - Maximum allowed requests
 * @param {number} windowMs - Time window in milliseconds
 * @returns {Object} { remaining: number, resetAt: Date, current: number }
 */
rateLimitRecordSchema.statics.getUsage = async function (
  userId,
  category,
  maxRequests,
  windowMs
) {
  const now = new Date();
  const record = await this.findOne({ userId, category });

  if (!record) {
    return {
      remaining: maxRequests,
      resetAt: null,
      current: 0,
    };
  }

  const windowEnd = new Date(record.windowStart.getTime() + windowMs);

  if (now >= windowEnd) {
    // Window expired
    return {
      remaining: maxRequests,
      resetAt: null,
      current: 0,
    };
  }

  return {
    remaining: Math.max(0, maxRequests - record.requestCount),
    resetAt: windowEnd,
    current: record.requestCount,
  };
};

const RateLimitRecord = mongoose.model('RateLimitRecord', rateLimitRecordSchema);

export default RateLimitRecord;
