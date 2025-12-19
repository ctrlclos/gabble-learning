import mongoose from 'mongoose';
import { calculateNextReview, SM2_DEFAULTS } from '../services/sm2.js';

const cardSchema = new mongoose.Schema(
  {
    front: {
      type: String,
      required: [true, 'Front side is required'],
      trim: true,
    },
    back: {
      type: String,
      required: [true, 'Back side is required'],
      trim: true,
    },
    deck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Deck',
      default: null,
    },
    tags: {
      type: [String],
      default: [],
    },
    // SM-2 fields (see services/sm2.js)
    easeFactor: {
      type: Number,
      default: SM2_DEFAULTS.easeFactor,
      min: 1.3,
    },
    interval: {
      type: Number,
      default: SM2_DEFAULTS.interval,
    },
    repetitions: {
      type: Number,
      default: SM2_DEFAULTS.repetitions,
    },
    nextReviewDate: {
      type: Date,
      default: Date.now,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Learner',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Process review with SM-2. Quality: 0=Again, 3=Hard, 4=Good, 5=Easy
cardSchema.methods.processReview = function (quality) {
  const result = calculateNextReview(
    {
      easeFactor: this.easeFactor,
      interval: this.interval,
      repetitions: this.repetitions,
    },
    quality
  );

  this.easeFactor = result.easeFactor;
  this.interval = result.interval;
  this.repetitions = result.repetitions;
  this.nextReviewDate = result.nextReviewDate;

  return this;
};

// Indexes for efficient queries
cardSchema.index({ deck: 1, nextReviewDate: 1 });
cardSchema.index({ createdBy: 1, deck: 1 });
cardSchema.index({ createdBy: 1, nextReviewDate: 1 });
cardSchema.index({ tags: 1 });

const Card = mongoose.model('Card', cardSchema);

export default Card;
