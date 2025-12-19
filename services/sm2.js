// SM-2 Spaced Repetition Algorithm
// Schedules reviews at optimal intervals to maximize retention.
// Quality ratings: 0 (Again), 3 (Hard), 4 (Good), 5 (Easy)

// --- Main function ---

// Calculates new scheduling values after a review
export function calculateNextReview(currentValues, quality) {
  // easeFactor: The multiplier (e.g., 2.5) that determines how much the gap between reviews grows.
  // interval:   The actual number of days to wait until the next review.
  // repetitions: The count of consecutive successful reviews (resets to 0 on failure).
  const { easeFactor, interval, repetitions } = currentValues;

  if (quality < 0 || quality > 5) {
    throw new Error('Quality must be between 0 and 5');
  }

  const newRepetitions = calculateRepetitions(repetitions, quality);
  const newInterval = calculateInterval(interval, easeFactor, newRepetitions, quality);
  const newEaseFactor = calculateEaseFactor(easeFactor, quality);
  const nextReviewDate = calculateNextReviewDate(newInterval);

  return {
    easeFactor: newEaseFactor,
    interval: newInterval,
    repetitions: newRepetitions,
    nextReviewDate,
  };
}

// --- Helper functions ---

// Wrong answer (quality < 3): reset to 0. Correct: increment.
function calculateRepetitions(currentRepetitions, quality) {
  if (quality < 3) return 0;
  return currentRepetitions + 1;
}

// 1st correct: 1 day. 2nd correct: 6 days. After: interval * easeFactor.
function calculateInterval(currentInterval, easeFactor, newRepetitions, quality) {
  if (quality < 3) return 1;
  if (newRepetitions === 1) return 1;
  if (newRepetitions === 2) return 6;
  return Math.round(currentInterval * easeFactor);
}

// Adjusts ease factor based on quality. Min 1.3 to prevent impossible cards.
function calculateEaseFactor(currentEaseFactor, quality) {
  const adjustment = 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02);
  let newEaseFactor = currentEaseFactor + adjustment;
  if (newEaseFactor < 1.3) newEaseFactor = 1.3;
  return Math.round(newEaseFactor * 100) / 100;
}

// Returns date X days from now
function calculateNextReviewDate(intervalDays) {
  const nextDate = new Date();
  nextDate.setDate(nextDate.getDate() + intervalDays);
  return nextDate;
}

// --- Defaults ---

export const SM2_DEFAULTS = {
  easeFactor: 2.5,
  interval: 0,
  repetitions: 0,
};

export default { calculateNextReview, SM2_DEFAULTS };
