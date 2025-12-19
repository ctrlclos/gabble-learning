import mongoose from 'mongoose';

const deckSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Deck name is required'],
      trim: true,
      minLength: [1, 'Deck name cannot be empty'],
      maxLength: [100, 'Deck name cannot exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxLength: [500, 'Description cannot exceed 500 characters'],
      default: '',
    },
    isDefault: {
      type: Boolean,
      default: false,
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

// Compound index for efficient queries by owner
deckSchema.index({ createdBy: 1, name: 1 });

// Ensure only one default deck per user
deckSchema.index(
  { createdBy: 1, isDefault: 1 },
  {
    unique: true,
    partialFilterExpression: { isDefault: true },
  }
);

const Deck = mongoose.model('Deck', deckSchema);

export default Deck;
