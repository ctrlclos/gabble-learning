/**
 * SM-2 (SuperMemo 2) Spaced Repetition Algorithm
 *
 * Created by Piotr Wozniak in 1987 and published in "Optimization of learning" (1990).
 * Reference: https://super-memory.com/english/ol/sm2.htm
 *
 * The algorithm schedules reviews at optimal intervals to maximize long-term retention
 * by adjusting the gap between reviews based on how well the learner recalls the material.
 *
 * CORE FORMULAS:
 *
 * 1. Ease Factor (EF) adjustment after each review:
 *    EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
 *    Where:
 *      - q = quality of response (0-5)
 *      - EF minimum is limited to 1.3 to prevent "impossible" cards
 *
 * 2. Inter-repetition intervals:
 *    I(1) = 1 day                    (first successful review)
 *    I(2) = 6 days                   (second successful review)
 *    I(n) = I(n-1) * EF, for n > 2   (subsequent reviews)
 *
 * 3. Repetition count:
 *    - If q < 3 (failed): reset repetitions to 0, interval to 1 day
 *    - If q >= 3 (passed): increment repetitions by 1
 *
 * Quality ratings used in this implementation:
 *   0 = Again (complete blackout)
 *   3 = Hard  (correct with serious difficulty)
 *   4 = Good  (correct with some hesitation)
 *   5 = Easy  (perfect recall)
 */

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
